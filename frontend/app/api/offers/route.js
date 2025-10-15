import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import Offer from '../../../models/Offer';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET() {
  try {
    await dbConnect();
    const offers = await Offer.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: offers }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

// *** YEH POST FUNCTION POORA BADAL DIYA GAYA HAI ***
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    // Step 1: OfferEditorModal se saara data nikalein
    const { id, heading, subheading, discount, validity, store, imageBase64 } = body;

    // Step 2: Zaroori fields check karein
    if (!heading || !subheading || !store) {
      return NextResponse.json(
        { success: false, error: 'Heading, subheading, and store are required' },
        { status: 400 }
      );
    }

    let imageUrl = ''; // Default image URL ko khaali rakhein

    // Step 3: Agar nayi image aayi hai (imageBase64), to use Cloudinary par upload karein
    if (imageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: 'yaritu_offers', // Cloudinary mein is naam ka folder ban jayega
        resource_type: 'image',
      });
      imageUrl = uploadResponse.secure_url; // Upload hone ke baad mila hua URL
    }

    // Step 4: MongoDB mein save karne ke liye data taiyaar karein
    const offerData = {
      heading,
      subheading,
      discount,
      validity,
      store,
      image: imageUrl, // Agar image hai to Cloudinary ka URL, warna khaali string
    };

    // Abhi hum sirf naya offer create kar rahe hain. Edit ka logic baad mein add hoga.
    const newOffer = await Offer.create(offerData);

    // Step 5: Naya offer frontend ko wapas bhejein
    return NextResponse.json({ success: true, data: newOffer }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/offers-content:', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}