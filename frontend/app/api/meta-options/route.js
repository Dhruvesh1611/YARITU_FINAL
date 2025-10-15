// app/api/meta-options/route.js
import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import MetaOption from '../../../models/MetaOption';

export async function GET() {
  try {
    await dbConnect();
    const items = await MetaOption.find({}).sort({ key: 1, value: 1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error('Error fetching meta-options', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
