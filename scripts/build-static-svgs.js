// Generates editorial Dark & Light SVGs matching hannn.my.id:
// - hero-{dark,light}.svg
// - btn-{id}-{dark,light}.svg
// - project-{slug}-{dark,light}.svg
// - marquee-{1,2}-{dark,light}.svg
// Run: node scripts/build-static-svgs.js
const fs = require("fs");
const path = require("path");
const { FONT, THEMES, esc } = require("./themes");

const OUT = path.join(__dirname, "..", "assets");
const START_YEAR = 2022;
const YEARS = new Date().getFullYear() - START_YEAR;

function buildHero(mode) {
  const t = THEMES[mode];
  const isDark = mode === "dark";
  const orbOpacityA = isDark ? "0.48" : "0.18";
  const orbOpacityB = isDark ? "0.28" : "0.12";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="304" viewBox="0 0 900 304" fill="none">
  <title>Muhammad Farhan — Fullstack Web Developer</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="900" y2="304" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${t.bg}"/>
      <stop offset="1" stop-color="${isDark ? "#131317" : "#F1F5F9"}"/>
    </linearGradient>
    <radialGradient id="orbA" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="${orbOpacityA}"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="orbB" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${t.accentSoft}" stop-opacity="${orbOpacityB}"/>
      <stop offset="1" stop-color="${t.accentSoft}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="36" height="36" patternUnits="userSpaceOnUse">
      <path d="M36 0H0V36" stroke="${t.gridLine}" stroke-width="1"/>
    </pattern>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${t.accent}" stop-opacity="0"/>
      <stop offset="0.5" stop-color="${t.accent}"/>
      <stop offset="1" stop-color="${t.accent}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="card"><rect width="900" height="304"/></clipPath>
    <clipPath id="roleClip"><rect x="52" y="142" width="790" height="48"/></clipPath>
  </defs>

  <style>
    text { ${FONT}; }
    .orbA { animation: driftA 9s ease-in-out infinite alternate; }
    .orbB { animation: driftB 11s ease-in-out infinite alternate; }
    @keyframes driftA { from { transform: translate(0,0) scale(1); } to { transform: translate(85px,24px) scale(1.12); } }
    @keyframes driftB { from { transform: translate(0,0) scale(1); } to { transform: translate(-75px,-20px) scale(1.15); } }

    .eyebrow { animation: rise 0.6s cubic-bezier(.22,1,.36,1) both; }
    .name    { animation: rise 0.7s cubic-bezier(.22,1,.36,1) both; }
    .meta    { animation: rise 0.7s cubic-bezier(.22,1,.36,1) both; }
    @keyframes rise { from { transform: translateY(8px); } to { transform: translateY(0); } }

    .role { opacity: 0; animation: cycle 12s cubic-bezier(.22,1,.36,1) infinite; }
    .r1 { animation-delay: -0.6s; }
    .r2 { animation-delay: 2.4s; }
    .r3 { animation-delay: 5.4s; }
    .r4 { animation-delay: 8.4s; }
    @keyframes cycle {
      0%   { opacity: 0; transform: translateY(22px); }
      5%   { opacity: 1; transform: translateY(0); }
      22%  { opacity: 1; transform: translateY(0); }
      27%  { opacity: 0; transform: translateY(-22px); }
      100% { opacity: 0; transform: translateY(-22px); }
    }

    .line { transform-origin: left center; animation: grow 1.2s cubic-bezier(.22,1,.36,1) 0.6s both; }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }

    .scan { animation: scan 5.5s linear infinite; }
    @keyframes scan { from { transform: translateX(-300px); } to { transform: translateX(1200px); } }

    .pulse { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
    .cursor { animation: blink 1s steps(1) infinite; }
    @keyframes blink { 50% { opacity: 0; } }
  </style>

  <g clip-path="url(#card)">
    <rect width="900" height="304" fill="url(#bg)"/>
    <rect width="900" height="304" fill="url(#grid)"/>
    <g class="orbA"><circle cx="720" cy="70" r="195" fill="url(#orbA)"/></g>
    <g class="orbB"><circle cx="780" cy="260" r="175" fill="url(#orbB)"/></g>
    <rect class="scan" y="0" width="280" height="2" fill="url(#sweep)" opacity="0.8"/>
  </g>
  <rect x="0.5" y="0.5" width="899" height="303" stroke="${t.border}" stroke-opacity="0.85"/>

  <g class="eyebrow">
    <rect x="56" y="48" width="8" height="8" fill="${t.green}" class="pulse"/>
    <text x="74" y="56" font-size="11.5" font-weight="700" letter-spacing="1.8" fill="${t.textSecondary}">AVAILABLE FOR WORK  ·  PEKANBARU, ID</text>
    <text x="844" y="56" font-size="11" font-weight="700" letter-spacing="1.4" fill="${t.textMuted}" text-anchor="end">EST. 2022</text>
  </g>

  <g class="name">
    <text x="54" y="124" font-size="56" font-weight="800" letter-spacing="-1.6" fill="${t.text}">Muhammad Farhan<tspan fill="${t.accent}">.</tspan></text>
  </g>

  <g clip-path="url(#roleClip)">
    <g class="role r1"><text x="56" y="176" font-size="30" font-weight="700" fill="${t.accent}">Fullstack Web Developer</text></g>
    <g class="role r2"><text x="56" y="176" font-size="30" font-weight="700" fill="${t.accent}">Founder of HanDigital</text></g>
    <g class="role r3"><text x="56" y="176" font-size="30" font-weight="700" fill="${t.accent}">Next.js · React · Laravel</text></g>
    <g class="role r4"><text x="56" y="176" font-size="30" font-weight="700" fill="${t.accent}">SaaS, ERP &amp; Digital Products</text></g>
  </g>

  <rect class="line" x="56" y="206" width="240" height="2" fill="${t.accent}"/>

  <g class="meta">
    <text x="56" y="242" font-size="14" font-weight="500" fill="${t.textSecondary}">Informatics Engineering  ·  <!--years-->${YEARS}<!--/years-->+ yrs building web apps &amp; systems</text>
    <text x="56" y="268" font-size="13" font-weight="700" fill="${t.textMuted}">hannn.my.id  ·  handigital.biz.id<tspan fill="${t.accent}" class="cursor">  ▍</tspan></text>
  </g>
</svg>`;
}

const BUTTONS = [
  {
    id: "portfolio",
    label: "PORTFOLIO",
    sub: "hannn.my.id",
    icon: `<rect x="13" y="13" width="12" height="12" stroke="ACCENT" stroke-width="1.6"/><path d="M13 17H25" stroke="ACCENT" stroke-width="1.4"/>`,
  },
  {
    id: "agency",
    label: "AGENCY",
    sub: "HanDigital",
    icon: `<path d="M19 12L25 25H13L19 12Z" stroke="ACCENT" stroke-width="1.6"/>`,
  },
  {
    id: "linkedin",
    label: "LINKEDIN",
    sub: "Connect",
    icon: `<circle cx="15.5" cy="14.5" r="1.3" fill="ACCENT"/><path d="M14.5 18V24M18 18V24M18 20C18 18.5 23 18 23 20.5V24" stroke="ACCENT" stroke-width="1.6"/>`,
  },
  {
    id: "whatsapp",
    label: "WHATSAPP",
    sub: "Fast Chat",
    icon: `<path d="M19 13A6 6 0 0 1 24 22.2L25 25L22.2 24A6 6 0 1 1 19 13Z" stroke="ACCENT" stroke-width="1.5"/>`,
  },
  {
    id: "email",
    label: "EMAIL",
    sub: "Say Hello",
    icon: `<rect x="13" y="14" width="12" height="10" stroke="ACCENT" stroke-width="1.5"/><path d="M13 15L19 20L25 15" stroke="ACCENT" stroke-width="1.5"/>`,
  },
];

function buildButton(btn, mode) {
  const t = THEMES[mode];
  const W = 166, H = 42;
  const icon = btn.icon.replace(/ACCENT/g, t.accent);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <style>
    text { ${FONT}; }
    .bar { transform-box: fill-box; transform-origin: left; animation: barIn 0.8s cubic-bezier(.22,1,.36,1) both; }
    @keyframes barIn { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  </style>
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${t.bgSurface}" stroke="${t.border}"/>
  <rect class="bar" x="0" y="0" width="${W}" height="2" fill="${t.accent}"/>
  <rect x="7" y="7" width="24" height="26" fill="${t.bgMuted}" stroke="${t.borderSoft}"/>
  ${icon}
  <text x="40" y="18" font-size="9.5" font-weight="800" letter-spacing="1.2" fill="${t.textMuted}">${esc(btn.label)}</text>
  <text x="40" y="32" font-size="12" font-weight="700" fill="${t.text}">${esc(btn.sub)}</text>
  <text x="${W - 12}" y="25" font-size="13" font-weight="700" fill="${t.accent}" text-anchor="end">↗</text>
</svg>`;
}

