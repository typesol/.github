// Public statistics for the organization profile (.github/workflows/stats.yml, daily): every public repository's stars
// and forks, kept by date in stats/history.json, drawn into profile/stats-*.svg and profile/repos-*.svg, and linked
// from profile/README.md between the stats markers. Public data only: traffic stays on the private dashboard.
// A repository seen for the first time gets its history rebuilt from its stargazers' and forks' dates.
//   GITHUB_TOKEN=… node scripts/stats.mjs        (the token only raises the API rate limit)
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const ORG = process.env.GITHUB_ORG ?? "typesol";
const API = "https://api.github.com";
const TOKEN = process.env.GITHUB_TOKEN ?? "";
const HISTORY = "stats/history.json";
const README = "profile/README.md";
const today = new Date().toISOString().slice(0, 10);

async function get(path, accept = "application/vnd.github+json") {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}${path}`, {
      headers: { Accept: accept, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "typesol-stats", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
      signal: AbortSignal.timeout(20_000),
    }).catch((e) => ({ ok: false, status: 0, statusText: e.name, headers: new Headers() }));
    if (res.ok) return res.json();
    if ((res.status === 0 || res.status === 429 || res.status >= 500 || res.headers.get("x-ratelimit-remaining") === "0") && attempt < 3) {
      await new Promise((r) => setTimeout(r, attempt * 15_000));
      continue;
    }
    throw new Error(`GitHub ${res.status} ${res.statusText} for ${path.split("?")[0]}`);
  }
}
async function all(path, accept) {
  const out = [];
  for (let page = 1; page < 100; page++) {
    const batch = await get(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`, accept);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out;
}

/** history.json: { "YYYY-MM-DD": { repo: [stars, forks] } } */
const history = existsSync(HISTORY) ? JSON.parse(readFileSync(HISTORY, "utf8")) : {};
const repos = (await all(`/orgs/${ORG}/repos?type=public&sort=full_name`)).filter((r) => !r.private);
const known = new Set(Object.values(history).flatMap((day) => Object.keys(day)));

