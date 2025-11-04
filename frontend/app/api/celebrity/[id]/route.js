import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import CelebrityVideo from '../../../../models/CelebrityVideo';
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

    // fetch existing so we can clean up old S3 object if videoUrl changed
    const existing = await CelebrityVideo.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const oldUrl = existing.videoUrl;

    const updated = await CelebrityVideo.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    if (Object.prototype.hasOwnProperty.call(body, 'videoUrl')) {
      const newUrl = body.videoUrl;
      if (oldUrl && oldUrl !== newUrl && isS3Url(oldUrl)) {
        try { await deleteObjectByUrl(oldUrl); } catch (e) { console.error('Failed deleting old celebrity video from S3', e); }
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
    const existing = await CelebrityVideo.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    try {
      if (existing.videoUrl && isS3Url(existing.videoUrl)) {
        await deleteObjectByUrl(existing.videoUrl);
      }
    } catch (e) { console.error('Failed to delete celebrity video from S3', e); }

    const deleted = await CelebrityVideo.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