const PROJECTS = [
  {
    slug: "escaluc",
    idx: "01",
    cat: "ERP & POS",
    title: "Escaluc OS",
    desc1: "Omnichannel ERP & Point-of-Sale system",
    desc2: "for multi-branch gadget retail & IMEI tracking.",
    tags: ["Laravel", "Vue.js", "Inertia", "Electron"],
  },
  {
    slug: "kknflow",
    idx: "02",
    cat: "SAAS PLATFORM",
    title: "KKNFlow",
    desc1: "Team & work-program management SaaS",
    desc2: "with daily logs, digital ledger & Midtrans pay.",
    tags: ["Laravel", "Inertia", "Midtrans", "PWA"],
  },
  {
    slug: "bka",
    idx: "03",
    cat: "ENTERPRISE AI",
    title: "Portal BKA UMRI",
    desc1: "Academic & financial affairs web portal",
    desc2: "powered by NVIDIA NIM AI request triage.",
    tags: ["React", "TypeScript", "Laravel", "NVIDIA NIM"],
  },
  {
    slug: "sala",
    idx: "04",
    cat: "COMMERCE & POS",
    title: "Sala Coffee",
    desc1: "Coffee shop POS, QR table ordering &",
    desc2: "inventory with automated Midtrans settlement.",
    tags: ["Laravel 12", "Livewire 3", "Tailwind", "Midtrans"],
  },
];

