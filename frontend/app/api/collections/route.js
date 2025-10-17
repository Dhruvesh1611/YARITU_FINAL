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

    // --- NAYA PARALLEL UPLOAD LOGIC ---
    
    // 1. Saari image upload promises ko ek array mein collect karo
    const uploadPromises = [];
    
    // Main Image
    if (files.mainImage) {
      uploadPromises.push(processImage(files.mainImage));
    } else {
      uploadPromises.push(Promise.resolve(null)); // mainImage ke liye placeholder
    }

    // Main Image 2 (Aapke code mein yeh tha)
    if (files.mainImage2) {
      uploadPromises.push(processImage(files.mainImage2));
    } else {
      uploadPromises.push(Promise.resolve(null)); // mainImage2 ke liye placeholder
    }

    // Other Images
    if (files.otherImages) {
        const otherImageFiles = Array.isArray(files.otherImages) ? files.otherImages : [files.otherImages];
        otherImageFiles.forEach(file => {
            uploadPromises.push(processImage(file));
        });
    }

    // 2. Saari promises ko ek saath (parallel) run karo
    // Isse 6 images upload karne mein utna hi time lagega jitna 1 mein lagta hai
    const uploadResults = await Promise.all(uploadPromises);

    // 3. Results ko alag-alag karo
    let imageUrl = '';
    if (uploadResults[0]) { // mainImage ka result
      imageUrl = uploadResults[0].secure_url;
    }

    let imageUrl2 = '';
    if (uploadResults[1]) { // mainImage2 ka result
      imageUrl2 = uploadResults[1].secure_url;
    }
    
    // Baaki ke results 'otherImages' ke hain
    let otherImageUrls = [];
    if (uploadResults.length > 2) {
      otherImageUrls = uploadResults.slice(2) // Pehle 2 (main, main2) ko chhodkar
        .filter(result => result) // Null results (agar koi fail hua) ko hatao
        .map(result => result.secure_url);
    }
    // --- END OF NAYA LOGIC ---

    
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
    // Yeh error handling humne pehle fix kiya tha (yeh sahi hai)
    console.error("Error in POST /api/collections:", err);
    const errorMessage = err.message || String(err); 
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}