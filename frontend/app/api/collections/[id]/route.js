// app/api/collections/[id]/route.js

import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import Collection from '../../../../models/Collection';
import MetaOption from '../../../../models/MetaOption';
import { auth } from '../../auth/[...nextauth]/route';
import { parseForm, processImage } from '../../../../lib/parseForm';
import { deleteObjectByUrl, isS3Url } from '../../../../lib/s3';
export const runtime = 'nodejs';
export const revalidate = 60;

export async function GET(request, { params }) {
    const { id } = params;
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    try {
      await dbConnect();
      const item = await Collection.findById(id).lean();
      if (!item) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  return NextResponse.json(
    { success: true, data: item },
    { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
  );
    } catch (err) {
      console.error(err);
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
  
  try {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Support JSON-based submissions where client uploads images to Cloudinary directly
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

    if (fields.newOptions && typeof fields.newOptions === 'object') {
      const entries = Object.entries(fields.newOptions);
      await Promise.all(entries.map(async ([key, value]) => {
        if (!value) return;
        try { await MetaOption.create({ key, value }); } catch (e) { /* ignore */ }
      }));
    }

    const updateData = { ...fields, updatedAt: new Date() };
    
    if (files.mainImage) {
    const mainImageFile = files.mainImage;
    const result = await processImage(mainImageFile, fields.folder);
    if (result) {
      updateData.mainImage = result.secure_url;
    }
  } else if (fields.imageUrl) {
    updateData.mainImage = fields.imageUrl;
  }

  if (files.mainImage2) {
    const mainImage2File = files.mainImage2;
    const result = await processImage(mainImage2File, fields.folder);
    if (result) {
      updateData.mainImage2 = result.secure_url;
    }
  } else if (fields.mainImage2Url) {
    updateData.mainImage2 = fields.mainImage2Url;
  }

  let otherImageUrls = [];
  if (fields['otherImages'] && Array.isArray(fields['otherImages'])) {
    otherImageUrls = fields['otherImages'];
  } else if (fields['otherImagesUrls[]']) {
    otherImageUrls = Array.isArray(fields['otherImagesUrls[]']) ? fields['otherImagesUrls[]'] : [fields['otherImagesUrls[]']];
  }

  if (files.otherImages) {
    const otherImageFiles = Array.isArray(files.otherImages) ? files.otherImages : [files.otherImages];
    for (const file of otherImageFiles) {
      const result = await processImage(file, fields.folder);
      if (result) {
        otherImageUrls.push(result.secure_url);
      }
    }
  }
  updateData.otherImages = otherImageUrls;

    await dbConnect();

    // fetch existing before update so we can cleanup S3 objects that were removed
    const existing = await Collection.findById(id).lean();

    const updated = await Collection.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    // Best-effort cleanup: if mainImage/mainImage2/otherImages were changed/removed, delete the old S3 objects
    try {
      if (existing) {
        // mainImage
        if (Object.prototype.hasOwnProperty.call(updateData, 'mainImage')) {
          const oldMain = existing.mainImage;
          const newMain = updateData.mainImage;
          if (oldMain && oldMain !== newMain && isS3Url(oldMain)) {
            try { await deleteObjectByUrl(oldMain); } catch (e) { console.error('Failed deleting old collection mainImage', e); }
          }
        }

        // mainImage2
        if (Object.prototype.hasOwnProperty.call(updateData, 'mainImage2')) {
          const oldMain2 = existing.mainImage2;
          const newMain2 = updateData.mainImage2;
          if (oldMain2 && oldMain2 !== newMain2 && isS3Url(oldMain2)) {
            try { await deleteObjectByUrl(oldMain2); } catch (e) { console.error('Failed deleting old collection mainImage2', e); }
          }
        }

        // otherImages: remove any urls from old list that are not present in new list
        if (Object.prototype.hasOwnProperty.call(updateData, 'otherImages')) {
          const oldOthers = Array.isArray(existing.otherImages) ? existing.otherImages : [];
          const newOthers = Array.isArray(updateData.otherImages) ? updateData.otherImages : [];
          const toDelete = oldOthers.filter((u) => u && !newOthers.includes(u) && isS3Url(u));
          for (const u of toDelete) {
            try { await deleteObjectByUrl(u); } catch (e) { console.error('Failed deleting old collection other image', u, e); }
          }
        }
      }
    } catch (e) {
      console.error('Collection S3 cleanup error', e);
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error(`Error in PUT /api/collections/${id}:`, err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    try {
      const session = await auth();
      if (!session || session.user?.role !== 'admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  
      await dbConnect();
      const existing = await Collection.findById(id).lean();
      if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

      try {
        if (existing.mainImage && isS3Url(existing.mainImage)) await deleteObjectByUrl(existing.mainImage);
        if (existing.mainImage2 && isS3Url(existing.mainImage2)) await deleteObjectByUrl(existing.mainImage2);
        if (Array.isArray(existing.otherImages)) {
          for (const u of existing.otherImages) {
            if (u && isS3Url(u)) {
              try { await deleteObjectByUrl(u); } catch (e) { console.error('Failed deleting collection other image during delete', u, e); }
            }
          }
        }
      } catch (e) { console.error('Collection delete S3 cleanup error', e); }

      const removed = await Collection.findByIdAndDelete(id);
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error(err);
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }
}