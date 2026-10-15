// Hero parallax layers, back to front. To use real concert photos, drop the
// files into /public/hero and point these paths at them:
//   background: the venue, stage lights, sky (a wide JPG or WebP is fine)
//   midground:  the crowd or stage rig, transparent PNG/WebP, bottom aligned
//   subject:    Russ cut out from the background, transparent PNG/WebP
// `depth` controls how far each layer drifts on scroll and mouse move.
export const HERO_LAYERS = {
  background: { src: "/hero/background.svg", alt: "" },
  midground: { src: "/hero/midground.svg", alt: "" },
  subject: { src: "/hero/subject.svg", alt: "Russ performing on stage" },
};

export const HERO_COPY = {
  eyebrow: "Atlanta by way of New Jersey",
  name: "RUSS",
  tagline: "Eleven SoundCloud albums, a song a week, and one long bet on himself. The music, era by era.",
};
