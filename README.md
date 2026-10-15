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

The hero is three layers in `public/hero/`, made from Joseph's concert photos: `crowd.webp` (background, softened), `stage-floor.webp` (the stage floor, transparent at the top) and `russ.webp` (Russ cut out). The name "RUSS" sits between the crowd and Russ, so he stands in front of it. To swap one, add the new file under a new name and update `src/data/hero.js`, since the image CDN caches by URL.

### Adding a Spotify player to a release

Copy the share link from Spotify (`https://open.spotify.com/album/<id>` or `/track/<id>`) and add `spotify: { kind: "album", id: "<id>" }` to the release in `eras.js`. Releases without one link to a Spotify search instead. Real cover art can go in `public/covers/` with `cover: "/covers/zoo.jpg"`.

## Ground rules

This is a fan site. It stays labeled unofficial, plays music only through official Spotify and YouTube embeds, hosts no audio, prints no full lyrics and sells nothing.
