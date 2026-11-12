// Generates assets/marquee-*.svg (infinite scrolling tech stack, two rows, opposite directions).
// Run: node scripts/build-marquee.js
const fs = require("fs");
const path = require("path");

const rows = [
  ["Next.js", "React", "TypeScript", "Tailwind CSS", "Framer Motion", "GSAP", "Vite", "JavaScript"],
  ["Laravel", "Livewire", "Inertia.js", "PHP", "Node.js", "Express", "MySQL", "Firebase", "Midtrans"],
];

const H = 44;
const GAP = 12;
const VIEW_W = 900;
const charW = 8.1;

function pill(label, x) {
  const w = Math.round(label.length * charW + 36);
  const svg =
    `<g transform="translate(${x},4)">` +
    `<rect width="${w}" height="${H - 8}" fill="#18181b" stroke="#3f3f46"/>` +
    `<rect x="14" y="${(H - 8) / 2 - 3}" width="6" height="6" fill="#ed5d31"/>` +
    `<text x="28" y="${(H - 8) / 2 + 4.5}" font-size="13" font-weight="600" fill="#e4e4e7">${label}</text>` +
    `</g>`;
  return { svg, w };
}

function track(labels) {
  let x = 0;
  let out = "";
  for (const l of labels) {
    const p = pill(l, x);
    out += p.svg;
    x += p.w + GAP;
  }
  return { out, width: x };
}

function build(labels, reverse) {
  const t = track(labels);
  const reps = Math.ceil((VIEW_W * 2) / t.width) + 1;
  let body = "";
  for (let i = 0; i < reps; i++) {
    body += `<g transform="translate(${i * t.width},0)">${t.out}</g>`;
  }
  const dur = Math.round(t.width / 40);
  const from = reverse ? -t.width : 0;
  const to = reverse ? 0 : -t.width;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW_W}" height="${H}" viewBox="0 0 ${VIEW_W} ${H}" fill="none">` +
    `<defs><linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.08" stop-color="#fff"/>` +
    `<stop offset="0.92" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="m"><rect width="${VIEW_W}" height="${H}" fill="url(#fade)"/></mask></defs>` +
    `<style>text{font-family:'Plus Jakarta Sans','Segoe UI',system-ui,sans-serif}` +
    `.t{animation:slide ${dur}s linear infinite}` +
    `@keyframes slide{from{transform:translateX(${from}px)}to{transform:translateX(${to}px)}}</style>` +
    `<g mask="url(#m)"><g class="t">${body}</g></g></svg>`
  );
}

const outDir = path.join(__dirname, "..", "assets");
fs.writeFileSync(path.join(outDir, "marquee-1.svg"), build(rows[0], false));
fs.writeFileSync(path.join(outDir, "marquee-2.svg"), build(rows[1], true));
console.log("marquee-1.svg & marquee-2.svg generated");
