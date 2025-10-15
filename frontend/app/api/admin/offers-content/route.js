import { NextResponse } from 'next/server';
import { auth } from '../../auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';
import dbConnect from '../../../../lib/dbConnect';
import OfferContent from '../../../../models/OfferContent';

const DATA_PATH = path.resolve(process.cwd(), 'data', 'offers.json');
const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads', 'offers');

function readDataFile() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

async function migrateFromFileIfNeeded() {
  // If DB is empty and data file has items, migrate them into MongoDB
  const count = await OfferContent.estimatedDocumentCount().exec();
  if (count === 0) {
    const items = readDataFile();
    if (Array.isArray(items) && items.length > 0) {
      const docs = items.map(it => ({
        heading: it.heading || it.title || '',
        subheading: it.subheading || '',
        discount: it.discount || '',
        validity: it.validity || '',
        image: it.image || '/images/placeholder.png',
        store: it.store || '',
      }));
      try {
        await OfferContent.insertMany(docs);
      } catch (e) {
        console.warn('Migration to OfferContent failed', e);
      }
    }
  }
}

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET(req) {
  const session = await auth();
  if (!session || (!session.user?.isAdmin && session.user?.role !== 'admin')) {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    await migrateFromFileIfNeeded();
    const items = await OfferContent.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error('Read offers content error', err);
    return NextResponse.json({ success: false, message: 'Could not read data' }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!session || (!session.user?.isAdmin && session.user?.role !== 'admin')) {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, heading, subheading, discount, validity, image, imageBase64, imageName, store } = body;
    await dbConnect();
    ensureUploadDir();

    if (typeof id !== 'undefined' && id !== null) {
      // update existing by _id or numeric id fallback
      const query = { $or: [{ _id: id }, { _id: String(id) }] };
      let target = await OfferContent.findOne(query).exec();
      if (!target) {
        // try numeric id match by migrating logic not guaranteed; fall back to findOne by heading
        target = await OfferContent.findById(id).exec();
      }
      if (!target) return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });

      if (heading) target.heading = heading;
      if (subheading) target.subheading = subheading;
      if (discount) target.discount = discount;
      if (validity) target.validity = validity;
      if (typeof store === 'string') target.store = store;

      if (imageBase64 && imageName) {
        // data:<mime>;base64,<data>
        const parts = imageBase64.split(',');
        const matches = parts[0].match(/data:(.+);base64/);
        const ext = imageName.split('.').pop() || (matches ? matches[1].split('/').pop() : 'png');
        const filename = `offer-${target._id}-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        const buffer = Buffer.from(parts[1] || '', 'base64');
        fs.writeFileSync(filePath, buffer);
        target.image = `/uploads/offers/${filename}`;
      } else if (image) {
        target.image = image;
      }

      await target.save();
      return NextResponse.json({ success: true, data: target });
    } else {
      // create new item
      const doc = new OfferContent({
        heading: heading || '',
        subheading: subheading || '',
        discount: discount || '',
        validity: validity || '',
        image: image || '/images/placeholder.png',
        store: store || '',
      });

      if (imageBase64 && imageName) {
        const parts = imageBase64.split(',');
        const matches = parts[0].match(/data:(.+);base64/);
        const ext = imageName.split('.').pop() || (matches ? matches[1].split('/').pop() : 'png');
        const filename = `offer-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        const buffer = Buffer.from(parts[1] || '', 'base64');
        fs.writeFileSync(filePath, buffer);
        doc.image = `/uploads/offers/${filename}`;
      }

      await doc.save();
      return NextResponse.json({ success: true, data: doc }, { status: 201 });
    }
  } catch (err) {
    console.error('Save offers content error', err);
    return NextResponse.json({ success: false, message: 'Could not save data' }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await auth();
  if (!session || (!session.user?.isAdmin && session.user?.role !== 'admin')) {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id } = body || {};
    if (typeof id === 'undefined' || id === null) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
    }

    await dbConnect();
    const removed = await OfferContent.findByIdAndDelete(id).lean();
    if (!removed) return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: removed._id } });
  } catch (err) {
    console.error('Delete offers content error', err);
    return NextResponse.json({ success: false, message: 'Could not delete data' }, { status: 500 });
  }
}
