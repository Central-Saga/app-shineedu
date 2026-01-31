/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'api.shineeducationbali.test',
            },
            {
                protocol: 'http',
                hostname: 'api.shineeducationbali.test',
            },
            {
                protocol: 'https',
                hostname: 'api.shineeducationbali.com',
            },
        ],
    },
};

module.exports = nextConfig;
