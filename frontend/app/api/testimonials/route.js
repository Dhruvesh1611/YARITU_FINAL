import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Testimonial from '../../../models/Testimonial';
import { auth } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    await dbConnect();
    const items = await Testimonial.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  // optional: restrict to admins only
  if (!session.user?.isAdmin && session.user?.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    if (!body.name || !body.quote) return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    const created = await Testimonial.create({ name: body.name, quote: body.quote, rating: body.rating || 5, avatarUrl: body.avatarUrl || '' });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
