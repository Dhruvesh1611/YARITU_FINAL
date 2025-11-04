import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import HeroImage from '../../../../models/HeroImage';
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

    // fetch existing so we can cleanup old S3 object if image changed
    const existing = await HeroImage.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const oldImage = existing.imageUrl;

    const updated = await HeroImage.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    // If imageUrl was updated/removed by the client, delete the old S3 object (best-effort)
    if (Object.prototype.hasOwnProperty.call(body, 'imageUrl')) {
      const newImage = body.imageUrl;
      if (oldImage && oldImage !== newImage && isS3Url(oldImage)) {
        try {
          await deleteObjectByUrl(oldImage);
        } catch (e) {
          console.error('Failed to delete old hero image from S3', e);
        }
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
    const existing = await HeroImage.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    // best-effort: delete S3 image if stored on our bucket
    try {
      if (existing.imageUrl && isS3Url(existing.imageUrl)) {
        await deleteObjectByUrl(existing.imageUrl);
      }
    } catch (e) {
      console.error('Failed to delete hero image from S3 during DELETE', e);
    }

    const deleted = await HeroImage.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
