// lib/parseForm.js
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function buildS3Url(bucket, region, key) {
  if (!region || region === 'us-east-1') return `https://${bucket}.s3.amazonaws.com/${encodeURIComponent(key)}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key)}`;
}


/**
 * Parses the incoming form request to separate files and fields.
 */
export const parseForm = async (request) => {
  const formData = await request.formData();
  const files = {};
  const fields = {};

  for (const entry of formData.entries()) {
    const [name, value] = entry;

    if (value instanceof File) {
      if (files[name]) {
        if (!Array.isArray(files[name])) {
          files[name] = [files[name]];
        }
        files[name].push(value);
      } else {
        files[name] = value;
      }
    } else {
      fields[name] = value;
    }
  }

  return { fields, files };
};


/**
 * NAYA AUR SIMPLIFIED processImage function
 * (Optimization steps hata diye gaye hain speed test karne ke liye)
 */
export const processImage = async (file) => {
  if (!file) return null;
  if (!bucketName) throw new Error('Server not configured (missing AWS_BUCKET_NAME)');

  try {
    const ab = await file.arrayBuffer();
    const buffer = Buffer.from(ab);

    const filename = file.name ? file.name.replace(/\s+/g, '_') : `${Date.now()}`;
    const key = `YARITU/${Date.now()}-${filename}`;

    const putParams = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    };

    await s3Client.send(new PutObjectCommand(putParams));
    const url = buildS3Url(bucketName, region, key);
    return { secure_url: url, url };
  } catch (err) {
    console.error('S3 upload error in processImage:', err);
    throw err;
  }
};