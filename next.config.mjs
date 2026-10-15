/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Anton font files the shared images (next/og) read at run time.
  outputFileTracingIncludes: { "/**": ["./src/assets/**"] },
  images: {
    // Covers uploaded from edit mode (Supabase Storage), and Spotify's image CDN.
    remotePatterns: [
      { protocol: "https", hostname: "eljtjrcjyxmqkkruaucl.supabase.co", pathname: "/storage/v1/object/public/russ-covers/**" },
      { protocol: "https", hostname: "pswzsdjxvrwkorcgujwv.supabase.co", pathname: "/storage/v1/object/public/russ-covers/**" },
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default nextConfig;
