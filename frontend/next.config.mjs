/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
        // During local development we disable the Next.js image optimization proxy
        // to avoid timeouts when contacting remote CDNs like Cloudinary.
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co', // Yeh aapka purana wala hai
            },
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com', // Yeh naya wala add karein
            },
        ],
    },
};

export default nextConfig;