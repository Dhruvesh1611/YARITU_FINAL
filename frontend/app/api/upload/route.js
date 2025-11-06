import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs';

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const region = process.env.AWS_REGION;

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function buildS3Url(bucket, region, key) {
  // Encode each path segment but preserve slashes so URLs look like
  // https://bucket.s3.region.amazonaws.com/YARITU/celebrity/filename.mp4
  const encoded = String(key)
    .split('/')
    .map((seg) => encodeURIComponent(seg))
    .join('/');
  return `https://${bucket}.s3.${region}.amazonaws.com/${encoded}`;
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!file)
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (!bucketName)
      return NextResponse.json(
        { error: 'Server not configured (missing AWS_S3_BUCKET_NAME)' },
        { status: 500 }
      );

    const maxSizeBytes = 150 * 1024 * 1024; // 150MB limit
    if (file.size && file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${maxSizeBytes / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🧠 Smart folder mapping (explicit + fallbacks)
    const rawFolder = form.get('folder');
    const sectionField = form.get('section') || form.get('sectionName');
    const referer = req.headers.get('referer');

  const known = new Set(['celebrity','offers','reviews','review_page','review-page','review','collections','collection','featured','hero','others','review-videos','stores','store','testimonials','trending','stayclassy','home_review','home']);

    const sanitize = (s) => {
      if (!s) return '';
      let v = String(s).trim();
      v = v.replace(/^\/+/g, '').replace(/\/+$/g, '');
      v = v.replace(/\.\.+/g, '');
      v = v.replace(/[^A-Za-z0-9\/_-]/g, '');
      return v;
    };

    let folderPrefix = '';

    const tryMapName = (name) => {
      if (!name) return '';
      const n = name.toLowerCase();
      // if already contains YARITU prefix
      if (n.includes('yaritu/')) return sanitize(n);
      // if name contains one of known parts
      for (const k of known) {
        if (n === k || n.endsWith('/' + k) || n.includes('/' + k) || n.includes(k)) {
          // Special mappings
          if (k === 'collections' || k === 'collection') {
            return `YARITU/COLLECTION`;
          }
          // Map review-related tokens to REVIEW_PAGE
          if (k === 'review' || k === 'review_page' || k === 'review-page' || k === 'reviews') {
            return `YARITU/REVIEW_PAGE`;
          }
          // return uppercase segment for readability and consistency
          return `YARITU/${k.toString().toUpperCase()}`;
        }
      }
      return '';
    };

    // Priority: explicit folder -> section field -> referer -> default
    const folderCandidate = sanitize(rawFolder || '');
    if (folderCandidate) {
      // If client sent 'celebrity' or 'YARITU/celebrity' or 'some/celebrity', map appropriately
      const mapped = tryMapName(folderCandidate);
      folderPrefix = mapped || (folderCandidate.includes('/') ? folderCandidate : `YARITU/${folderCandidate}`);
    } else if (sectionField) {
      const mapped = tryMapName(sectionField);
      if (mapped) folderPrefix = mapped;
    } else if (referer) {
      try {
        const url = new URL(referer);
        const mapped = tryMapName(url.pathname);
        if (mapped) folderPrefix = mapped;
      } catch (e) {
        // ignore malformed referer
      }
    }

  if (!folderPrefix) folderPrefix = 'YARITU/others';

  // Normalize any leading 'yaritu' (case-insensitive) to uppercase 'YARITU'
  folderPrefix = folderPrefix.replace(/^yaritu/i, 'YARITU');

    // Clean filename and build key
    const filename = file.name ? file.name.replace(/\s+/g, '_') : `${Date.now()}`;
    const key = `${folderPrefix}/${Date.now()}-${filename}`;

    const putParams = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      // ACL removed (no longer supported on some buckets)
    };

    await s3Client.send(new PutObjectCommand(putParams));

    const url = buildS3Url(bucketName, region, key);
    return NextResponse.json({ url });
  } catch (err) {
    console.error('S3 upload error', err);
    return NextResponse.json(
      { error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
