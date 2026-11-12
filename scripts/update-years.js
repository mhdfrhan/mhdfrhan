// Keeps "years of experience" current. Start year is fixed; the number is rewritten
// between <!--years-->...<!--/years--> markers. Run: node scripts/update-years.js
const fs = require("fs");
const path = require("path");

const START_YEAR = 2022;
const years = new Date().getFullYear() - START_YEAR;
const root = path.join(__dirname, "..");

for (const file of ["README.md", "assets/hero.svg"]) {
  const p = path.join(root, file);
  const src = fs.readFileSync(p, "utf8");
  const out = src.replace(/<!--years-->\d+<!--\/years-->/g, `<!--years-->${years}<!--/years-->`);
  if (out !== src) fs.writeFileSync(p, out);
}
console.log(`years of experience: ${years}`);