for (const r of repos) {
  if (known.has(r.name)) continue;
  // First sight: per-day counts from the current stargazers' and forks' dates (unstarred and deleted ones are gone).
  const starred = (await all(`/repos/${ORG}/${r.name}/stargazers`, "application/vnd.github.star+json")).map((s) => s.starred_at.slice(0, 10));
  const forked = (await all(`/repos/${ORG}/${r.name}/forks`)).map((f) => f.created_at.slice(0, 10));
  const days = [...new Set([...starred, ...forked])].filter((d) => d < today).sort();
  for (const d of days) {
    history[d] ??= {};
    history[d][r.name] = [starred.filter((s) => s <= d).length, forked.filter((f) => f <= d).length];
  }
}
// A date is recorded only when something changed, so the repository is committed to only on change.
const now = Object.fromEntries(repos.map((r) => [r.name, [r.stargazers_count, r.forks_count]]));
const prev = Object.keys(history).sort().filter((d) => d < today).pop();
if (!prev || JSON.stringify(history[prev]) !== JSON.stringify(now)) history[today] = now;
else delete history[today];
const sorted = Object.fromEntries(Object.entries(history).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(HISTORY, JSON.stringify(sorted, null, 1) + "\n");

// Series: for every recorded date, each repository's latest known counts (carried forward between records).
const dates = Object.keys(sorted);
const names = repos.map((r) => r.name);
const series = Object.fromEntries(names.map((n) => [n, { stars: [], forks: [] }]));
const last = {};
for (const d of dates) {
  for (const n of names) {
    if (sorted[d][n]) last[n] = sorted[d][n];
    series[n].stars.push(last[n]?.[0] ?? 0);
    series[n].forks.push(last[n]?.[1] ?? 0);
  }
}
const total = (k) => dates.map((_, i) => names.reduce((a, n) => a + series[n][k][i], 0));
const totals = { stars: total("stars"), forks: total("forks") };
const sum = (k) => repos.reduce((a, r) => a + r[k], 0);

const THEMES = {
  dark: { bg: "#0d1117", line: "#30363d", fg: "#e6edf3", muted: "#8d96a0", stars: "#3ddc84", forks: "#8fb4ff" },
  light: { bg: "#ffffff", line: "#d0d7de", fg: "#1f2328", muted: "#59636e", stars: "#1a7f37", forks: "#0969da" },
};
const FONT = `font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const MONO = `font-family="ui-monospace, SFMono-Regular, Menlo, monospace"`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = (n) => n.toLocaleString("en-US");

// Step lines on a time axis from the first recorded date to today: a value holds until the next record.
const t0 = Date.parse(dates[0]);
const span = Math.max(1, Date.parse(today) - t0);
function path(values, x0, y0, w, h, max) {
  const X = (d) => (x0 + (w * (Date.parse(d) - t0)) / span).toFixed(1);
  const Y = (v) => (y0 + h - (h * v) / max).toFixed(1);
  let d = `M${X(dates[0])},${Y(values[0])}`;
  for (let i = 1; i < values.length; i++) d += `H${X(dates[i])}V${Y(values[i])}`;
  return `${d}H${x0 + w}`;
}

function statsSvg(t) {
  const W = 800, H = 250;
  const tiles = [["Public repositories", fmt(repos.length)], ["Stars", fmt(sum("stargazers_count"))], ["Forks", fmt(sum("forks_count"))]];
  // An even top, so the middle gridline is a whole number too.
  const max = Math.max(2, Math.ceil(Math.max(...totals.stars, ...totals.forks) / 2) * 2);
  const cx = 300, cy = 46, cw = 470, ch = 150;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="TypeSOL organization: ${repos.length} public repositories, ${sum("stargazers_count")} stars, ${sum("forks_count")} forks">`;
  s += `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.bg}" stroke="${t.line}"/>`;
  tiles.forEach(([label, v], i) => {
    const y = 40 + i * 66;
    s += `<text x="30" y="${y}" ${FONT} font-size="13" fill="${t.muted}">${label}</text>`;
    s += `<text x="30" y="${y + 32}" ${MONO} font-size="28" font-weight="600" fill="${t.fg}">${v}</text>`;
  });
  s += `<text x="${cx}" y="30" ${FONT} font-size="13" fill="${t.muted}">Growth since ${dates[0]}</text>`;
  s += `<rect x="${cx + 190}" y="21" width="12" height="3" rx="1.5" fill="${t.stars}"/><text x="${cx + 208}" y="30" ${FONT} font-size="12" fill="${t.muted}">Stars</text>`;
  s += `<rect x="${cx + 254}" y="21" width="12" height="3" rx="1.5" fill="${t.forks}"/><text x="${cx + 272}" y="30" ${FONT} font-size="12" fill="${t.muted}">Forks</text>`;
  for (let k = 0; k <= 2; k++) {
    const y = cy + (ch * k) / 2;
    s += `<line x1="${cx}" x2="${cx + cw}" y1="${y}" y2="${y}" stroke="${t.line}" stroke-width="1"/>`;
    s += `<text x="${cx + cw + 6}" y="${y + 4}" ${MONO} font-size="10" fill="${t.muted}">${fmt((max * (2 - k)) / 2)}</text>`;
  }
  s += `<path d="${path(totals.forks, cx, cy, cw, ch, max)}" fill="none" stroke="${t.forks}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<path d="${path(totals.stars, cx, cy, cw, ch, max)}" fill="none" stroke="${t.stars}" stroke-width="2" stroke-linejoin="round"/>`;
  s += `<text x="${cx}" y="${cy + ch + 22}" ${MONO} font-size="10" fill="${t.muted}">${dates[0]}</text>`;
  s += `<text x="${cx + cw}" y="${cy + ch + 22}" ${MONO} font-size="10" fill="${t.muted}" text-anchor="end">now</text>`;
  return s + "</svg>\n";
}

