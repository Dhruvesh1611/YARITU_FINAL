import { NextResponse } from 'next/server';
import { auth } from '../../auth/[...nextauth]/route';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.resolve(process.cwd(), 'data', 'offers.json');
const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads', 'offers');

function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeData(items) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

export async function GET(req) {
  const session = await auth();
  if (!session || (!session.user?.isAdmin && session.user?.role !== 'admin')) {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  try {
    const items = readData();
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
    const { id, heading, subheading, discount, validity, image, imageBase64, imageName } = body;
    const items = readData();

    let target;
    if (typeof id !== 'undefined' && id !== null) {
      // update existing
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
      target = items[idx];
      if (heading) target.heading = heading;
      if (subheading) target.subheading = subheading;
      if (discount) target.discount = discount;
      if (validity) target.validity = validity;

      // handle imageBase64
      if (imageBase64 && imageName) {
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        // data:<mime>;base64,<data>
        const parts = imageBase64.split(',');
        const matches = parts[0].match(/data:(.+);base64/);
        const ext = imageName.split('.').pop() || (matches ? matches[1].split('/').pop() : 'png');
        const filename = `offer-${id}-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        const buffer = Buffer.from(parts[1] || '', 'base64');
        fs.writeFileSync(filePath, buffer);
        target.image = `/uploads/offers/${filename}`;
      } else if (image) {
        target.image = image;
      }

      items[idx] = target;
      writeData(items);
      return NextResponse.json({ success: true, data: target });
    } else {
      // create new item
      const newId = items.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
  const newItem = { id: newId, heading: heading || '', subheading: subheading || '', discount: discount || '', validity: validity || '', image: image || `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME}/image/upload/v1759495226/reel3_fr67pj.png` };

      if (imageBase64 && imageName) {
        if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        const parts = imageBase64.split(',');
        const matches = parts[0].match(/data:(.+);base64/);
        const ext = imageName.split('.').pop() || (matches ? matches[1].split('/').pop() : 'png');
        const filename = `offer-${newId}-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        const buffer = Buffer.from(parts[1] || '', 'base64');
        fs.writeFileSync(filePath, buffer);
        newItem.image = `/uploads/offers/${filename}`;
      }

      items.push(newItem);
      writeData(items);
      return NextResponse.json({ success: true, data: newItem }, { status: 201 });
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

    const items = readData();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });

    const removed = items.splice(idx, 1)[0];
    writeData(items);
    return NextResponse.json({ success: true, data: { id: removed.id } });
  } catch (err) {
    console.error('Delete offers content error', err);
    return NextResponse.json({ success: false, message: 'Could not delete data' }, { status: 500 });
  }
}
