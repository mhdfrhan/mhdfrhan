// Builds assets/heatmap.svg and assets/stats.svg from public GitHub data.
// No third-party image services. Run: node scripts/build-profile.js
// Optional env: GITHUB_USER (default mhdfrhan), GITHUB_TOKEN (higher API rate limit)
const fs = require("fs");
const path = require("path");

const USER = process.env.GITHUB_USER || "mhdfrhan";
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = path.join(__dirname, "..", "assets");

const headers = { "User-Agent": "profile-readme-builder", Accept: "application/vnd.github+json" };
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

async function getJson(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function getContributions() {
  const r = await fetch(`https://github.com/users/${USER}/contributions`, {
    headers: { "User-Agent": headers["User-Agent"] },
  });
  if (!r.ok) throw new Error(`contributions -> ${r.status}`);
  const html = await r.text();

  const counts = new Map();
  for (const m of html.matchAll(/for="(contribution-day-component-\d+-\d+)"[^>]*>([^<]*)</g)) {
    const n = m[2].match(/^(\d+) contribution/);
    counts.set(m[1], n ? Number(n[1]) : 0);
  }

  const days = [];
  for (const m of html.matchAll(/<td[^>]*?data-date="([\d-]+)"[^>]*?id="(contribution-day-component-(\d+)-(\d+))"[^>]*?data-level="(\d)"/g)) {
    days.push({
      date: m[1],
      col: Number(m[4]),
      row: Number(m[3]),
      level: Number(m[5]),
      count: counts.get(m[2]) || 0,
    });
  }
  if (!days.length) throw new Error("no contribution cells parsed");
  return days;
}

function streaks(days) {
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, run = 0;
  for (const d of sorted) {
    run = d.count > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].count > 0) current++;
    else if (i === sorted.length - 1) continue; // today may not have commits yet
    else break;
  }
  return { best, current };
}

const FONT = `font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif`;
const COLORS = ["#27272a", "#7c2d12", "#c2410c", "#ed5d31", "#fb923c"];

function heatmapSvg(days, total) {
  const cell = 11, gap = 3, step = cell + gap;
  const cols = Math.max(...days.map((d) => d.col)) + 1;
  const left = 36, top = 58;
  const W = 900, H = 210;
  const gridW = cols * step;
  const offsetX = left + Math.max(0, (W - left * 2 - gridW) / 2);

  let cells = "";
  for (const d of days) {
    const x = offsetX + d.col * step;
    const y = top + d.row * step;
    const delay = (d.col * 0.035 + d.row * 0.012).toFixed(2);
    const shimmer = d.level >= 3 ? ` class="c s" style="animation-delay:${delay}s,${(2 + (d.col % 7) * 0.4).toFixed(1)}s"` : ` class="c" style="animation-delay:${delay}s"`;
    cells += `<rect${shimmer} x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${COLORS[d.level]}"><title>${d.count} contributions on ${d.date}</title></rect>`;
  }

  const months = [];
  let lastMonth = "";
  for (const d of days.filter((x) => x.row === 0)) {
    const mo = new Date(d.date + "T00:00:00Z").toLocaleString("en", { month: "short", timeZone: "UTC" });
    if (mo !== lastMonth) {
      months.push(`<text x="${offsetX + d.col * step}" y="${top - 10}" font-size="10" fill="#71717a" font-weight="600">${mo}</text>`);
      lastMonth = mo;
    }
  }

  const legendX = W - left - 5 * step - 70;
  const legend =
    `<text x="${legendX}" y="${H - 20}" font-size="10" fill="#71717a" font-weight="600">Less</text>` +
    COLORS.map((c, i) => `<rect x="${legendX + 30 + i * step}" y="${H - 29}" width="${cell}" height="${cell}" fill="${c}"/>`).join("") +
    `<text x="${legendX + 30 + 5 * step + 4}" y="${H - 20}" font-size="10" fill="#71717a" font-weight="600">More</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
<style>
text{${FONT}}
.c{opacity:0;animation:pop .5s cubic-bezier(.22,1,.36,1) forwards}
.s{animation:pop .5s cubic-bezier(.22,1,.36,1) forwards,glow 3.2s ease-in-out infinite}
@keyframes pop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}
@keyframes glow{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}
.c{transform-box:fill-box;transform-origin:center}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" fill="#09090b" stroke="#3f3f46" stroke-opacity=".7"/>
<text x="${left}" y="30" font-size="15" font-weight="800" fill="#fafafa">${total.toLocaleString("en")} contributions <tspan fill="#a1a1aa" font-weight="500">in the last year</tspan></text>
<text x="${W - left}" y="30" font-size="12" font-weight="700" fill="#ed5d31" text-anchor="end">@${USER}</text>
${months.join("")}
${cells}
${legend}
</svg>`;
}

