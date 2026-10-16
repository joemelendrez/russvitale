import { playlistCoverImage } from "@/lib/playlistCover";

// The older query form: /playlists/cover?c=7b1fd0&i=dumbbell&t=Gym
export async function GET(request) {
  const q = new URL(request.url).searchParams;
  return playlistCoverImage({ c: q.get("c"), i: q.get("i"), t: q.get("t") });
}
