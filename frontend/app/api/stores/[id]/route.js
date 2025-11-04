import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Store from '../../../../models/Store';
import { auth } from '../../../../app/api/auth/[...nextauth]/route';
import { deleteObjectByUrl, isS3Url } from '../../../../lib/s3';
// Ensure this route runs in a Node runtime (required by mongoose/aws-sdk)
export const runtime = 'nodejs';

export async function PUT(request, context) {
  // In Next.js App Router dynamic API routes, params may be async - await them if needed
  const { params } = context;
  const { id } = await params;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  const isAdmin = !!(session?.user?.isAdmin || session?.user?.role === 'admin');
  if (!isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  await dbConnect();

  try {
    // Fetch existing store so we can decide if old S3 objects need removal
    const existing = await Store.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    const oldImageUrl = existing.imageUrl;
    const oldImages = Array.isArray(existing.images) ? existing.images : [];

    const store = await Store.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!store) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    // If client intended to update imageUrl (body contains the field) and the old image differs
    if (Object.prototype.hasOwnProperty.call(body, 'imageUrl')) {
      const newImageUrl = body.imageUrl;
      if (oldImageUrl && oldImageUrl !== newImageUrl && isS3Url(oldImageUrl)) {
        // best-effort delete; do not fail the whole request if delete fails
        try {
          await deleteObjectByUrl(oldImageUrl);
        } catch (e) {
          console.error('Failed deleting old main image from S3:', e);
        }
      }
    }

    // If client sent images array, delete any old image urls that are no longer present
    if (Object.prototype.hasOwnProperty.call(body, 'images')) {
      const newImages = Array.isArray(body.images) ? body.images : [];
      const toDelete = oldImages.filter((u) => u && !newImages.includes(u) && isS3Url(u));
      for (const u of toDelete) {
        try {
          await deleteObjectByUrl(u);
        } catch (e) {
          console.error('Failed deleting old image from S3:', u, e);
        }
      }
    }

    return NextResponse.json({ success: true, data: store });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  const { params } = context;
  const { id } = await params;

  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  const isAdmin = !!(session?.user?.isAdmin || session?.user?.role === 'admin');
  if (!isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const store = await Store.findById(id);
    if (!store) {
      return NextResponse.json({ success: false, message: 'Store not found' }, { status: 404 });
    }

    // Attempt to delete images from S3 (best-effort)
    try {
      if (store.imageUrl && isS3Url(store.imageUrl)) {
        await deleteObjectByUrl(store.imageUrl);
      }
      if (Array.isArray(store.images)) {
        for (const u of store.images) {
          if (u && isS3Url(u)) {
            try { await deleteObjectByUrl(u); } catch (e) { console.error('Failed to delete store image from S3', u, e); }
          }
        }
      }
    } catch (e) {
      // ignore S3 deletion errors - we'll still remove DB record
      console.error('S3 cleanup error while deleting store:', e);
    }

    const deleted = await Store.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}