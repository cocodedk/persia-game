// The number format shared by the screens and the HUD (DOM-free).
//   fmt(n)      12,345 (rounded)
export const fmt = (n) => Math.round(n).toLocaleString('en-US');
