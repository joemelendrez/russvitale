// Hero parallax layers, back to front, all in /public/hero:
//   background: the crowd shot, softened so it reads as depth
//   midground:  the stage floor from the concert photo, transparent at the top
//   subject:    Russ cut out of the same photo, transparent PNG/WebP
// Give a replacement a new file name: the image CDN caches by URL.
export const HERO_LAYERS = {
  background: { src: "/hero/crowd.webp", alt: "" },
  midground: { src: "/hero/stage-floor.webp", alt: "" },
  subject: { src: "/hero/russ.webp", alt: "Russ performing on stage, mic in hand" },
};

export const HERO_COPY = {
  eyebrow: "Atlanta by way of New Jersey",
  name: "RUSS",
  tagline: "Eleven SoundCloud albums, a song a week, and one long bet on himself. The music, era by era.",
  // The hero layers are cut from this post on Russ's own Instagram.
  credit: { label: "Photo: @russ on Instagram", href: "https://www.instagram.com/p/DM9VEwbOvmU/" },
};
