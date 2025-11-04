import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import FeaturedImage from '../../../../models/FeaturedImage';
import { auth } from '../../../../app/api/auth/[...nextauth]/route';
import { deleteObjectByUrl, isS3Url } from '../../../../lib/s3';
export const runtime = 'nodejs';

export async function PUT(request, context) {
  const { params } = context;
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

  try {
    await dbConnect();
    const body = await request.json();

    const existing = await FeaturedImage.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const oldSrc = existing.src;

    const updated = await FeaturedImage.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    if (Object.prototype.hasOwnProperty.call(body, 'src')) {
      const newSrc = body.src;
      if (oldSrc && oldSrc !== newSrc && isS3Url(oldSrc)) {
        try { await deleteObjectByUrl(oldSrc); } catch (e) { console.error('Failed deleting old featured image from S3', e); }
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(request, context) {
  const { params } = context;
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

  try {
    await dbConnect();
    const existing = await FeaturedImage.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    try { if (existing.src && isS3Url(existing.src)) await deleteObjectByUrl(existing.src); } catch (e) { console.error('Failed deleting featured image from S3', e); }
    const deleted = await FeaturedImage.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
