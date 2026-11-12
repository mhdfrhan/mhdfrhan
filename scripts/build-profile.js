// Builds live dark/light SVGs from public GitHub data:
// - activity-{dark,light}.svg  (latest active repository & commit ticker)
// - heatmap-{dark,light}.svg   (365-day orange contribution heatmap)
// - stats-{dark,light}.svg     (KPIs + 12-month sparkline curve + top languages)
// Run: node scripts/build-profile.js
const fs = require("fs");
const path = require("path");
const { FONT, THEMES, esc } = require("./themes");

const USER = process.env.GITHUB_USER || "mhdfrhan";
const TOKEN = process.env.GITHUB_TOKEN;
const OUT = path.join(__dirname, "..", "assets");

const headers = {
  "User-Agent": "profile-readme-builder",
  Accept: "application/vnd.github+json",
};
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

async function getJson(url) {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function fetchMetadataWithFallback() {
  try {
    const [user, repos, events] = await Promise.all([
      getJson(`https://api.github.com/users/${USER}`),
      getJson(`https://api.github.com/users/${USER}/repos?per_page=100&type=owner&sort=pushed`),
      getJson(`https://api.github.com/users/${USER}/events/public?per_page=15`).catch(() => []),
    ]);
    const own = repos.filter((r) => !r.fork);
    const langMap = new Map();
    for (const r of own) if (r.language) langMap.set(r.language, (langMap.get(r.language) || 0) + 1);
    const langs = [...langMap.entries()].sort((a, b) => b[1] - a[1]);
    const push = Array.isArray(events)
      ? events.find((e) => e.type === "PushEvent" && e.payload?.commits?.length)
      : null;
    const latestRepo = own[0];
    return {
      reposCount: user.public_repos,
      stars: own.reduce((a, r) => a + r.stargazers_count, 0),
      followers: user.followers,
      langs,
      latestRepoName: push ? push.repo.name : latestRepo ? `${USER}/${latestRepo.name}` : `${USER}/links`,
      latestMsg: push
        ? push.payload.commits[push.payload.commits.length - 1].message
        : latestRepo?.description || "Shipping Next.js, Laravel & ERP systems",
      latestAt: push ? push.created_at : latestRepo?.pushed_at,
    };
  } catch (err) {
    console.warn(`API fallback (${err.message}): reading public HTML pages`);
    const [profRes, repoRes] = await Promise.all([
      fetch(`https://github.com/${USER}`, { headers: { "User-Agent": headers["User-Agent"] } }),
      fetch(`https://github.com/${USER}?tab=repositories`, { headers: { "User-Agent": headers["User-Agent"] } }),
    ]);
    const profHtml = await profRes.text();
    const repoHtml = await repoRes.text();

    const reposMatch = profHtml.match(/has\s+(\d+)\s+repositories/i);
    const follMatch = profHtml.match(/>(\d+)<\/span>\s*followers/i);

    // Collect top repo languages & star count from the first page of public repositories
    const langMap = new Map();
    for (const m of repoHtml.matchAll(/itemprop="programmingLanguage">([^<]+)<\/span>/g)) {
      const lang = m[1].trim();
      langMap.set(lang, (langMap.get(lang) || 0) + 1);
    }
    const langs = [...langMap.entries()].sort((a, b) => b[1] - a[1]);
    if (!langs.length) langs.push(["Blade", 11], ["TypeScript", 8], ["HTML", 7], ["CSS", 5], ["JavaScript", 4]);

    let stars = 0;
    for (const m of repoHtml.matchAll(/aria-label="star"[\s\S]{0,200}?(\d+)\s*<\/a>/g)) {
      stars += Number(m[1]);
    }

    const latestRepoMatch = repoHtml.match(/href="\/([^"]+?)"[^>]*itemprop="name codeRepository"/);
    const latestTimeMatch = repoHtml.match(/<relative-time[^>]*datetime="([^"]+)"/);

    return {
      reposCount: reposMatch ? Number(reposMatch[1]) : 40,
      stars: stars || 2,
      followers: follMatch ? Number(follMatch[1]) : 1,
      langs,
      latestRepoName: latestRepoMatch ? latestRepoMatch[1] : `${USER}/links`,
      latestMsg: "Shipping Next.js, Laravel & modern web systems",
      latestAt: latestTimeMatch ? latestTimeMatch[1] : new Date().toISOString(),
    };
  }
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
      row: Number(m[3]),
      col: Number(m[4]),
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
    else if (i === sorted.length - 1) continue;
    else break;
  }
  return { best, current };
}

