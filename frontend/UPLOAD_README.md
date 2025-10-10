Cloudinary server upload setup

This project now uses the Cloudinary Node SDK for server-side uploads at `app/api/upload/route.js`.

Required environment variables (add to `.env.local`):

- CLOUDINARY_URL (recommended) or set these three:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET

Example `.env.local` (do not commit):

CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>

Or:
CLOUDINARY_CLOUD_NAME=dqjegkdru
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here

Install dependencies and run dev server:

# from frontend folder
npm install
npm run dev

Notes:
- The server accepts files up to 150MB; smaller uploads are more reliable.
- If you prefer unsigned uploads, revert to the previous proxy approach and ensure the unsigned preset exists in Cloudinary.
- For production, store CLOUDINARY_* env vars securely (Vercel Environment Variables or your host’s secrets).
