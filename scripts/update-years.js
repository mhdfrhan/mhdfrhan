// Keeps "years of experience" current across README.md and hero SVGs.
// Run: node scripts/update-years.js
const fs = require("fs");
const path = require("path");

const START_YEAR = 2022;
const years = new Date().getFullYear() - START_YEAR;
const root = path.join(__dirname, "..");

for (const file of ["README.md", "assets/hero-dark.svg", "assets/hero-light.svg"]) {
  const p = path.join(root, file);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, "utf8");
  const out = src.replace(/<!--years-->\d+<!--\/years-->/g, `<!--years-->${years}<!--/years-->`);
  if (out !== src) fs.writeFileSync(p, out);
}
console.log(`years of experience: ${years}`);
