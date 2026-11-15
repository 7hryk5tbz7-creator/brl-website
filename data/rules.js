/* =====================================================================
   BRL — Points system & rules
   The website calculates every championship table from these values,
   so the Rules page and the standings always agree.
   ===================================================================== */
window.BRL = window.BRL || {};

BRL.rules = {
  // Points for 1st, 2nd, 3rd ... 16th. Positions below 16th score 0.
  points: [25, 20, 17, 15, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1],

  // Bonus points
  pole: 1,
  fastestLap: 1,

  tieBreaker:
    "If two or more drivers finish the season on the same points, the tie is broken by most wins, " +
    "then most 2nd places, then most 3rd places, and so on down through each finishing position " +
    "until the tie is broken. If the tie still cannot be broken, the driver who achieved the " +
    "highest finishing position first wins the tie-break.",

  // Sporting regulations. Leave empty to show "Coming soon".
  // Example section:
  // { title: "1. General", items: ["Rule text…", "Rule text…"] },
  sections: []
};
