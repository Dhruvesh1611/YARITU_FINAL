// app/api/collections/route.js

import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Collection from '../../../models/Collection';
import MetaOption from '../../../models/MetaOption';
import { auth } from '../auth/[...nextauth]/route';
import { parseForm, processImage } from '../../../lib/parseForm';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await dbConnect();
    const items = await Collection.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { fields, files } = await parseForm(request);
    
    if (fields.newOptions && typeof fields.newOptions === 'object') {
      const entries = Object.entries(fields.newOptions);
      await Promise.all(entries.map(async ([key, value]) => {
        if (!value) return;
        try { await MetaOption.create({ key, value }); } catch (e) { /* ignore dupes */ }
      }));
    }

    let imageUrl = '';
    if (files.mainImage) {
      const mainImageFile = files.mainImage;
      const result = await processImage(mainImageFile);
      if (result) {
        imageUrl = result.secure_url;
      }
    }
    
    await dbConnect();

    const newCollectionData = { ...fields, mainImage: imageUrl };
    const doc = await Collection.create(newCollectionData);

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/collections:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 400 });
  }
}