// Other versions of Russ songs (Slow, Nasty, Sped Up...), each its own track
// on Spotify. They only show on /music, under their own date, and in the
// "Other versions" row of the song they come from. More can be added from
// /admin with "Version of a song".
const v = (title, of, date, id, kind = "track") => ({ title, of, date, spotify: { kind, id } });

export const VERSIONS = [
  v("Remember (Remix) (feat. Hailey Knox)", "Remember", "2022-01-21", "773AnekGonjVpIbtNZNmTG"),
  v("Handsomer (Extended Remix) (feat. Ktlyn)", "Handsomer (feat. Ktlyn)", "2022-04-08", "7dZgoTIWgMWfxUIwwHidbw"),
  v("Last Night (Slow)", "Last Night", "2022-09-30", "3Jv8Zg328fDoB9jOeWYh9h"),
  v("3:15 (Slowed Down + Reverb)", "3:15 (Breathe)", "2023-02-17", "4ooAEchlO6o6WL301WqIkP"),
  v("3:15 (Sped Up)", "3:15 (Breathe)", "2023-02-17", "1CjZ57DJ74yJkMZs2Csy9H"),
  v("Nasty (All Versions)", "Nasty", "2023-03-31", "1v4xrIauXyLaxgiR3mSzrA", "album"),
  v("Nasty (Alternative Ending)", "Nasty", "2023-04-28", "3rb3QrVkhM2bexEARWjWtY"),
  v("Nasty (Instrumental)", "Nasty", "2023-04-28", "63wmPAghmU9MVo5Z9NYEAK"),
];

// As releases: `date` only when the day is known, otherwise just the year.
export const VERSION_RELEASES = VERSIONS.map((x) => ({
  title: x.title,
  type: "version",
  versionOf: x.of,
  year: Number(String(x.date).slice(0, 4)),
  ...(String(x.date).length === 10 ? { date: x.date } : {}),
  spotify: x.spotify,
}));
