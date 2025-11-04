import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/dbConnect';
import TrendingVideo from '../../../../models/TrendingVideo';
import { auth } from '../../auth/[...nextauth]/route';
import { deleteObjectByUrl, isS3Url } from '../../../../lib/s3';
export const runtime = 'nodejs';

export async function PUT(request, { params }) {
	const session = await auth();
	if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

	try {
		await dbConnect();
	const body = await request.json();
	const { id } = await params;

	const existing = await TrendingVideo.findById(id);
	if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
	const oldUrl = existing.videoUrl;

		const updated = await TrendingVideo.findByIdAndUpdate(id, body, { new: true });
		if (!updated) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

		if (Object.prototype.hasOwnProperty.call(body, 'videoUrl')) {
			const newUrl = body.videoUrl;
			if (oldUrl && oldUrl !== newUrl && isS3Url(oldUrl)) {
				try { await deleteObjectByUrl(oldUrl); } catch (e) { console.error('Failed deleting old trending video from S3', e); }
			}
		}

		return NextResponse.json({ success: true, data: updated });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	}
}

export async function DELETE(request, { params }) {
	const session = await auth();
	if (!session) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

	try {
	await dbConnect();
	const { id } = await params;

	const existing = await TrendingVideo.findById(id);
	if (!existing) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

	try { if (existing.videoUrl && isS3Url(existing.videoUrl)) await deleteObjectByUrl(existing.videoUrl); } catch (e) { console.error('Failed deleting trending video from S3', e); }

	const deleted = await TrendingVideo.findByIdAndDelete(id);
	if (!deleted) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
	return NextResponse.json({ success: true, data: { id } });
	} catch (err) {
		return NextResponse.json({ success: false, error: err.message }, { status: 500 });
	}
}
