import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

// Follow the requested ENV names
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function buildS3Url(bucket, region, key) {
  // Required public URL format per spec
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (!bucketName) return NextResponse.json({ error: 'Server not configured (missing AWS_S3_BUCKET_NAME)' }, { status: 500 });

    const maxSizeBytes = 150 * 1024 * 1024; // 150MB limit
    if (file.size && file.size > maxSizeBytes) {
      return NextResponse.json({ error: `File too large. Max ${maxSizeBytes / (1024 * 1024)}MB` }, { status: 413 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // store at bucket root. Use timestamp prefix to avoid collisions.
    const filename = file.name ? file.name.replace(/\s+/g, '_') : `${Date.now()}`;
    const key = `${Date.now()}-${filename}`;

    const putParams = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    };

    await s3Client.send(new PutObjectCommand(putParams));

    const url = buildS3Url(bucketName, region, key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('S3 upload error', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
}