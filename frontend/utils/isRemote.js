// Returns true when the given URL is a remote resource (http(s) or Cloudinary URL)
export default function isRemote(url) {
	if (!url) return false;
	try {
		if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) return true;
		const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '');
		if (cloudName && typeof url === 'string' && url.includes(cloudName)) return true;
	} catch (e) {
		// ignore errors and treat as not remote
	}
	return false;
}