function buildProjectCard(p, i, mode) {
  const t = THEMES[mode];
  const W = 438, H = 166;
  let tx = 20;
  const tagSvgs = p.tags
    .map((tag) => {
      const pw = Math.round(tag.length * 6.8 + 18);
      const s = `<g transform="translate(${tx},124)"><rect width="${pw}" height="22" fill="${t.bgMuted}" stroke="${t.borderSoft}"/><text x="${pw / 2}" y="14.5" font-size="10.5" font-weight="600" fill="${t.textSecondary}" text-anchor="middle">${esc(tag)}</text></g>`;
      tx += pw + 8;
      return s;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <style>
    text { ${FONT}; }
    .sweep { transform-box: fill-box; transform-origin: left; animation: sweep 0.9s cubic-bezier(.22,1,.36,1) ${(0.1 + i * 0.1).toFixed(1)}s both; }
    @keyframes sweep { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  </style>
  <g>
    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="${t.bgCard}" stroke="${t.border}"/>
    <rect class="sweep" x="0" y="0" width="96" height="2.5" fill="${t.accent}"/>
    <text x="20" y="30" font-size="11" font-weight="800" letter-spacing="1.4" fill="${t.accent}">${p.idx}  ·  ${esc(p.cat)}</text>
    <text x="${W - 20}" y="30" font-size="11" font-weight="700" fill="${t.textMuted}" text-anchor="end">VIEW ↗</text>
    <text x="20" y="60" font-size="21" font-weight="800" letter-spacing="-0.4" fill="${t.text}">${esc(p.title)}</text>
    <text x="20" y="84" font-size="12.5" font-weight="500" fill="${t.textSecondary}">${esc(p.desc1)}</text>
    <text x="20" y="102" font-size="12.5" font-weight="500" fill="${t.textSecondary}">${esc(p.desc2)}</text>
    ${tagSvgs}
  </g>
</svg>`;
}

function buildMarquee(labels, reverse, mode) {
  const t = THEMES[mode];
  const H = 44, GAP = 12, VIEW_W = 900, charW = 8.1;

  let x = 0, track = "";
  for (const l of labels) {
    const w = Math.round(l.length * charW + 36);
    track +=
      `<g transform="translate(${x},4)">` +
      `<rect width="${w}" height="${H - 8}" fill="${t.bgSurface}" stroke="${t.border}"/>` +
      `<rect x="14" y="${(H - 8) / 2 - 3}" width="6" height="6" fill="${t.accent}"/>` +
      `<text x="28" y="${(H - 8) / 2 + 4.5}" font-size="13" font-weight="600" fill="${t.text}">${esc(l)}</text>` +
      `</g>`;
    x += w + GAP;
  }

  const reps = Math.ceil((VIEW_W * 2) / x) + 1;
  let body = "";
  for (let i = 0; i < reps; i++) body += `<g transform="translate(${i * x},0)">${track}</g>`;

  const dur = Math.round(x / 40);
  const from = reverse ? -x : 0;
  const to = reverse ? 0 : -x;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW_W}" height="${H}" viewBox="0 0 ${VIEW_W} ${H}" fill="none">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="0.08" stop-color="#fff"/>
      <stop offset="0.92" stop-color="#fff"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <mask id="m"><rect width="${VIEW_W}" height="${H}" fill="url(#fade)"/></mask>
  </defs>
  <style>
    text { ${FONT}; }
    .t { animation: slide ${dur}s linear infinite; }
    @keyframes slide { from { transform: translateX(${from}px); } to { transform: translateX(${to}px); } }
  </style>
  <g mask="url(#m)"><g class="t">${body}</g></g>
</svg>`;
}

const MARQUEE_ROWS = [
  ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "GSAP", "Vite", "JavaScript"],
  ["Laravel", "Livewire", "Inertia.js", "PHP", "Node.js", "Express", "MySQL", "Firebase", "Midtrans"],
];

fs.mkdirSync(OUT, { recursive: true });
for (const mode of ["dark", "light"]) {
  fs.writeFileSync(path.join(OUT, `hero-${mode}.svg`), buildHero(mode));
  for (const btn of BUTTONS) {
    fs.writeFileSync(path.join(OUT, `btn-${btn.id}-${mode}.svg`), buildButton(btn, mode));
  }
  PROJECTS.forEach((p, i) => {
    fs.writeFileSync(path.join(OUT, `project-${p.slug}-${mode}.svg`), buildProjectCard(p, i, mode));
  });
  MARQUEE_ROWS.forEach((row, idx) => {
    fs.writeFileSync(path.join(OUT, `marquee-${idx + 1}-${mode}.svg`), buildMarquee(row, idx === 1, mode));
  });
}

console.log("Static dark/light editorial SVGs generated.");
