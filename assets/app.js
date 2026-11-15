/* =====================================================================
   BRL — Breakthrough Racing League
   Builds every page from the files in /data.
   Each HTML page sets <body data-page="…"> to choose what is built.
   ===================================================================== */
(function () {
  "use strict";

  const BRL = window.BRL || {};
  const RULES = BRL.rules || { points: [], pole: 0, fastestLap: 0, sections: [] };
  const SEASONS = BRL.seasons || [];
  const DRIVERS = BRL.drivers || [];
  const VERSION = document.currentScript && (document.currentScript.src.split("?v=")[1] || "");

  /* ---------------- helpers ---------------- */
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams(location.search);
  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  function parseDate(d) {
    if (!d) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function fmtDate(d, long) {
    const dt = parseDate(d);
    if (!dt) return "Date TBC";
    return dt.toLocaleDateString("en-AU", long
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };

  function driverInfo(name) {
    return DRIVERS.find((d) => d.name === name) || { name };
  }
  function plink(name) {
    return `<a href="driver.html?name=${encodeURIComponent(name)}">${esc(name)}</a>`;
  }
  function comingSoon(title, text, badge) {
    return `<div class="coming-soon">
      <div class="badge">${esc(badge || "Coming soon")}</div>
      <h2>${esc(title)}</h2>
      <p>${esc(text)}</p>
    </div>`;
  }
  function tile(big, small, cls, href) {
    const tag = href ? "a" : "div";
    return `<${tag} class="tile ${cls || ""}"${href ? ` href="${href}"` : ""}>
      <div class="big">${big}</div><div class="small">${esc(small)}</div></${tag}>`;
  }

  /* ---------------- season data ---------------- */
  function currentSeason() {
    if (!SEASONS.length) return null;
    const id = params.get("season");
    return SEASONS.find((s) => String(s.id) === id) || SEASONS[SEASONS.length - 1];
  }
  const isComplete = (r) => Array.isArray(r.results) && r.results.length > 0;
  const completedRounds = (s) => (s ? s.rounds.filter(isComplete) : []);
  function nextRound(s) {
    if (!s) return null;
    const t = today();
    const upcoming = s.rounds.filter((r) => !isComplete(r));
    return upcoming.find((r) => { const d = parseDate(r.date); return !d || d >= t; }) || upcoming[0] || null;
  }

  /* Points for one round: { driver: { pos, pts, pole, fl, dnf } } */
  function roundScores(r) {
    const out = {};
    (r.results || []).forEach((name, i) => {
      out[name] = { pos: i + 1, pts: RULES.points[i] || 0, pole: false, fl: false, dnf: false };
    });
    (r.dnf || []).forEach((name) => {
      if (!out[name]) out[name] = { pos: null, pts: 0, pole: false, fl: false, dnf: true };
    });
    const bonus = (name, key, val) => {
      if (!name) return;
      if (!out[name]) out[name] = { pos: null, pts: 0, pole: false, fl: false, dnf: false };
      out[name][key] = true;
      out[name].pts += val;
    };
    bonus(r.pole, "pole", RULES.pole || 0);
    bonus(r.fastestLap, "fl", RULES.fastestLap || 0);
    return out;
  }

  /* Championship table with the BRL tie-breaker:
     points → most wins → most 2nds → most 3rds … → whoever achieved
     the highest finishing position first. */
  function standings(s) {
    const rows = {};
    const rounds = completedRounds(s);
    rounds.forEach((r, ri) => {
      const sc = roundScores(r);
      Object.keys(sc).forEach((name) => {
        const row = rows[name] || (rows[name] = {
          name, pts: 0, counts: [], wins: 0, podiums: 0, poles: 0, fls: 0, starts: 0,
          best: null, bestAt: Infinity, perRound: {}
        });
        const x = sc[name];
        row.pts += x.pts;
        row.perRound[r.round] = x;
        if (x.pos || x.dnf) row.starts++;
        if (x.pole) row.poles++;
        if (x.fl) row.fls++;
        if (x.pos) {
          row.counts[x.pos] = (row.counts[x.pos] || 0) + 1;
          if (x.pos === 1) row.wins++;
          if (x.pos <= 3) row.podiums++;
          if (row.best === null || x.pos < row.best) { row.best = x.pos; row.bestAt = ri; }
        }
      });
    });
    const maxPos = Math.max(0, ...rounds.map((r) => r.results.length));
    return Object.values(rows).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      for (let p = 1; p <= maxPos; p++) {
        const d = (b.counts[p] || 0) - (a.counts[p] || 0);
        if (d) return d;
      }
      return a.bestAt - b.bestAt;
    });
  }

  /* ---------------- header / footer ---------------- */
  const NAV = [
    ["home", "index.html", "Home"],
    ["calendar", "calendar.html", "Calendar"],
    ["results", "results.html", "Results"],
    ["standings", "standings.html", "Standings"],
    ["drivers", "drivers.html", "Drivers"],
    ["rules", "rules.html", "Rules"]
  ];
  function buildChrome(page) {
    const active = page === "driver" ? "drivers" : page;
    const v = VERSION ? `?v=${VERSION}` : "";
    const header = document.createElement("header");
    header.className = "site-header";
    header.innerHTML = `<div class="header-inner">
      <a class="brand" href="index.html"><img src="assets/logo.png${v}" alt="BRL — Breakthrough Racing League"></a>
      <nav class="nav">${NAV.map(([id, href, label]) =>
        `<a href="${href}"${id === active ? ' class="active"' : ""}>${label}</a>`).join("")}</nav>
    </div>`;
    document.body.prepend(header);
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `© ${new Date().getFullYear()} Breakthrough Racing League`;
    document.body.append(footer);
  }

  /* ---------------- pages ---------------- */
  function homePage(main) {
    const s = currentSeason();
    const done = completedRounds(s);
    const next = nextRound(s);
    let html = `<section class="hero">
      <img src="assets/logo.png" alt="BRL — Breakthrough Racing League">
      <p>Driver profiles, race results, championship standings and the rules of the league — all in one place.</p>
    </section>`;

    if (!s || !s.rounds.length) {
      html += `<div class="section">${comingSoon("Season 1 is on its way",
        "The calendar, drivers and results will appear here as soon as they're announced.")}</div>`;
    } else {
      const table = standings(s);
      html += `<div class="section"><div class="eyebrow">${esc(s.name)}</div><div class="tiles">`;
      html += next
        ? tile(esc(next.track || "TBC"), `Next race · Round ${next.round} · ${fmtDate(next.date)}`, "gold", "calendar.html")
        : tile("Complete", "Season finished", "gold", "results.html");
      html += table.length ? tile(esc(table[0].name), `Championship leader · ${table[0].pts} pts`, "", "standings.html") : "";
      html += tile(`${done.length} / ${s.rounds.length}`, "Rounds completed", "", "results.html");
      html += DRIVERS.length ? tile(DRIVERS.length, "Drivers", "", "drivers.html") : "";
      html += `</div></div>`;
      if (table.length) {
        html += `<div class="section"><h2>Top 5</h2>${standingsTable(table.slice(0, 5), [])}
          <p><a href="standings.html">Full standings →</a></p></div>`;
      }
    }
    html += `<div class="section"><div class="tiles">
      ${tile("Calendar", "Every round, date and track", "", "calendar.html")}
      ${tile("Drivers", "Profiles and statistics", "", "drivers.html")}
      ${tile("Rules", "Points system and regulations", "", "rules.html")}
    </div></div>`;
    main.innerHTML = html;
  }

  function calendarPage(main) {
    const s = currentSeason();
    let html = `<div class="page-title"><div><div class="eyebrow">${esc(s ? s.name : "Season 1")}</div><h1>Calendar</h1></div></div>`;
    if (!s || !s.rounds.length) {
      main.innerHTML = html + comingSoon("Calendar to be announced", "Round dates and tracks will be published here once confirmed.");
      return;
    }
    const next = nextRound(s);
    html += `<div class="round-list">` + s.rounds.map((r) => {
      const st = isComplete(r)
        ? `<a class="status done" href="results.html?round=${r.round}">Results →</a>`
        : r === next ? `<span class="status next">Next race</span>` : `<span class="status muted">Upcoming</span>`;
      return `<div class="round-card${r === next ? " next" : ""}">
        <div class="rnum">R${r.round}</div>
        <div><div class="track">${esc(r.track || "Track TBC")}</div><div class="date">${fmtDate(r.date, true)}</div></div>
        ${st}
      </div>`;
    }).join("") + `</div>`;
    main.innerHTML = html;
  }

  function resultsPage(main) {
    const s = currentSeason();
    const done = completedRounds(s);
    let html = `<div class="page-title"><div><div class="eyebrow">${esc(s ? s.name : "Season 1")}</div><h1>Race Results</h1></div>`;
    if (!done.length) {
      main.innerHTML = html + `</div>` + comingSoon("No races yet", "Results from each round will be posted here after the race.");
      return;
    }
    const want = +params.get("round");
    const r = done.find((x) => x.round === want) || done[done.length - 1];
    html += `<div class="picker">${done.map((x) =>
      `<a href="results.html?round=${x.round}"${x === r ? ' class="active"' : ""}>R${x.round}</a>`).join("")}</div></div>`;
    html += `<h2>Round ${r.round} — ${esc(r.track || "")}</h2><p class="muted">${fmtDate(r.date, true)}</p>`;
    if (r.note) html += `<div class="note">${esc(r.note)}</div>`;
    const sc = roundScores(r);
    const order = r.results.concat((r.dnf || []).filter((n) => !r.results.includes(n)));
    html += `<div class="table-wrap"><table><thead><tr>
      <th>Pos</th><th>Driver</th><th class="hide-sm">Team</th><th class="num">Pts</th></tr></thead><tbody>`;
    order.forEach((name) => {
      const x = sc[name], d = driverInfo(name);
      html += `<tr class="${x.pos ? "p" + x.pos : ""}">
        <td class="pos">${x.pos || "–"}</td>
        <td>${d.number != null ? `<span class="num-badge">#${esc(d.number)}</span>` : ""}${plink(name)}
          ${x.pole ? '<span class="tag pole">POLE</span>' : ""}${x.fl ? '<span class="tag fl">FL</span>' : ""}${x.dnf ? '<span class="tag dnf">DNF</span>' : ""}</td>
        <td class="hide-sm muted">${esc(d.team || "")}</td>
        <td class="num pts">${x.pts}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    main.innerHTML = html;
  }

  function standingsTable(table, rounds) {
    let html = `<div class="table-wrap"><table><thead><tr>
      <th>Pos</th><th>Driver</th><th class="num">Pts</th><th class="num hide-sm">Wins</th>
      <th class="num hide-sm">Podiums</th><th class="num hide-md">Poles</th><th class="num hide-md">FL</th>
      ${rounds.map((r) => `<th class="num hide-md">R${r.round}</th>`).join("")}</tr></thead><tbody>`;
    table.forEach((row, i) => {
      const d = driverInfo(row.name);
      html += `<tr class="p${i + 1}"><td class="pos">${i + 1}</td>
        <td>${d.number != null ? `<span class="num-badge">#${esc(d.number)}</span>` : ""}${plink(row.name)}</td>
        <td class="num pts">${row.pts}</td><td class="num hide-sm">${row.wins}</td>
        <td class="num hide-sm">${row.podiums}</td><td class="num hide-md">${row.poles}</td><td class="num hide-md">${row.fls}</td>
        ${rounds.map((r) => {
          const x = row.perRound[r.round];
          return `<td class="rnd hide-md${x && x.pos === 1 ? " win" : ""}" title="${x ? (x.pos ? ordinal(x.pos) : "DNF") : "Did not race"}">${x ? x.pts : "–"}</td>`;
        }).join("")}</tr>`;
    });
    return html + `</tbody></table></div>`;
  }

  function standingsPage(main) {
    const s = currentSeason();
    const done = completedRounds(s);
    let html = `<div class="page-title"><div><div class="eyebrow">${esc(s ? s.name : "Season 1")}</div><h1>Championship Standings</h1></div></div>`;
    if (!done.length) {
      main.innerHTML = html + comingSoon("The championship starts soon", "The championship table will appear here after the first round.");
      return;
    }
    html += `<p class="muted">After ${done.length} of ${s.rounds.length} rounds.</p>` + standingsTable(standings(s), done);
    main.innerHTML = html;
  }

  function driversPage(main) {
    let html = `<div class="page-title"><h1>Drivers</h1>${DRIVERS.length
      ? `<input class="search" id="q" type="search" placeholder="Search drivers or teams…">` : ""}</div>`;
    if (!DRIVERS.length) {
      main.innerHTML = html + comingSoon("Driver line-up to be announced", "Driver profiles will be added here once the grid is confirmed.");
      return;
    }
    const sorted = DRIVERS.slice().sort((a, b) => a.name.localeCompare(b.name));
    html += `<div class="driver-grid" id="grid">` + sorted.map((d) =>
      `<a class="driver-card" href="driver.html?name=${encodeURIComponent(d.name)}" data-q="${esc((d.name + " " + (d.team || "")).toLowerCase())}">
        ${d.number != null ? `<div class="dnum">${esc(d.number)}</div>` : ""}
        <div class="dname">${esc(d.name)}</div><div class="dteam">${esc(d.team || "")}</div></a>`).join("") + `</div>`;
    main.innerHTML = html;
    $("#q").addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      document.querySelectorAll("#grid .driver-card").forEach((c) => {
        c.style.display = c.dataset.q.includes(q) ? "" : "none";
      });
    });
  }

  function driverPage(main) {
    const name = params.get("name") || "";
    const d = driverInfo(name);
    const s = currentSeason();
    const table = s ? standings(s) : [];
    const idx = table.findIndex((r) => r.name === name);
    const row = table[idx];
    if (!name || (!row && !DRIVERS.some((x) => x.name === name))) {
      main.innerHTML = comingSoon("Driver not found", "This driver profile isn't available yet.", "Not found") +
        `<p style="text-align:center"><a href="drivers.html">← All drivers</a></p>`;
      return;
    }
    let html = `<p><a href="drivers.html">← All drivers</a></p>
      <div class="page-title"><div><div class="eyebrow">${d.number != null ? "#" + esc(d.number) + " · " : ""}${esc(d.team || "")}</div>
      <h1>${esc(name)}</h1></div></div>`;
    if (d.bio) html += `<p>${esc(d.bio)}</p>`;
    if (!row) {
      main.innerHTML = html + comingSoon("No races yet", "Statistics will appear here once this driver has raced.");
      return;
    }
    html += `<div class="tiles">
      ${tile(ordinal(idx + 1), "Championship position", "gold")}
      ${tile(row.pts, "Points")}${tile(row.wins, "Wins")}${tile(row.podiums, "Podiums")}
      ${tile(row.poles, "Poles")}${tile(row.fls, "Fastest laps")}
      ${tile(row.best ? ordinal(row.best) : "–", "Best finish")}${tile(row.starts, "Races")}
    </div>`;
    html += `<div class="section"><h2>Race by race</h2><div class="table-wrap"><table><thead><tr>
      <th>Round</th><th>Track</th><th>Finish</th><th class="num">Pts</th></tr></thead><tbody>`;
    completedRounds(s).forEach((r) => {
      const x = row.perRound[r.round];
      html += `<tr><td><a href="results.html?round=${r.round}">R${r.round}</a></td><td>${esc(r.track || "")}</td>
        <td>${x ? (x.pos ? ordinal(x.pos) : "DNF") : '<span class="muted">Did not race</span>'}
          ${x && x.pole ? '<span class="tag pole">POLE</span>' : ""}${x && x.fl ? '<span class="tag fl">FL</span>' : ""}</td>
        <td class="num pts">${x ? x.pts : "–"}</td></tr>`;
    });
    html += `</tbody></table></div></div>`;
    main.innerHTML = html;
  }

  function rulesPage(main) {
    const p = RULES.points || [];
    let html = `<div class="page-title"><h1>Rules &amp; Regulations</h1></div>
      <h2>Championship points</h2>
      <div class="podium">
        <div class="step"><div class="place">2nd</div><div class="val">${p[1] || 0}</div><div class="lbl">POINTS</div></div>
        <div class="step first"><div class="place">1st</div><div class="val">${p[0] || 0}</div><div class="lbl">POINTS</div></div>
        <div class="step"><div class="place">3rd</div><div class="val">${p[2] || 0}</div><div class="lbl">POINTS</div></div>
      </div>`;
    const prow = (i) => `<div class="points-row"><span>${ordinal(i + 1)}</span><span><b>${p[i]}</b> ${p[i] === 1 ? "pt" : "pts"}</span></div>`;
    const half = 3 + Math.ceil((p.length - 3) / 2);
    let left = "", right = "";
    for (let i = 3; i < p.length; i++) (i < half ? (left += prow(i)) : (right += prow(i)));
    right += `<div class="points-row bonus"><span>Pole<span class="hide-xs"> Position</span> <b>+${RULES.pole}</b></span><span class="divider"></span><span>Fastest lap <b>+${RULES.fastestLap}</b></span></div>`;
    html += `<div class="points-grid"><div class="points-col">${left}</div><div class="points-col">${right}</div></div>`;
    if (RULES.tieBreaker) html += `<div class="callout"><h3>Tie-breaker</h3><p>${esc(RULES.tieBreaker)}</p></div>`;
    html += `<div class="section"><h2>Sporting regulations</h2>`;
    if (!(RULES.sections || []).length) {
      html += comingSoon("Full regulations to be published", "The full sporting regulations will be published here before the season starts.");
    } else {
      html += RULES.sections.map((sec) => `<div class="rules-section"><h3>${esc(sec.title)}</h3>
        <ol>${(sec.items || []).map((it) => `<li>${esc(it)}</li>`).join("")}</ol></div>`).join("");
    }
    main.innerHTML = html + `</div>`;
  }

  /* ---------------- dispatcher ---------------- */
  const PAGES = {
    home: homePage, calendar: calendarPage, results: resultsPage, standings: standingsPage,
    drivers: driversPage, driver: driverPage, rules: rulesPage
  };
  const page = document.body.dataset.page || "home";
  buildChrome(page);
  const main = document.querySelector("main");
  (PAGES[page] || homePage)(main);

  // exposed for testing
  window.BRL_API = { standings, roundScores };
})();
