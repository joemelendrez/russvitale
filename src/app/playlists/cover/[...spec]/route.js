import { playlistCoverImage } from "@/lib/playlistCover";

// /playlists/cover/7b1fd0/dumbbell/Gym. Everything is in the path, so every
// cover has its own address and a CDN can't hand one cover's picture to
// another (which the query form did on Netlify).
export async function GET(request, { params }) {
  const [c, i, ...text] = (await params).spec;
  const t = text.join("/");
  let decoded = t;
  try {
    decoded = decodeURIComponent(t);
  } catch {}
  return playlistCoverImage({ c, i, t: decoded });
}
