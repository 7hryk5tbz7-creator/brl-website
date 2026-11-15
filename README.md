# BRL — Breakthrough Racing League

The official website for driver profiles, race results, championship standings and the league's rules and regulations.

Built with plain HTML, CSS and JavaScript. There's no build step and no database, and it's hosted free on GitHub Pages.

## How it works

Every page is a thin HTML shell. `assets/app.js` builds the content from the data files in `data/`:

| File | What it holds |
|---|---|
| `data/season-1.js` | The calendar and the race results for each round |
| `data/drivers.js` | Driver names, race numbers, teams and bios |
| `data/rules.js` | The points table, bonus points, tie-breaker and sporting regulations |

Pages with no data yet show a **Coming soon** banner automatically.

**Points and standings are calculated automatically.** You only enter the finishing order, pole and fastest lap. The site applies the points table (25-20-17-15-13-11-10-9-8-7-6-5-4-3-2-1, +1 for pole, +1 for fastest lap) and the countback tie-breaker.

## Common updates

**Add a round to the calendar.** In `data/season-1.js`, add to `rounds`:

```js
{ round: 1, date: "2027-02-07", track: "Track name" },
```

**Add results after a race.** Add `results` to that round, in finishing order:

```js
{
  round: 1, date: "2027-02-07", track: "Track name",
  results: ["Driver One", "Driver Two", "Driver Three"],
  dnf: ["Driver Four"],
  pole: "Driver Two",
  fastestLap: "Driver One"
},
```

**Add a driver.** In `data/drivers.js`:

```js
{ name: "Driver One", number: 7, team: "Team Name", bio: "Short bio." },
```

Driver names must be spelled exactly the same in `drivers.js` and in the results.

**Add regulations.** In `data/rules.js`, add to `sections`:

```js
{ title: "1. General", items: ["Rule one…", "Rule two…"] },
```

**After any update,** change the `?v=` number in every HTML file so visitors' browsers load the new files.

## Pages

- `index.html`: home
- `calendar.html`: season calendar
- `results.html`: race results (`?round=N`)
- `standings.html`: championship table
- `drivers.html`: driver list
- `driver.html`: driver profile (`?name=…`)
- `rules.html`: points system, tie-breaker and regulations
