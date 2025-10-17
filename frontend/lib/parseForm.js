// lib/parseForm.js
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config
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
 * NAYA AUR SIMPLIFIED processImage function
 * (Optimization steps hata diye gaye hain speed test karne ke liye)
 */
export const processImage = async (file) => {
  if (!file) {
    return null;
  }

  try {
    // 1. File ko Buffer mein convert karo
    const buffer = await file.arrayBuffer();
    const bytes = Buffer.from(buffer);

    // 2. Buffer ko Base64 Data URI mein convert karo
    const base64String = `data:${file.type};base64,${bytes.toString('base64')}`;

    // 3. 'upload' method ka istemal karo (BINA optimization ke)
    // Hum check kar rahe hain ki kya optimization ki vajah se slow tha
    const result = await cloudinary.uploader.upload(base64String, {
      resource_type: 'auto', 
      // Saare transformation aur quality options hata diye gaye hain
      // taaki upload raw aur fast ho.
    });
    
    return result;

  } catch (err) {
    console.error("Cloudinary upload error in processImage:", err);
    // Error ko aage bhejo taaki API route use handle kar sake
    throw err;
  }
};