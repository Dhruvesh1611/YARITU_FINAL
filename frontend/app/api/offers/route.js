import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import OfferContent from '../../../models/OfferContent';

// We'll keep a fixed set of 5 positions (0..4). Each document may have an optional `position` field.
// GET: return array of length 5, filling missing positions with defaults.
export async function GET() {
  try {
    await dbConnect();
    // Return all offer documents (so public users see offers tied to stores).
    // Previously this endpoint returned a fixed 5-length array; returning the
    // actual documents makes store-based filtering on the client reliable.
    const docs = await OfferContent.find({}).sort({ position: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, data: docs }, { status: 200 });
  } catch (error) {
    console.error('Error fetching offers from DB', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

// Create a new offer document (not typically used for the fixed 5 slots but supported)
export async function POST(request) {
  try {
    const body = await request.json();
    await dbConnect();
    const created = await OfferContent.create(body);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/offers (DB):', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}

// Update by id or by position (zero-based index)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, position } = body;
    if ((typeof id === 'undefined' || id === null) && typeof position !== 'number') {
      return NextResponse.json({ success: false, error: 'Missing id or position' }, { status: 400 });
    }

    await dbConnect();

    let doc = null;
    if (id) {
      try {
        doc = await OfferContent.findById(id);
      } catch (e) {
        doc = null;
      }
    }

    if (!doc && typeof position === 'number') {
      doc = await OfferContent.findOne({ position: Number(position) });
      if (!doc) {
        // create a new doc for this position
        const toCreate = { position: Number(position), heading: body.category || body.heading || '', discount: body.discount || '', image: body.image || '', store: body.store || '' };
        const created = await OfferContent.create(toCreate);
        return NextResponse.json({ success: true, data: created }, { status: 200 });
      }
    }

    if (!doc) return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 });

    // update allowed fields
    const updatable = ['heading', 'subheading', 'discount', 'validity', 'image', 'store', 'position', 'category'];
    updatable.forEach((k) => {
      if (typeof body[k] !== 'undefined') {
        // map category -> heading if provided
        if (k === 'category') doc.heading = body[k];
        else doc[k] = body[k];
      }
    });

    await doc.save();
    return NextResponse.json({ success: true, data: doc }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/offers (DB):', error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}
