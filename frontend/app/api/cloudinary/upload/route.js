import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UNSIGNED_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;
    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ success: false, error: 'Cloudinary server configuration missing' }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get('file');
    const folder = form.get('folder') || 'YARITU/hero';
    if (!file) return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });

    const isVideo = !!(file.type && file.type.startsWith('video/'));
    const endpointType = isVideo ? 'video' : 'image';
    const cloudUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${endpointType}/upload`;

    const outbound = new FormData();
    // file is a File/Blob-like object from the incoming FormData
    outbound.append('file', file, file.name || 'upload');
    outbound.append('upload_preset', uploadPreset);
    outbound.append('folder', folder);

    const resp = await fetch(cloudUrl, { method: 'POST', body: outbound });
    const data = await resp.json().catch(() => null);

    if (!resp.ok) {
      return NextResponse.json({ success: false, error: data?.error?.message || `Cloudinary upload failed: ${resp.status}` }, { status: 502 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message || String(err) }, { status: 500 });
  }
}
