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
    
    // Accept newOptions sent either as an object (some clients) or as
    // FormData bracketed keys like `newOptions[occasion]=...`.
    const collectNewOptions = async () => {
      const collected = {};

      // Case 1: fields.newOptions already an object (server-side clients)
      if (fields.newOptions && typeof fields.newOptions === 'object') {
        Object.assign(collected, fields.newOptions);
      }

      // Case 2: FormData may have keys like 'newOptions[foo]'
      for (const [k, v] of Object.entries(fields)) {
        const m = k.match(/^newOptions\[(.+)\]$/);
        if (m) {
          const optKey = m[1];
          // Try to parse JSON value else take as string
          let parsed = v;
          try { parsed = JSON.parse(v); } catch (e) { /* keep string */ }
          collected[optKey] = parsed;
        }
      }

      // Create MetaOption docs for any collected entries
      const entries = Object.entries(collected);
      await Promise.all(entries.map(async ([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        try {
          await MetaOption.create({ key, value });
        } catch (e) {
          // ignore duplicates / validation errors
        }
      }));
    };

    await collectNewOptions();

    let imageUrl = '';
    if (files.mainImage) {
      const mainImageFile = files.mainImage;
      const result = await processImage(mainImageFile);
      if (result) {
        imageUrl = result.secure_url;
      }
    }

    let imageUrl2 = '';
    if (files.mainImage2) {
      const mainImage2File = files.mainImage2;
      const result = await processImage(mainImage2File);
      if (result) {
        imageUrl2 = result.secure_url;
      }
    }

    let otherImageUrls = [];
    if (files.otherImages) {
        const otherImageFiles = Array.isArray(files.otherImages) ? files.otherImages : [files.otherImages];
        for (const file of otherImageFiles) {
            const result = await processImage(file);
            if (result) {
                otherImageUrls.push(result.secure_url);
            }
        }
    }
    
    await dbConnect();

    const newCollectionData = { 
        ...fields, 
        mainImage: imageUrl,
        mainImage2: imageUrl2,
        otherImages: otherImageUrls
    };
    const doc = await Collection.create(newCollectionData);

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/collections:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 400 });
  }
}