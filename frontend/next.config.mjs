/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: {
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