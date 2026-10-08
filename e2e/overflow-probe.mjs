// Dev helper: reports which elements make a page wider than the phone viewport.
import { APP, context, launch, login, resetBackend } from "./lib.mjs";

const [, , url = "/admin/providers", email = "admin@servalink.test"] = process.argv;
await resetBackend("demo");
const browser = await launch();
const page = await (process.env.PLAIN ? await browser.newContext({ viewport: { width: 390, height: 844 } }) : await context(browser, { mobile: true })).newPage();
await login(page, email);
await page.goto(APP + url);
await page.waitForLoadState("networkidle");
await page.waitForTimeout(800);
const chain = await page.evaluate(() => {
  const path = [];
  let node = document.body;
  while (node) {
    const next = [...node.children].find((c) => c.getBoundingClientRect().width > 391);
    if (!next) break;
    const cs = getComputedStyle(next);
    path.push(`${next.tagName.toLowerCase()}.${String(next.className).slice(0, 30)} w=${Math.round(next.getBoundingClientRect().width)} display=${cs.display} overflowX=${cs.overflowX} minW=${cs.minWidth}`);
    node = next;
  }
  return path;
});
console.log("first-too-wide chain:\n  " + chain.join("\n  "));
const report = await page.evaluate(() => {
  const width = window.innerWidth;
  const offenders = [...document.querySelectorAll("body *")]
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.right > width + 1 && r.width > 0)
    .slice(0, 12)
    .map(({ el, r }) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
  return { innerWidth: width, scrollWidth: document.documentElement.scrollWidth, offenders };
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
