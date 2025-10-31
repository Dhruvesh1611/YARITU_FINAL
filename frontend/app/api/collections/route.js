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

      // Support JSON-based submissions (front-end uploads images directly to Cloudinary and sends URLs)
      const contentType = (request.headers.get('content-type') || '').toLowerCase();
      let fields = {};
      let files = {};
      if (contentType.includes('application/json')) {
        fields = await request.json();
      } else {
        const parsed = await parseForm(request);
        fields = parsed.fields || {};
        files = parsed.files || {};
      }
    
    // Meta options ko collect karne ka logic (yeh sahi hai)
    const collectNewOptions = async () => {
      const collected = {};
      if (fields.newOptions && typeof fields.newOptions === 'object') {
        Object.assign(collected, fields.newOptions);
      }
      for (const [k, v] of Object.entries(fields)) {
        const m = k.match(/^newOptions\[(.+)\]$/);
        if (m) {
          const optKey = m[1];
          let parsed = v;
          try { parsed = JSON.parse(v); } catch (e) { /* keep string */ }
          collected[optKey] = parsed;
        }
      }
      const entries = Object.entries(collected);
      await Promise.all(entries.map(async ([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        try {
          await MetaOption.create({ key, value });
        } catch (e) { /* ignore duplicates */ }
      }));
    };
    await collectNewOptions(); // Meta options ko save hone do

    // --- Improved parallel upload logic ---
    // Helper to normalize single vs array file inputs and return the first File or null
    const pickFirstFile = (f) => {
      if (!f) return null;
      return Array.isArray(f) ? f[0] : f;
    };

    // Upload only when a File-like object exists. Keep promises grouped so we can
    // map results back to keys. Also allow `fields` to supply a pre-uploaded URL
    // (when frontend uploads directly to Cloudinary and sends URLs).
    const mainFile = pickFirstFile(files.mainImage);
    const mainFile2 = pickFirstFile(files.mainImage2);
    const otherFiles = files.otherImages
      ? (Array.isArray(files.otherImages) ? files.otherImages : [files.otherImages])
      : [];

    const uploadPromises = [];
    // store keys so we know which result belongs where
    const keys = [];

    if (mainFile) { uploadPromises.push(processImage(mainFile)); keys.push('main'); }
    else { keys.push('main'); uploadPromises.push(Promise.resolve(null)); }

    if (mainFile2) { uploadPromises.push(processImage(mainFile2)); keys.push('main2'); }
    else { keys.push('main2'); uploadPromises.push(Promise.resolve(null)); }

    // other images - upload each (or none)
    for (let i = 0; i < otherFiles.length; i++) {
      uploadPromises.push(processImage(otherFiles[i]));
      keys.push(`other_${i}`);
    }

    const uploadResults = await Promise.all(uploadPromises);

    // Map results back to named variables
    let imageUrl;
    let imageUrl2;
    const otherImageUrls = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const res = uploadResults[i];
      if (!res) continue;
      if (key === 'main') imageUrl = res.secure_url;
      else if (key === 'main2') imageUrl2 = res.secure_url;
      else if (key.startsWith('other_')) otherImageUrls.push(res.secure_url);
    }

    // If the frontend sent pre-uploaded URLs in JSON fields, prefer those when
    // upload didn't happen or failed. This supports both flow: upload-from-client
    // and upload-from-server.
    // Accept several common key names the client may send.
    if (!imageUrl) imageUrl = fields.mainImage || fields.imageUrl || fields.mainImageUrl || fields.image;
    if (!imageUrl2) imageUrl2 = fields.mainImage2 || fields.mainImage2Url || fields.mainImage2Url || fields.mainImage2;
    if (otherImageUrls.length === 0 && fields.otherImages) {
      try {
        // otherImages may be a JSON string or already an array
        otherImageUrls.push(...(typeof fields.otherImages === 'string' ? JSON.parse(fields.otherImages) : fields.otherImages));
      } catch (e) {
        // if parse fails, ignore and keep empty
      }
    }
    // --- End improved upload logic ---

    
    await dbConnect();

    // Build newCollectionData but only include image fields when we actually
    // have a URL. This prevents saving empty strings or undefined which
    // trigger Mongoose `required` validation.
    const newCollectionData = { ...fields };
    if (imageUrl) newCollectionData.mainImage = imageUrl;
    if (imageUrl2) newCollectionData.mainImage2 = imageUrl2;
    if (otherImageUrls && otherImageUrls.length) newCollectionData.otherImages = otherImageUrls;

    // If mainImage is required by the model, ensure we have it (either uploaded
    // or provided in fields). If not, return a clear client error instead of
    // letting Mongoose return a generic validation error.
    if (!newCollectionData.mainImage) {
      return NextResponse.json({ success: false, error: "mainImage is required" }, { status: 400 });
    }
    const doc = await Collection.create(newCollectionData);

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err) {
    // Yeh error handling humne pehle fix kiya tha (yeh sahi hai)
    console.error("Error in POST /api/collections:", err);
    const errorMessage = err.message || String(err); 
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}