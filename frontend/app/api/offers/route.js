import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Offer from '../../../models/Offer';

export async function GET() {
  try {
    await dbConnect();
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: offers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const newOffer = await Offer.create({ name, email, phone });

    return NextResponse.json({ success: true, data: newOffer }, { status: 201 });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
