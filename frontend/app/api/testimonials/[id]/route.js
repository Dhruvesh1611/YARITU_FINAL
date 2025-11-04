import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Testimonial from '../../../../models/Testimonial';
import { auth } from '../../auth/[...nextauth]/route';
import { deleteObjectByUrl, isS3Url } from '../../../../lib/s3';
export const runtime = 'nodejs';

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  if (!session.user?.isAdmin && session.user?.role !== 'admin') return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });

  try {
    await dbConnect();
    const { id } = params;
    const body = await request.json();

    const existing = await Testimonial.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    const oldAvatar = existing.avatarUrl;

    const updated = await Testimonial.findByIdAndUpdate(id, { name: body.name, quote: body.quote, rating: body.rating, avatarUrl: body.avatarUrl }, { new: true });
    if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    if (Object.prototype.hasOwnProperty.call(body, 'avatarUrl')) {
      const newAvatar = body.avatarUrl;
      if (oldAvatar && oldAvatar !== newAvatar && isS3Url(oldAvatar)) {
        try { await deleteObjectByUrl(oldAvatar); } catch (e) { console.error('Failed deleting old testimonial avatar from S3', e); }
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  if (!session.user?.isAdmin && session.user?.role !== 'admin') return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });

  try {
    await dbConnect();
    const { id } = params;
    const existing = await Testimonial.findById(id);
    if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    try { if (existing.avatarUrl && isS3Url(existing.avatarUrl)) await deleteObjectByUrl(existing.avatarUrl); } catch (e) { console.error('Failed deleting testimonial avatar from S3', e); }

    const deleted = await Testimonial.findByIdAndDelete(id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
