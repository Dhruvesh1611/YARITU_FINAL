import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import StayClassyImage from '../../../models/StayClassyImage';

export const revalidate = 60;

export async function GET() {
  try {
    await dbConnect();
    const items = await StayClassyImage.find({}).sort({ createdAt: 1 });
    return NextResponse.json(
      { success: true, data: items },
      { status: 200, headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { auth } = await import('../../../app/api/auth/[...nextauth]/route');
  const session = await auth();
  if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

  try {
    await dbConnect();
    const body = await request.json();
    const created = await StayClassyImage.create(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
