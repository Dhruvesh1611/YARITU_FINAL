import { NextResponse } from 'next/server';

// Ensure this route is always dynamic and runs on Node.js runtime (for Mongoose)
export const runtime = 'nodejs';
// Prefer a short revalidate window so public reads are cached at CDN/edge
export const revalidate = 60;
import dbConnect from '../../../lib/dbConnect';
import Store from '../../../models/Store';
import { auth } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    // Step 1: Connect to the database
    await dbConnect();

    // Step 2: Fetch the data
    const stores = await Store.find({});

    // Step 3: Return the data (with CDN cache header)
    return NextResponse.json(
      { success: true, data: stores },
      { status: 200, headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );

  } catch (error) {
    // Agar koi bhi error aati hai to crash hone ke bajaye yeh response bhejo
    return NextResponse.json(
      { success: false, error: "Server Error: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  // Only allow authenticated users to create stores
  const session = await auth();
  if (!session) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  const isAdmin = !!(session?.user?.isAdmin || session?.user?.role === 'admin');
  if (!isAdmin) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
  } catch (err) {
    return NextResponse.json({ success: false, error: `DB connection error: ${err.message}` }, { status: 500 });
  }

  try {
    const body = await request.json();
    const store = await Store.create(body);
    return NextResponse.json({ success: true, data: store }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

// YEH NAYA FUNCTION ADD KAREIN
// duplicate POST removed