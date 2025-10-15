import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Jewellery from '../../../../models/Jewellery';
import { auth } from '../../auth/[...nextauth]/route';

async function requireAdmin() {
  try {
    const session = await auth();
    if (!session || (!session.user?.isAdmin && session.user?.role !== 'admin')) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET() {
  try {
    await dbConnect();
    const items = await Jewellery.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: items }, { status: 200 });
  } catch (err) {
    console.error('GET admin/jewellery', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const allowed = await requireAdmin(request);
    if (!allowed) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const body = await request.json();
    const { name, store, price, discountedPrice, status, mainImage, otherImages } = body;
    if (!name) return NextResponse.json({ success: false, error: 'Name required' }, { status: 400 });

    const doc = await Jewellery.create({ name, store, price, discountedPrice, status, mainImage, otherImages: otherImages || [] });
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err) {
    console.error('POST admin/jewellery', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const allowed = await requireAdmin(request);
    if (!allowed) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    const doc = await Jewellery.findByIdAndUpdate(id, updates, { new: true });
    if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: doc }, { status: 200 });
  } catch (err) {
    console.error('PUT admin/jewellery', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const allowed = await requireAdmin(request);
    if (!allowed) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    await dbConnect();
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    const doc = await Jewellery.findByIdAndDelete(id);
    if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('DELETE admin/jewellery', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
