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
| `eras.js` | Each era: years, blurb, color palette, and its releases |
| `shows.js` | Upcoming show dates and the tour links |
| `videos.js` | YouTube video ids for the Watch section |
| `site.js` | Menu items and outbound links |

### Swapping in the concert photos

The hero uses placeholder art in `public/hero/`. Replace it with three layers cut from the concert shots:

1. `background`: the venue, lights or sky. A wide JPG or WebP.
2. `midground`: the crowd or stage rig, on a transparent background, bottom aligned.
3. `subject`: Russ cut out on a transparent background (PNG or WebP).

Drop the files into `public/hero/` and update the paths in `src/data/hero.js`. The name "RUSS" sits between the midground and Russ, so he stands in front of it.

### Adding a Spotify player to a release

Copy the share link from Spotify (`https://open.spotify.com/album/<id>` or `/track/<id>`) and add `spotify: { kind: "album", id: "<id>" }` to the release in `eras.js`. Releases without one link to a Spotify search instead. Real cover art can go in `public/covers/` with `cover: "/covers/zoo.jpg"`.

## Ground rules

This is a fan site. It stays labeled unofficial, plays music only through official Spotify and YouTube embeds, hosts no audio, prints no full lyrics and sells nothing.
