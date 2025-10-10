import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// --- THIS IS THE FIX ---
// Configure Cloudinary with your credentials from .env.local
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
// -----------------------

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file) return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });

    const maxSizeBytes = 150 * 1024 * 1024; // 150MB limit
    if (file.size && file.size > maxSizeBytes) {
      return NextResponse.json({ success: false, error: `File too large. Max ${maxSizeBytes / (1024 * 1024)}MB` }, { status: 413 });
    }

    console.log('Received upload', { name: file.name, size: file.size, type: file.type });

    // Try streaming the incoming Web File to Cloudinary to avoid buffering large files
    const folder = 'YARITU';
    let uploadResult;

    if (file.stream && typeof file.stream === 'function') {
      // Convert Web ReadableStream -> Node Readable and pipe to Cloudinary
      const { Readable } = await import('stream');
      const webStream = file.stream();
      const nodeStream = Readable.fromWeb(webStream);

      uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'auto', folder }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        nodeStream.pipe(uploadStream);
      });
    } else {
      // Fallback to buffer if web stream isn't available
      const ab = await file.arrayBuffer();
      const buffer = Buffer.from(ab);
      uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto', folder }, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
        stream.end(buffer);
      });
    }

    if (!uploadResult) return NextResponse.json({ success: false, error: 'Cloudinary returned no result' }, { status: 502 });

    console.log('Cloudinary upload succeeded', { public_id: uploadResult.public_id, secure_url: uploadResult.secure_url });
    return NextResponse.json({ success: true, data: uploadResult });

  } catch (err) {
    console.error('Server upload error', err);
    const message = err && (err.message || err.name) ? (err.message || err.name) : 'Upload failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}