const HEX = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;

export type BannerDirection = "left" | "right";

export type BannerParams = {
  text: string;
  color: string;
  background: string;
  speedSec: number;
  direction: BannerDirection;
  fontSize: string;
};

function normalizeHex(input: string | null, fallback: string): string {
  if (!input || !input.trim()) return fallback;
  const t = input.trim();
  if (HEX.test(t)) {
    const h = t.startsWith("#") ? t : `#${t}`;
    return h.length === 4
      ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
      : h;
  }
  return fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function parseBannerParams(
  searchParams: URLSearchParams,
): BannerParams {
  const rawText =
    searchParams.get("text") ?? searchParams.get("msg") ?? "LED BANNER";
  let text = rawText;
  try {
    text = decodeURIComponent(rawText.replace(/\+/g, " "));
  } catch {
    text = rawText;
  }

  const color = normalizeHex(searchParams.get("color"), "#00ff88");
  const background = normalizeHex(searchParams.get("bg"), "#0a0a0f");

  const speedRaw = searchParams.get("speed");
  let speedSec = 18;
  if (speedRaw !== null) {
    const p = parseFloat(speedRaw.replace(",", "."));
    if (!Number.isNaN(p)) speedSec = clamp(p, 2, 120);
  }

  const dirRaw = (searchParams.get("direction") ?? "left").toLowerCase();
  const direction: BannerDirection = dirRaw === "right" ? "right" : "left";

  const sizeRaw = searchParams.get("size");
  let fontSize = "clamp(1.75rem, 11vw, 4.5rem)";
  if (sizeRaw !== null) {
    const s = parseFloat(sizeRaw.replace(",", "."));
    if (!Number.isNaN(s) && s > 0) {
      fontSize = `clamp(${Math.max(0.8, s * 0.35)}rem, ${clamp(s, 4, 28)}vw, ${clamp(s * 1.2, 2, 8)}rem)`;
    }
  }

  return {
    text: text.trim() || "…",
    color,
    background,
    speedSec,
    direction,
    fontSize,
  };
}

export function paramsToQueryString(p: BannerParams): string {
  const q = new URLSearchParams();
  q.set("text", p.text);
  q.set("color", p.color.replace(/^#/, ""));
  q.set("bg", p.background.replace(/^#/, ""));
  q.set("speed", String(p.speedSec));
  q.set("direction", p.direction);
  const sizeMatch = p.fontSize.match(/(\d+(?:\.\d+)?)vw/);
  if (sizeMatch) q.set("size", sizeMatch[1]);
  return q.toString();
}