function monthlySeries(days) {
  const map = new Map();
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  for (const d of sorted) {
    const ym = d.date.slice(0, 7);
    map.set(ym, (map.get(ym) || 0) + d.count);
  }
  return [...map.entries()]
    .slice(-12)
    .map(([ym, total]) => ({
      label: new Date(`${ym}-01T00:00:00Z`).toLocaleString("en", { month: "short", timeZone: "UTC" }),
      total,
    }));
}

function relativeTime(iso) {
  if (!iso) return "Recently";
  const diffMin = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function truncate(str, max) {
  const clean = String(str || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function activitySvg(act, mode) {
  const t = THEMES[mode];
  const W = 900, H = 74;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <style>
    text { ${FONT}; }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
    .bar { transform-box: fill-box; transform-origin: left; animation: barIn 0.8s cubic-bezier(.22,1,.36,1) both; }
    @keyframes barIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${t.bgCard}" stroke="${t.border}"/>
  <rect class="bar" x="0" y="0" width="120" height="2" fill="${t.accent}"/>
  <rect x="24" y="21" width="8" height="8" fill="${t.green}" class="pulse"/>
  <text x="42" y="29" font-size="11" font-weight="800" letter-spacing="1.4" fill="${t.accent}">LATEST ACTIVITY</text>
  <text x="166" y="29" font-size="12" font-weight="700" fill="${t.text}">${esc(act.repo)}</text>
  <text x="24" y="52" font-size="13" font-weight="500" fill="${t.textSecondary}">${esc(act.message)}</text>
  <text x="${W - 24}" y="29" font-size="11" font-weight="700" fill="${t.textMuted}" text-anchor="end">${esc(act.when.toUpperCase())}</text>
  <text x="${W - 24}" y="52" font-size="11.5" font-weight="700" fill="${t.accent}" text-anchor="end">${act.streak > 0 ? `${act.streak}d active streak` : `${act.monthTotal} commits (30d)`}</text>
</svg>`;
}

function heatmapSvg(days, total, mode) {
  const t = THEMES[mode];
  const cell = 11, gap = 3, step = cell + gap;
  const cols = Math.max(...days.map((d) => d.col)) + 1;
  const left = 36, top = 58;
  const W = 900, H = 208;
  const gridW = cols * step;
  const offsetX = left + Math.max(0, (W - left * 2 - gridW) / 2);

  let cells = "";
  for (const d of days) {
    const x = offsetX + d.col * step;
    const y = top + d.row * step;
    const delay = (d.col * 0.014 + d.row * 0.008).toFixed(2);
    const shimmer = d.level >= 3
      ? ` class="c s" style="animation-delay:${delay}s,${(1.5 + (d.col % 7) * 0.35).toFixed(1)}s"`
      : ` class="c" style="animation-delay:${delay}s"`;
    cells += `<rect${shimmer} x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${t.heatColors[d.level]}"><title>${d.count} contributions on ${d.date}</title></rect>`;
  }

  const months = [];
  let lastMonth = "";
  for (const d of days.filter((x) => x.row === 0)) {
    const mo = new Date(`${d.date}T00:00:00Z`).toLocaleString("en", { month: "short", timeZone: "UTC" });
    if (mo !== lastMonth) {
      months.push(`<text x="${offsetX + d.col * step}" y="${top - 10}" font-size="10" fill="${t.textMuted}" font-weight="600">${mo}</text>`);
      lastMonth = mo;
    }
  }

  const legendX = W - left - 5 * step - 70;
  const legend =
    `<text x="${legendX}" y="${H - 18}" font-size="10" fill="${t.textMuted}" font-weight="600">Less</text>` +
    t.heatColors.map((c, i) => `<rect x="${legendX + 30 + i * step}" y="${H - 27}" width="${cell}" height="${cell}" fill="${c}"/>`).join("") +
    `<text x="${legendX + 30 + 5 * step + 4}" y="${H - 18}" font-size="10" fill="${t.textMuted}" font-weight="600">More</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <style>
    text { ${FONT}; }
    .c { transform-box: fill-box; transform-origin: center; }
    .s { animation: glow 3.2s ease-in-out infinite; }
    @keyframes glow { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${t.bgCard}" stroke="${t.border}"/>
  <text x="${left}" y="30" font-size="15" font-weight="800" fill="${t.text}">${total.toLocaleString("en")} contributions <tspan fill="${t.textSecondary}" font-weight="500">in the last year</tspan></text>
  <text x="${W - left}" y="30" font-size="12" font-weight="700" fill="${t.accent}" text-anchor="end">@${USER}</text>
  ${months.join("")}
  ${cells}
  ${legend}
</svg>`;
}

function buildSparkline(series, t, left, top, width, height) {
  const maxVal = Math.max(1, ...series.map((m) => m.total));
  const stepX = width / Math.max(1, series.length - 1);

  const pts = series.map((m, i) => ({
    x: Number((left + i * stepX).toFixed(1)),
    y: Number((top + height - (m.total / maxVal) * (height - 14)).toFixed(1)),
    label: m.label,
    total: m.total,
  }));

  // Smooth cubic Bezier path
  let linePath = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1];
    const cx = Number(((p0.x + p1.x) / 2).toFixed(1));
    linePath += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${top + height} L ${pts[0].x} ${top + height} Z`;

  const dots = pts
    .map((p, i) => {
      const peak = p.total === maxVal && p.total > 0;
      const r = peak ? 4.2 : 2.5;
      const label = peak
        ? `<text x="${p.x}" y="${p.y - 9}" font-size="9.5" font-weight="800" fill="${t.accent}" text-anchor="middle">${p.total}</text>`
        : "";
      return `<circle class="dot" style="animation-delay:${(0.35 + i * 0.05).toFixed(2)}s" cx="${p.x}" cy="${p.y}" r="${r}" fill="${peak ? t.accent : t.bgCard}" stroke="${t.accent}" stroke-width="1.8"/>${label}`;
    })
    .join("");

  const xLabels = pts
    .map((p) => `<text x="${p.x}" y="${top + height + 16}" font-size="9.5" font-weight="600" fill="${t.textMuted}" text-anchor="middle">${p.label}</text>`)
    .join("");

  return { areaPath, linePath, dots, xLabels };
}

function statsSvg(s, mode) {
  const t = THEMES[mode];
  const W = 900, H = 332, left = 36;
  const items = [
    ["Public Repos", s.repos],
    ["Stars Earned", s.stars],
    ["Followers", s.followers],
    ["Best Streak", `${s.best}d`],
    ["1Y Activity", s.total],
  ];
  const colW = (W - left * 2) / items.length;
  const nums = items
    .map(([label, val], i) => {
      const x = left + i * colW;
      return `<g class="n" style="animation-delay:${(0.08 + i * 0.09).toFixed(2)}s">
        <text x="${x}" y="72" font-size="30" font-weight="800" fill="${t.text}" letter-spacing="-0.8">${val}</text>
        <text x="${x}" y="92" font-size="10.5" font-weight="700" fill="${t.textMuted}" letter-spacing="1.1">${label.toUpperCase()}</text>
      </g>`;
    })
    .join("");

  const spark = buildSparkline(s.monthly, t, left, 134, W - left * 2, 74);

  const langs = s.langs.slice(0, 6);
  const totalL = langs.reduce((a, b) => a + b[1], 0) || 1;
  const barW = W - left * 2;
  let x = left, bars = "", labels = "";
  langs.forEach(([name, n], i) => {
    const w = Math.max(4, (n / totalL) * barW);
    const shade = t.langShades[i % t.langShades.length];
    bars += `<rect x="${x.toFixed(1)}" y="262" width="${Math.max(2, w - 2).toFixed(1)}" height="8" fill="${shade}"/>`;
    const lx = left + (i % 3) * 280;
    const ly = 294 + Math.floor(i / 3) * 20;
    labels += `<rect x="${lx}" y="${ly - 8}" width="8" height="8" fill="${shade}"/><text x="${lx + 16}" y="${ly}" font-size="12" font-weight="600" fill="${t.textSecondary}">${esc(name)} <tspan fill="${t.textMuted}">${((n / totalL) * 100).toFixed(0)}%</tspan></text>`;
    x += w;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0.34"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0.01"/>
    </linearGradient>
  </defs>
  <style>
    text { ${FONT}; }
    .n { animation: up .5s cubic-bezier(.22,1,.36,1) both; }
    @keyframes up { from { transform: translateY(6px); } to { transform: none; } }
    .b { transform-box: fill-box; transform-origin: left center; animation: grow .8s cubic-bezier(.22,1,.36,1) both; }
    @keyframes grow { from { transform: scaleX(0.35); } to { transform: scaleX(1); } }
    .sparkLine { stroke-dasharray: 1200; stroke-dashoffset: 0; animation: pulseLine 4s ease-in-out infinite; }
    @keyframes pulseLine { 0%,100% { opacity: 1; } 50% { opacity: 0.72; } }
    .dot { opacity: 1; }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${t.bgCard}" stroke="${t.border}"/>
  <text x="${left}" y="34" font-size="11.5" font-weight="800" fill="${t.accent}" letter-spacing="1.8">GITHUB OVERVIEW &amp; 12-MONTH CADENCE</text>
  ${nums}
  <line x1="${left}" y1="112" x2="${W - left}" y2="112" stroke="${t.borderSoft}" stroke-width="1"/>
  <text x="${left}" y="128" font-size="10.5" font-weight="700" fill="${t.textMuted}" letter-spacing="1.1">MONTHLY COMMIT MOMENTUM</text>
  <path d="${spark.areaPath}" fill="url(#areaGrad)"/>
  <path class="sparkLine" d="${spark.linePath}" stroke="${t.accent}" stroke-width="2.2" fill="none"/>
  ${spark.dots}
  ${spark.xLabels}
  <text x="${left}" y="250" font-size="10.5" font-weight="700" fill="${t.textMuted}" letter-spacing="1.1">TOP LANGUAGES</text>
  <g class="b">${bars}</g>
  ${labels}
</svg>`;
}

(async () => {
  const [meta, days] = await Promise.all([
    fetchMetadataWithFallback(),
    getContributions(),
  ]);

  const total = days.reduce((a, d) => a + d.count, 0);
  const { best, current } = streaks(days);
  const monthly = monthlySeries(days);
  const monthTotal = [...days].slice(-30).reduce((a, d) => a + d.count, 0);

  const activity = {
    repo: meta.latestRepoName,
    message: truncate(meta.latestMsg, 68),
    when: relativeTime(meta.latestAt),
    streak: current,
    monthTotal,
  };

  fs.mkdirSync(OUT, { recursive: true });
  for (const mode of ["dark", "light"]) {
    fs.writeFileSync(path.join(OUT, `activity-${mode}.svg`), activitySvg(activity, mode));
    fs.writeFileSync(path.join(OUT, `heatmap-${mode}.svg`), heatmapSvg(days, total, mode));
    fs.writeFileSync(
      path.join(OUT, `stats-${mode}.svg`),
      statsSvg(
        {
          repos: meta.reposCount,
          stars: meta.stars,
          followers: meta.followers,
          best,
          total,
          monthly,
          langs: meta.langs,
        },
        mode
      )
    );
  }

  console.log(
    `Generated dark/light activity, heatmap (${total} contributions), stats (${meta.reposCount} repos, ${meta.langs.length} langs)`
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
