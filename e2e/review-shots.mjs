// Design-review screenshots of login and sign up (full page) at the reference's proportions and at phone width.
// The local-integration banner is hidden so the design can be compared cleanly (it never shows in production).
import { APP, launch, SHOTS } from "./lib.mjs";
import path from "node:path";

const browser = await launch();
const targets = [
  ["desktop", { viewport: { width: 1448, height: 1086 }, deviceScaleFactor: 1 }],
  ["mobile", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
];
for (const [name, options] of targets) {
  const ctx = await browser.newContext(options);
  const page = await ctx.newPage();
  for (const [label, url] of [["login", "/login"], ["signup", "/register"]]) {
    await page.goto(APP + url, { waitUntil: "networkidle" });
    await page.locator("h1").first().waitFor();
    await page.addStyleTag({ content: ".local-banner { display: none !important; }" });
    await page.waitForTimeout(400);
    const file = path.join(SHOTS, `review-${label}-${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const m = await page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)]; };
      const cs = (s, p) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[p] : null; };
      return { card: r(".auth-card"), visual: r(".auth-visual"), form: r(".auth-form-wrap"), h1: r("h1"), button: r(".auth-submit"),
        h1Size: cs("h1", "fontSize"), h1Weight: cs("h1", "fontWeight"), fontFamily: cs("body", "fontFamily").split(",")[0],
        btnColor: cs(".auth-submit", "backgroundColor"), pageBg: cs(".auth-page", "backgroundColor"), scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth };
    });
    console.log(`${name} ${label}:`, JSON.stringify(m));
  }
  await ctx.close();
}
await browser.close();
