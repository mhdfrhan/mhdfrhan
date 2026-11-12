// Shared design tokens matching hannn.my.id (Minimalist Editorial) for Dark & Light SVGs.
const FONT = "font-family:'Plus Jakarta Sans','Segoe UI',system-ui,-apple-system,sans-serif";

const THEMES = {
  dark: {
    bg: "#09090b",
    bgCard: "#111114",
    bgSurface: "#18181b",
    bgMuted: "#27272a",
    border: "#3f3f46",
    borderSoft: "#27272a",
    text: "#fafafa",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    accent: "#ed5d31",
    accentSoft: "#fb923c",
    green: "#10B981",
    gridLine: "rgba(255,255,255,0.045)",
    heatColors: ["#27272a", "#7c2d12", "#c2410c", "#ed5d31", "#fb923c"],
    langShades: ["#ed5d31", "#fb923c", "#c2410c", "#fdba74", "#9a3412", "#71717a"],
  },
  light: {
    bg: "#F8FAFC",
    bgCard: "#FFFFFF",
    bgSurface: "#FFFFFF",
    bgMuted: "#F1F5F9",
    border: "#CBD5E1",
    borderSoft: "#E2E8F0",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",
    accent: "#ed5d31",
    accentSoft: "#ea580c",
    green: "#059669",
    gridLine: "rgba(15,23,42,0.055)",
    heatColors: ["#E2E8F0", "#FED7AA", "#FDBA74", "#FB923C", "#EA580C"],
    langShades: ["#ed5d31", "#f97316", "#c2410c", "#fb923c", "#9a3412", "#94a3b8"],
  },
};

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = { FONT, THEMES, esc };