function statsSvg(s) {
  const W = 900, H = 200, left = 36;
  const items = [
    ["Repositories", s.repos],
    ["Stars earned", s.stars],
    ["Followers", s.followers],
    ["Best streak", `${s.best}d`],
  ];
  const colW = (W - left * 2) / items.length;
  const nums = items
    .map(([label, val], i) => {
      const x = left + i * colW;
      return `<g class="n" style="animation-delay:${(0.1 + i * 0.12).toFixed(2)}s">
<text x="${x}" y="70" font-size="34" font-weight="800" fill="#fafafa" letter-spacing="-1">${val}</text>
<text x="${x}" y="92" font-size="11" font-weight="700" fill="#71717a" letter-spacing="1.2">${label.toUpperCase()}</text></g>`;
    })
    .join("");

  const langs = s.langs.slice(0, 6);
  const totalL = langs.reduce((a, b) => a + b[1], 0) || 1;
  const barW = W - left * 2;
  let x = left;
  let bars = "", labels = "";
  langs.forEach(([name, n], i) => {
    const w = Math.max(4, (n / totalL) * barW);
    const shade = ["#ed5d31", "#fb923c", "#c2410c", "#fdba74", "#9a3412", "#71717a"][i];
    bars += `<rect class="b" style="animation-delay:${(0.5 + i * 0.1).toFixed(1)}s" x="${x.toFixed(1)}" y="128" width="${(w - 2).toFixed(1)}" height="8" fill="${shade}"/>`;
    const lx = left + (i % 3) * 270;
    const ly = 162 + Math.floor(i / 3) * 20;
    labels += `<rect x="${lx}" y="${ly - 8}" width="8" height="8" fill="${shade}"/><text x="${lx + 16}" y="${ly}" font-size="12" font-weight="600" fill="#d4d4d8">${name} <tspan fill="#71717a">${((n / totalL) * 100).toFixed(0)}%</tspan></text>`;
    x += w;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + 20}" viewBox="0 0 ${W} ${H + 20}" fill="none">
<style>
text{${FONT}}
.n{opacity:0;animation:up .8s cubic-bezier(.22,1,.36,1) forwards}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.b{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:grow 1s cubic-bezier(.22,1,.36,1) forwards}
@keyframes grow{to{transform:scaleX(1)}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H + 19}" fill="#09090b" stroke="#3f3f46" stroke-opacity=".7"/>
<text x="${left}" y="34" font-size="12" font-weight="800" fill="#ed5d31" letter-spacing="1.8">GITHUB OVERVIEW</text>
${nums}
<text x="${left}" y="118" font-size="11" font-weight="700" fill="#71717a" letter-spacing="1.2">TOP LANGUAGES</text>
${bars}
${labels}
</svg>`;
}

(async () => {
  const [user, repos, days] = await Promise.all([
    getJson(`https://api.github.com/users/${USER}`),
    getJson(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner`),
    getContributions(),
  ]);

  const own = repos.filter((r) => !r.fork);
  const langMap = new Map();
  for (const r of own) if (r.language) langMap.set(r.language, (langMap.get(r.language) || 0) + 1);
  const langs = [...langMap.entries()].sort((a, b) => b[1] - a[1]);

  const total = days.reduce((a, d) => a + d.count, 0);
  const { best } = streaks(days);

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "heatmap.svg"), heatmapSvg(days, total));
  fs.writeFileSync(
    path.join(OUT, "stats.svg"),
    statsSvg({
      repos: user.public_repos,
      stars: own.reduce((a, r) => a + r.stargazers_count, 0),
      followers: user.followers,
      best,
      langs,
    })
  );
  console.log(`heatmap.svg (${total} contributions), stats.svg (${own.length} repos, ${langs.length} languages)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
