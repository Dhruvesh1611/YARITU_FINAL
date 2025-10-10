// lib/parseForm.js
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config - make sure it's also configured in your routes
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


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
 * Takes a File object, reads its buffer, and uploads it to Cloudinary.
 */
export const processImage = async (file) => {
  if (!file) {
    return null;
  }

  // This will now work correctly because 'file' is a proper File object
  const buffer = await file.arrayBuffer();
  const bytes = Buffer.from(buffer);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: 'auto',
    }, (err, result) => {
      if (err) {
        console.error("Cloudinary upload error:", err);
        return reject(err);
      }
      resolve(result);
    });
    stream.end(bytes);
  });
};