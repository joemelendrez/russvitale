/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Anton font files the shared images (next/og) read at run time.
  outputFileTracingIncludes: { "/**": ["./src/assets/**"] },
  // The blog and the email newsletter were taken down (November 2026). Old
  // links, search results and confirm emails land on the home page instead
  // of a 404. /api/newsletter/unsubscribe stays live for emails already sent.
  async redirects() {
    return [
      { source: "/blog", destination: "/", permanent: true },
      { source: "/blog/:path*", destination: "/", permanent: true },
      { source: "/newsletter", destination: "/", permanent: true },
      { source: "/api/newsletter/confirm", destination: "/", permanent: true },
      { source: "/api/newsletter/subscribe", destination: "/", permanent: true },
      { source: "/api/blog-published", destination: "/", permanent: true },
    ];
  },
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
