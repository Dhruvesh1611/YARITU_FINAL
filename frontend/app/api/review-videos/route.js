import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import ReviewVideo from '../../../models/ReviewVideo';

export async function GET() {
  try {
    await dbConnect();
    const items = await ReviewVideo.find({}).sort({ position: 1, createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Expected array' }, { status: 400 });
    }
    // Replace all for simplicity
    await ReviewVideo.deleteMany({});
    const docs = await ReviewVideo.insertMany(body.map((x, idx) => ({ src: x.src, thumbnail: x.thumbnail || '', position: idx })));
    return NextResponse.json({ success: true, data: docs });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
