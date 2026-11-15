/* =====================================================================
   BRL — Season 1
   This one file drives the Calendar, Results, Standings, Driver
   profiles and Home page. Points are calculated automatically.

   Add each round to "rounds". Before the race, give just the round,
   date and track. After the race, add the results.

   Example round:
   {
     round: 1,
     date: "2027-02-07",          // YYYY-MM-DD
     track: "Track name",
     results: [                   // finishing order, 1st first
       "Driver One",
       "Driver Two",
       "Driver Three"
     ],
     dnf: ["Driver Four"],        // optional: did not finish (0 points)
     pole: "Driver Two",          // optional: +1 point
     fastestLap: "Driver One",    // optional: +1 point
     note: ""                     // optional: e.g. "Provisional results"
   },
   ===================================================================== */
window.BRL = window.BRL || {};
BRL.seasons = BRL.seasons || [];

BRL.seasons.push({
  id: 1,
  name: "Season 1",
  rounds: [
  ]
});
