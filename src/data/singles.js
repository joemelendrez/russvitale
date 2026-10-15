// The singles timeline, oldest first. Same release shape as eras.js; each
// year takes the colors of the era it falls in (eraForYear in eras.js).
const s = (title, extra = {}) => ({ title, type: "single", ...extra });
const track = (id) => ({ spotify: { kind: "track", id } });
// A single whose own track id we could not confirm plays from its single page.
const album = (id) => ({ spotify: { kind: "album", id } });

export const SINGLES_BY_YEAR = [
  {
    year: 2016,
    note: "The weekly SoundCloud uploads start charting.",
    singles: [
      s("What They Want", track("0AjrdcjDF0nrsoTzOFdXUv")),
      s("Losin Control", track("1jkIErXa3YNUX5QIyO6GGR")),
      s("Inbetween", track("1MlzuSv2TzT338C2acWgAz")),
      s("Yung God", track("2plFaDNZayLbtA9Ht1yCEo")),
    ],
  },
  { year: 2017, note: "The There's Really a Wolf run.", singles: [s("Me You"), s("Wife You Up", track("0art0zak92ZrHgKM2WPZqP")), s("Ride Slow"), s("Sideline Number", track("4xVWMBB5H7beg8DeHv0bu9"))] },
  {
    year: 2018,
    note: "Zoo and everything around it.",
    singles: [s("Flip", track("3JJH0Vdu6XPD5ibEgNPbTA")), s("Some Time", album("6Kwt9RP4CZtTAGkUyRS3O4")), s("Basement (feat. Jessie Reyez)", album("2suvROVbQiZoG1H5qgSzPr")), s("The Flute Song", track("798nzni0JSUWMVJJBCYYF1")), s("Missin You Crazy")],
  },
  {
    year: 2019,
    note: "Building to Shake the Snow Globe.",
    singles: [s("Civil War", track("5tmu5pAFHkUSl8Fo8ncyA4")), s("Best on Earth (feat. Bia)", track("6dt78h32We1nu4Vmv1OajN")), s("Ain't Goin Back", track("0Y4L4iWjUH34u2qnois2fI")), s("All I Want (feat. Davido)", album("7dXvVVC6xytbsU8tQWGvko"))],
  },
  { year: 2020, note: "The year he went independent.", singles: [s("Give Up", track("0BST0Q3OayjAIzG3MHOcy0")), s("Throne Talks", album("0nOR92zWKQs2O3H1jfcYXZ")), s("Take You Back (with Kehlani)", track("50CXGLOqdsztp42DuJmJ8k"))] },
  { year: 2021, note: "Chomp 2 season.", singles: [s("Ugly (feat. Lil Baby)", album("6QKJuikQEvlMmthEFunSUW")), s("3:15 (Breathe)", track("5QY290FSn52pZNPbiitieX")), s("Seduce (feat. Capella Grey)", track("5irzewJoHob42Nq3P9kOYh"))] },
  {
    year: 2022,
    note: "A global hit without a label.",
    singles: [s("Handsomer (feat. Ktlyn)", album("6lgEKMU3p6g9c9vlfUr6uK")), s("Are You Entertained (with Ed Sheeran)", track("5bLGQqcpsz5ISWeihZfJnR")), s("Remember", track("0rCBbW26RIbOH4i1CHmxP3"))],
  },
  { year: 2023, note: "Into Santiago.", singles: [s("Nasty", track("0DuylJNqsvjRN9hhWUdeJZ")), s("Put You on Game", track("31UEIDEnR72bsUiavstcof"))] },
  {
    year: 2024,
    note: "Collaborations with 6lack and DJ Premier.",
    singles: [s("That's My Girl", track("2V0Vlkbb6fUEHl1gk8Lwr6")), s("Workin on Me (with 6lack)", track("4OLpvmygTruvZfH1uyj6sS")), s("Work This Out (with DJ Premier)", track("3VymabYos1p2fXzmk0cPKg")), s("In the Dirt", track("0w8xLwXp9WDrlPxyWofCUS"))],
  },
  {
    year: 2025,
    note: "The W!LD rollout.",
    singles: [s("April 7", track("3tHNvYvBIuTgYNMF5W4vzf")), s("Recognize (with Jessy Blakemore)", track("2i7GLdXNYuIOfqopWWIjVF")), s("Crazy", track("6nh2OLKUuBX8Z6oW9GQuvN"))],
  },
  { year: 2026, note: "The newest drops.", singles: [s("Hell", track("5VdF8ZUOWoAhmJNb7urwoq")), s("Coulda Shoulda Woulda", track("7ASgdH8lMilajhrWkeCgNx")), s("Come Back to Me")] },
];
