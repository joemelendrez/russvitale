// Songs by other artists that Russ is featured on, each checked on Spotify
// (Russ's artist id 1z7b1Pr1rSlvWRzsW3HOrS in the track's credits). They show
// on /music under their own date, with the Features filter.
// Lead artists only; the row adds "feat. Russ".
const f = (title, artist, date, id) => ({ title, artist, date, spotify: { kind: "track", id } });

export const FEATURES = [
  f("Issues", "PnB Rock", "2017-11-17", "1ysDVWxBj5Set0fA05TcyP"),
  f("Lil Arrogant", "IDK, Joey Bada$$", "2018-05-11", "6LwVuIfC5vp4waJTZBVph1"),
  f("Fallin'", "Derez De'Shon", "2018-12-14", "6MCaD9bCQfZLZ2I8p80cZo"),
  f("Here It Comes", "T-Pain", "2019-02-27", "5cpiUTX2VJn5JN7myo2XaD"),
  f("Bank", "Collie Buddz, B Young", "2019-04-05", "1ya5zEOz55iNCSCqkR0dK3"),
  f("I Refuse", "Bugus", "2019-04-15", "3czN93ouoJcfJZNZHCWXWd"),
  f("Take Me Away", "Snoop Dogg, Wiz Khalifa", "2019-08-15", "1ZsuGTlpdKGdZnZTglDIGU"),
  f("Mind Games", "YK Osiris", "2019-10-11", "50Y7wtbV7PbbBb0SnDR2gB"),
  f("The Way", "Trippie Redd", "2020-02-19", "54JD6jMGpa3tLAgkSYdLwf"),
  f("Fck Boys", "Blxst", "2021-03-12", "3AO2MYgrCiTorCUura1szR"),
  f("Without You", "Queen Naija", "2021-04-16", "15balRa9HBE5MJwcggcksE"),
  f("No See Umz", "Tech N9ne, Snow Tha Product", "2021-10-08", "5UmzXoBzg1KdkQarQOROZa"),
  f("No No", "Papoose", "2021-12-31", "08T7pXwMw1Uz9KJuTUwNIY"),
  f("Therapy Music", "Logic", "2022-05-06", "3WRT8uD7wYPzIJagtFRVjF"),
  f("Trust Myself", "Bigflo & Oli", "2022-06-23", "6rjFtVBkZsuzCoTveVdW36"),
  f("Settled", "Rexx Life Raj", "2022-07-15", "46cBzfiGyZetFFC9P9LATk"),
  f("News", "Tink", "2022-08-19", "4krpgB8twCTBq12aP4a8ug"),
  f("Go Off", "Ab-Soul, Big Sean", "2022-12-16", "2g3jf2e9wcwqkIMAM1wN3i"),
  f("Limbo", "Statik Selektah", "2023-06-09", "5PG7m7GfBoiuzNVjZ2lZGV"),
  f("Gangsta (Remix)", "Seyi Vibez, Jibrille", "2023-06-08", "69MJk1HZpBj5A8uVeAVZfy"),
  f("Really Gone", "Jelly Roll", "2024-10-11", "1mlpDLmYruyOMvLQXRtEc0"),
  f("Hello Habibi", "Olamide", "2024-11-07", "4KrW7XStKEquE6mLDKgM0o"),
];

// "PnB Rock feat. Russ"
export const featureCredit = (release) => `${release.artist} feat. Russ`;

// As releases: `date` only when the day is known, otherwise just the year.
export const FEATURE_RELEASES = FEATURES.map((x) => ({
  title: x.title,
  type: "feature",
  artist: x.artist,
  year: Number(String(x.date).slice(0, 4)),
  ...(String(x.date).length === 10 ? { date: x.date } : {}),
  spotify: x.spotify,
}));
