/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Album art can come straight from Spotify's image CDN once real covers are added.
    remotePatterns: [{ protocol: "https", hostname: "i.scdn.co" }],
  },
};

export default nextConfig;
