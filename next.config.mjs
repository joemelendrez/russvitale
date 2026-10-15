/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Covers uploaded from edit mode (Supabase Storage), and Spotify's image CDN.
    remotePatterns: [
      { protocol: "https", hostname: "eljtjrcjyxmqkkruaucl.supabase.co", pathname: "/storage/v1/object/public/russ-covers/**" },
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default nextConfig;
