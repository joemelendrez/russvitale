// The singles timeline, oldest first. Same release shape as eras.js; each
// year takes the colors of the era it falls in (eraForYear in eras.js).
const s = (title, extra = {}) => ({ title, type: "single", ...extra });
const track = (id) => ({ spotify: { kind: "track", id } });

export const SINGLES_BY_YEAR = [
  {
    year: 2016,
    note: "The weekly SoundCloud uploads start charting.",
    singles: [
      s("What They Want", track("0AjrdcjDF0nrsoTzOFdXUv")),
      s("Losin Control", track("1jkIErXa3YNUX5QIyO6GGR")),
      s("Inbetween"),
      s("Yung God"),
    ],
  },
  { year: 2017, note: "The There's Really a Wolf run.", singles: [s("Me You"), s("Wife You Up"), s("Ride Slow"), s("Sideline Number")] },
  {
    year: 2018,
    note: "Zoo and everything around it.",
    singles: [s("Flip"), s("Some Time"), s("Basement (feat. Jessie Reyez)"), s("The Flute Song"), s("Missin You Crazy")],
  },
  {
    year: 2019,
    note: "Building to Shake the Snow Globe.",
    singles: [s("Civil War"), s("Best on Earth (feat. Bia)", track("6dt78h32We1nu4Vmv1OajN")), s("Ain't Goin Back"), s("All I Want (feat. Davido)")],
  },
  { year: 2020, note: "The year he went independent.", singles: [s("Give Up"), s("Throne Talks"), s("Take You Back (with Kehlani)")] },
  { year: 2021, note: "Chomp 2 season.", singles: [s("Ugly (feat. Lil Baby)"), s("3:15 (Breathe)"), s("Seduce (feat. Capella Grey)")] },
  {
    year: 2022,
    note: "A global hit without a label.",
    singles: [s("Handsomer (feat. Ktlyn)"), s("Are You Entertained (with Ed Sheeran)", track("5bLGQqcpsz5ISWeihZfJnR")), s("Remember")],
  },
  { year: 2023, note: "Into Santiago.", singles: [s("Nasty", track("0DuylJNqsvjRN9hhWUdeJZ")), s("Put You on Game")] },
  {
    year: 2024,
    note: "Collaborations with 6lack and DJ Premier.",
    singles: [s("That's My Girl"), s("Workin on Me (with 6lack)"), s("Work This Out (with DJ Premier)"), s("In the Dirt")],
  },
  {
    year: 2025,
    note: "The W!LD rollout.",
    singles: [s("April 7", track("3tHNvYvBIuTgYNMF5W4vzf")), s("Recognize (with Jessy Blakemore)"), s("Crazy")],
  },
  { year: 2026, note: "The newest drops.", singles: [s("Hell"), s("Coulda Shoulda Woulda"), s("Come Back to Me")] },
];