function reposSvg(t) {
  const rows = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count || a.name.localeCompare(b.name));
  const W = 800, RH = 52, H = 44 + rows.length * RH + 10;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Stars and forks per TypeSOL repository">`;
  s += `<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${t.bg}" stroke="${t.line}"/>`;
  s += `<text x="24" y="30" ${FONT} font-size="12" fill="${t.muted}">Repository</text>`;
  s += `<text x="470" y="30" ${FONT} font-size="12" fill="${t.muted}" text-anchor="end">Stars</text>`;
  s += `<text x="550" y="30" ${FONT} font-size="12" fill="${t.muted}" text-anchor="end">Forks</text>`;
  s += `<text x="580" y="30" ${FONT} font-size="12" fill="${t.muted}">Stars over time</text>`;
  rows.forEach((r, i) => {
    const y = 44 + i * RH;
    s += `<line x1="16" x2="${W - 16}" y1="${y}" y2="${y}" stroke="${t.line}"/>`;
    s += `<text x="24" y="${y + 22}" ${MONO} font-size="14" font-weight="600" fill="${t.fg}">${esc(r.name)}</text>`;
    const desc = (r.description ?? "").length > 58 ? `${r.description.slice(0, 57)}…` : (r.description ?? "");
    s += `<text x="24" y="${y + 40}" ${FONT} font-size="12" fill="${t.muted}">${esc(desc)}</text>`;
    s += `<text x="470" y="${y + 30}" ${MONO} font-size="14" fill="${t.fg}" text-anchor="end">${fmt(r.stargazers_count)}</text>`;
    s += `<text x="550" y="${y + 30}" ${MONO} font-size="14" fill="${t.fg}" text-anchor="end">${fmt(r.forks_count)}</text>`;
    const v = series[r.name].stars;
    s += `<path d="${path(v, 580, y + 12, 190, 26, Math.max(1, ...v))}" fill="none" stroke="${t.stars}" stroke-width="1.6" stroke-linejoin="round"/>`;
  });
  return s + "</svg>\n";
}

for (const [name, t] of Object.entries(THEMES)) {
  writeFileSync(`profile/stats-${name}.svg`, statsSvg(t));
  writeFileSync(`profile/repos-${name}.svg`, reposSvg(t));
}

// The README section between the markers (created once, below the intro, if missing).
const RAW = `https://raw.githubusercontent.com/${ORG}/.github/main/profile`;
const pic = (file, alt, width) =>
  `<picture>\n    <source media="(prefers-color-scheme: dark)" srcset="${RAW}/${file}-dark.svg">\n    <img alt="${alt}" src="${RAW}/${file}-light.svg" width="${width}">\n  </picture>`;
const block = [
  "<!-- stats:start (generated daily by scripts/stats.mjs; edit outside the markers) -->",
  `<p align="center">\n  ${pic("stats", `${repos.length} public repositories, ${sum("stargazers_count")} stars, ${sum("forks_count")} forks`, 800)}\n</p>`,
  `<p align="center">\n  ${pic("repos", "Stars and forks per repository", 800)}\n</p>`,
  `<p align="center"><sub>Public repositories only. Checked daily; redrawn when a number changes.</sub></p>`,
  "<!-- stats:end -->",
].join("\n");
let readme = readFileSync(README, "utf8");
const re = /<!-- stats:start[^>]*-->[\s\S]*?<!-- stats:end -->/;
if (!re.test(readme)) throw new Error(`${README} has no <!-- stats:start --> … <!-- stats:end --> markers`);
writeFileSync(README, readme.replace(re, block));
console.log(`${repos.length} public repositories, ${sum("stargazers_count")} stars, ${sum("forks_count")} forks; ${dates.length} dates`);
