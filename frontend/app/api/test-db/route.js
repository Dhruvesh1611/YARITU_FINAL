import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/dbConnect';
import mongoose from 'mongoose';
export const revalidate = 60;

export async function GET() {
  try {
    await dbConnect();
    const conn = mongoose.connection;
    const hosts = conn && conn.hosts ? conn.hosts : null;
    return NextResponse.json(
      { success: true, hosts: hosts || conn.hosts || null },
      { status: 200, headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
