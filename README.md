# russvitale.com

An unofficial Russ fan site: a scrolling timeline of his music from the 2011 SoundCloud era to now, with every album and single playable through Spotify's own embed player.

Next.js 16, Tailwind 4, framer-motion and Lenis. Deploys to Netlify (`netlify.toml`).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

## Editing content

Everything lives in `src/data/`, no component changes needed.

| File | What it controls |
|---|---|
| `hero.js` | The three hero parallax layers and the intro copy |
| `eras.js` | Albums tab: each era's years, blurb, color palette, albums and EPs |
| `singles.js` | Singles tab: singles grouped by year (colored by that year's era) |
| `shows.js` | Upcoming show dates and the tour links |
| `videos.js` | YouTube video ids for the Watch section |
| `site.js` | Menu items and outbound links |

### Hero photos

The hero is three layers in `public/hero/`, cut from a photo on Russ's Instagram (https://www.instagram.com/p/DM9VEwbOvmU/, credited under the hero via `HERO_COPY.credit`): `crowd.webp` (background, softened), `stage-floor.webp` (the stage floor, transparent at the top) and `russ.webp` (Russ cut out). The name "RUSS" sits between the crowd and Russ, so he stands in front of it. To swap one, add the new file under a new name and update `src/data/hero.js`, since the image CDN caches by URL.

### Adding a Spotify player to a release

Copy the share link from Spotify (`https://open.spotify.com/album/<id>` or `/track/<id>`) and add `spotify: { kind: "album", id: "<id>" }` to the release in `eras.js`. For a song Spotify doesn't carry, add `soundcloud: "https://soundcloud.com/<user>/<track>"` instead and it plays in SoundCloud's own embed player. Releases with neither link to a Spotify search. Real cover art can go in `public/covers/` with `cover: "/covers/zoo.jpg"`.

You can also fix players from the live site. Sign in at `/admin` with an emailed link (only emails in the `russ_admins` table can save), then tap "Fix song links on the site": an "Edit mode" bar appears, and every card gets "Find it on Spotify or SoundCloud" links and a box to paste either share link into (a saved link replaces the release's player, so a SoundCloud link takes over from a Spotify search). Saved links go to the `russ_release_links` table and show for every visitor straight away. "Done" leaves edit mode on that device.

### New drops

`/admin` also has "Add a new drop": a title, a Spotify or SoundCloud link, the release date and a short note. Drops (`russ_drops`) join the Singles timeline under their year, and the newest one with "Pop-up" on slides down under the menu as a "New drop" notice, once per visitor (dismissing it is remembered per drop).

### Database

The tables live in the Handoff Hero Supabase project (the free plan allows two projects), all prefixed `russ_`; the schema is `supabase/migrations/0001_russ_links_and_drops.sql`. The site only has the public key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` on Netlify); row-level security is what stops anyone but an admin from writing. Add an editor with `insert into public.russ_admins (email) values ('them@example.com');`. Sign-in links redirect to `https://russvitale.com/admin`, which has to be listed under Authentication › URL Configuration › Redirect URLs in that Supabase project. Without the env vars the site still works from `src/data` alone.

### Shows

The Shows section embeds Bandsintown's own widget for Russ (`BANDSINTOWN` in `src/data/shows.js`), so dates always come from them.

## Ground rules

This is a fan site. It stays labeled unofficial, plays music only through official Spotify, SoundCloud and YouTube embeds, hosts no audio, prints no full lyrics and sells nothing.
