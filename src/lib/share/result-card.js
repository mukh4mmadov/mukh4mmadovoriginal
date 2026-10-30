// Draws a story-sized (1080×1920) result card that learners can post on
// Instagram or Telegram. Everything is drawn on a canvas in the browser.
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1920;
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function fitText(ctx, text, maxWidth, size, weight) {
  let current = size;
  ctx.font = `${weight} ${current}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && current > 24) {
    current -= 4;
    ctx.font = `${weight} ${current}px ${FONT}`;
  }
  return current;
}

/**
 * card: { kind: "Full IELTS mock", band: 7, bandLabel: "Overall band",
 *         parts: [{ label, value }], detail: "33/40 correct", name, date, site }
 * A card without a band can show its own headline (e.g. "11/13") and
 * progress (0–1) for the ring.
 */
export async function drawResultCard(canvas, card) {
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  const W = CARD_WIDTH;

  // Background: deep blue gradient with soft glows.
  const background = ctx.createLinearGradient(0, 0, W, CARD_HEIGHT);
  background.addColorStop(0, "#082f49");
  background.addColorStop(0.55, "#0c1530");
  background.addColorStop(1, "#1e1238");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, W, CARD_HEIGHT);
  for (const [x, y, r, color] of [[880, 260, 420, "rgba(56,189,248,0.22)"], [160, 1500, 480, "rgba(168,85,247,0.18)"]]) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, CARD_HEIGHT);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Header: logo and site name.
  const logo = await loadImage("/mukh4mmadov-ielts-logo.png");
  if (logo) ctx.drawImage(logo, W / 2 - 60, 150, 120, 120);
  ctx.fillStyle = "#e0f2fe";
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText("Mukh4mmadov IELTS", W / 2, 320);

  // Test name.
  ctx.fillStyle = "#7dd3fc";
  const kindSize = fitText(ctx, card.kind.toUpperCase(), 900, 46, 800);
  ctx.font = `800 ${kindSize}px ${FONT}`;
  ctx.fillText(card.kind.toUpperCase(), W / 2, 470);

  // Band ring.
  const cx = W / 2, cy = 820, radius = 270;
  ctx.lineWidth = 34;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  const share = Math.max(0, Math.min(1, card.progress ?? (card.band == null ? 0 : Number(card.band) / 9)));
  const ring = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  ring.addColorStop(0, "#38bdf8");
  ring.addColorStop(1, "#a855f7");
  ctx.strokeStyle = ring;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share); ctx.stroke();
  ctx.fillStyle = "#ffffff";
  const headline = card.headline ?? (card.band == null ? "—" : Number(card.band).toFixed(1));
  fitText(ctx, headline, radius * 1.6, 230, 900);
  ctx.fillText(headline, cx, cy + 6);
  ctx.fillStyle = "#bae6fd";
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText(card.bandLabel || "Band", cx, cy + 150);

  // Detail line, e.g. "33/40 correct".
  let y = 1180;
  if (card.detail) {
    ctx.fillStyle = "#e2e8f0";
    const detailSize = fitText(ctx, card.detail, 900, 48, 700);
    ctx.font = `700 ${detailSize}px ${FONT}`;
    ctx.fillText(card.detail, W / 2, y);
    y += 100;
  }

  // Part bands as tiles (full mock: Listening / Reading / Writing).
  const parts = (card.parts || []).slice(0, 4);
  if (parts.length) {
    const gap = 30;
    const tileW = (900 - gap * (parts.length - 1)) / parts.length;
    parts.forEach((part, index) => {
      const x = 90 + index * (tileW + gap);
      roundRect(ctx, x, y, tileW, 200, 36);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(125,211,252,0.35)";
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.font = `700 34px ${FONT}`;
      ctx.fillText(part.label, x + tileW / 2, y + 62);
      ctx.fillStyle = "#ffffff";
      ctx.font = `900 72px ${FONT}`;
      ctx.fillText(part.value, x + tileW / 2, y + 135);
    });
    y += 260;
  }

  // Name and date.
  ctx.fillStyle = "#ffffff";
  if (card.name) {
    const nameSize = fitText(ctx, card.name, 900, 52, 800);
    ctx.font = `800 ${nameSize}px ${FONT}`;
    ctx.fillText(card.name, W / 2, Math.max(y + 40, 1560));
  }
  ctx.fillStyle = "#94a3b8";
  ctx.font = `600 36px ${FONT}`;
  ctx.fillText(card.date || new Date().toLocaleDateString(), W / 2, Math.max(y + 110, 1630));

  // Footer call to action.
  roundRect(ctx, 140, 1710, 800, 110, 55);
  ctx.fillStyle = "#0ea5e9";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  const siteSize = fitText(ctx, card.site, 720, 40, 800);
  ctx.font = `800 ${siteSize}px ${FONT}`;
  ctx.fillText(card.site, W / 2, 1766);
  ctx.fillStyle = "#64748b";
  ctx.font = `500 26px ${FONT}`;
  ctx.fillText("Practice estimate · not an official IELTS score", W / 2, 1870);
  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}
