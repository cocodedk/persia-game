// HUD building blocks shared by hud.js: panels, text, and the small icons (ships for lives, bombs).
import { INK, roundRect } from './sprites.js';
import { TAU } from '../core/math.js';
import { PACK } from '../data/pack.js';

// The pack's digits face first (word-moment.js loads it): it sets the Persian digits of a wave count
// or a score and nothing else, so every other character comes from the system face.
export const FONT = `"${PACK.font.digits}", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;

export function panel(ctx, x, y, w, h, border = 'rgba(255,255,255,0.16)', r = 16) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = 'rgba(8,10,18,0.64)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = border;
  ctx.stroke();
}

export function text(ctx, s, x, y, size, color, align = 'left', weight = 800) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

// A small spaced-out caption.
export function label(ctx, s, x, y, align = 'left', color = 'rgba(255,255,255,0.62)') {
  ctx.letterSpacing = '3px';
  text(ctx, s, x, y, 15, color, align, 800);
  ctx.letterSpacing = '0px';
}

// The fighter in miniature (a life), filled or as an empty outline.
export function shipIcon(ctx, x, y, color, full) {
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.lineTo(x + 4, y - 4);
  ctx.lineTo(x + 14, y + 8);
  ctx.lineTo(x + 4, y + 7);
  ctx.lineTo(x, y + 12);
  ctx.lineTo(x - 4, y + 7);
  ctx.lineTo(x - 14, y + 8);
  ctx.lineTo(x - 4, y - 4);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  if (full) {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = INK;
  } else ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();
}

export function bombIcon(ctx, x, y, color, full) {
  ctx.beginPath();
  ctx.arc(x - 2, y + 2, 10, 0, TAU);
  ctx.lineWidth = 2.5;
  if (full) {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#fff6c8';
    ctx.fillRect(x + 7, y - 13, 5, 5);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 6);
    ctx.quadraticCurveTo(x + 6, y - 11, x + 9, y - 10);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.stroke();
  }
}
