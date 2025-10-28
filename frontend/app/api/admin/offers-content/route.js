import { NextResponse } from 'next/server';
import { auth } from '../../auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';
import dbConnect from '../../../../lib/dbConnect';
import OfferContent from '../../../../models/OfferContent';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadBase64ToCloudinary(base64) {
  try {
    const res = await cloudinary.uploader.upload(base64, { folder: 'YARITU/offers', resource_type: 'image' });
    return res.secure_url || res.url;
  } catch (err) {
    console.error('Cloudinary upload error', err);
    throw err;
  }
}

export async function GET(req) {
  const session = await auth();
  if (!session || (!session.user?.isAdmin && session.user?.role !== 'admin')) {
    return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 403 });
  }

  try {
    await dbConnect();
    const items = await OfferContent.find({}).sort({ position: 1, createdAt: 1 }).lean();
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
  const { id, heading, subheading, discount, validity, image, imageBase64, imageName, position, store } = body;
    await dbConnect();

    let target = null;
    if (id) target = await OfferContent.findById(id);
    if (!target && typeof position === 'number') target = await OfferContent.findOne({ position: Number(position) });

    // upload imageBase64 to Cloudinary if provided
    let imageUrl = image;
    if (imageBase64) {
      imageUrl = await uploadBase64ToCloudinary(imageBase64);
    }

    if (target) {
      if (heading) target.heading = heading;
      if (subheading) target.subheading = subheading;
      if (discount) target.discount = discount;
      if (validity) target.validity = validity;
      if (typeof position !== 'undefined') target.position = Number(position);
      if (typeof store !== 'undefined') target.store = store;
      if (imageUrl) target.image = imageUrl;
      await target.save();
      return NextResponse.json({ success: true, data: target });
    }

    const newItem = await OfferContent.create({ heading: heading || '', subheading: subheading || '', discount: discount || '', validity: validity || '', image: imageUrl || '', position: typeof position === 'number' ? Number(position) : undefined, store: store || '' });
    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
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
    const removed = await OfferContent.findByIdAndDelete(id);
    if (!removed) return NextResponse.json({ success: false, message: 'Item not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: { id: removed._id } });
  } catch (err) {
    console.error('Delete offers content error', err);
    return NextResponse.json({ success: false, message: 'Could not delete data' }, { status: 500 });
  }
}
