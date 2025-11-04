import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Jewellery from '../../../../models/Jewellery';
import { auth } from '../../auth/[...nextauth]/route';
import { deleteObjectByUrl, isS3Url } from '../../../../lib/s3';
export const runtime = 'nodejs';

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
    const body = await request.json().catch(() => ({}));
    // Accept id either in the JSON body or as a query param (some clients send ?id=...)
    const url = typeof request.url === 'string' ? new URL(request.url) : null;
    const qid = url ? url.searchParams.get('id') : null;
    const { id: bodyId, ...updates } = body || {};
    const id = bodyId || qid;
    if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    // Fetch existing doc so we can perform S3 cleanup for replaced images
    const existing = await Jewellery.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    // Best-effort: if mainImage is replaced, delete old S3 object
    try {
      if (typeof updates.mainImage !== 'undefined' && existing.mainImage && existing.mainImage !== updates.mainImage && isS3Url(existing.mainImage)) {
        await deleteObjectByUrl(existing.mainImage);
      }
    } catch (e) {
      console.error('Failed to delete jewellery mainImage from S3 during PUT', e);
    }

    // Best-effort: if otherImages array provided, delete images that were removed
    try {
      if (Array.isArray(updates.otherImages)) {
        const newList = updates.otherImages || [];
        const removed = (existing.otherImages || []).filter(u => u && !newList.includes(u));
        await Promise.all(removed.map(async (u) => {
          try { if (isS3Url(u)) await deleteObjectByUrl(u); } catch (er) { console.error('Failed to delete jewellery otherImage from S3 during PUT', er); }
        }));
      }
    } catch (e) {
      console.error('Failed to clean jewellery otherImages during PUT', e);
    }

    const doc = await Jewellery.findByIdAndUpdate(id, updates, { new: true });
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
    // Fetch existing doc to delete stored images from S3
    const existing = await Jewellery.findById(id);
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    try {
      if (existing.mainImage && isS3Url(existing.mainImage)) {
        await deleteObjectByUrl(existing.mainImage);
      }
    } catch (e) {
      console.error('Failed to delete jewellery mainImage from S3 during DELETE', e);
    }

    try {
      const others = existing.otherImages || [];
      await Promise.all(others.map(async (u) => {
        try { if (u && isS3Url(u)) await deleteObjectByUrl(u); } catch (er) { console.error('Failed to delete jewellery otherImage from S3 during DELETE', er); }
      }));
    } catch (e) {
      console.error('Failed to delete jewellery otherImages during DELETE', e);
    }

    await Jewellery.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('DELETE admin/jewellery', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
