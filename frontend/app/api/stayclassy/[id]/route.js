import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import StayClassyImage from '../../../../models/StayClassyImage';
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

    const existing = await StayClassyImage.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const oldUrl = existing.imageUrl;

    const updated = await StayClassyImage.findByIdAndUpdate(id, body, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    if (Object.prototype.hasOwnProperty.call(body, 'imageUrl')) {
      const newUrl = body.imageUrl;
      if (oldUrl && oldUrl !== newUrl && isS3Url(oldUrl)) {
        try { await deleteObjectByUrl(oldUrl); } catch (e) { console.error('Failed deleting old StayClassy image from S3', e); }
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
