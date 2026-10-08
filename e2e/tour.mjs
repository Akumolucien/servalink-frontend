// Visual tour: screenshots of the main screens with the demo seed (desktop + phone width).
import { APP, context, launch, login, resetBackend, shot } from "./lib.mjs";

await resetBackend("demo");
const browser = await launch();

for (const mobile of [false, true]) {
  const tag = mobile ? "m" : "d";
  const ctx = await context(browser, { mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  await page.goto(APP); await page.waitForSelector("h1"); await shot(page, `${tag}-01-home`);
  await page.goto(`${APP}/search?category=Plumbing&city=Buea`); await page.waitForSelector("article"); await shot(page, `${tag}-02-search`);
  await page.getByRole("link", { name: "View Profile" }).first().click(); await page.waitForSelector("text=Services"); await shot(page, `${tag}-03-provider-profile`);
  await page.goto(`${APP}/register`); await page.waitForSelector("h1"); await shot(page, `${tag}-04-register`);
  await page.goto(`${APP}/login`); await page.waitForSelector("h1"); await shot(page, `${tag}-05-login`);

  await login(page, "marie@servalink.test");
  await page.waitForSelector("text=Your activity"); await page.waitForLoadState("networkidle"); await shot(page, `${tag}-06-citizen-dashboard`);
  await page.goto(`${APP}/app/bookings`); await page.waitForSelector("article"); await shot(page, `${tag}-07-bookings`);
  await page.locator("article").first().getByRole("link", { name: "View details" }).click(); await page.waitForSelector("text=Progress"); await shot(page, `${tag}-08-booking-detail`);
  await page.goto(`${APP}/app/become-provider`); await page.waitForSelector("h1"); await shot(page, `${tag}-09-become-provider`);
  await page.goto(`${APP}/app/profile`); await page.waitForSelector("h1"); await shot(page, `${tag}-10-profile`);
  await ctx.close();

  const pctx = await context(browser, { mobile });
  const p = await pctx.newPage();
  p.on("pageerror", (e) => errors.push(String(e)));
  await login(p, "lucien@servalink.test");
  await p.goto(`${APP}/app/provider`); await p.waitForSelector("text=Recent booking requests"); await shot(p, `${tag}-11-provider-dashboard`);
  await p.goto(`${APP}/app/provider/bookings`); await p.waitForSelector("h1"); await p.waitForTimeout(500); await shot(p, `${tag}-12-provider-requests`);
  await p.goto(`${APP}/app/provider/services`); await p.waitForSelector("text=Leaking pipe repair"); await shot(p, `${tag}-13-provider-services`);
  await pctx.close();

  const actx = await context(browser, { mobile });
  const a = await actx.newPage();
  a.on("pageerror", (e) => errors.push(String(e)));
  await login(a, "admin@servalink.test");
  await a.waitForSelector("text=Admin dashboard"); await a.waitForTimeout(500); await shot(a, `${tag}-14-admin-dashboard`);
  await a.goto(`${APP}/admin/providers`); await a.waitForSelector("table"); await shot(a, `${tag}-15-admin-providers`);
  await actx.close();
  console.log(tag, "console/page errors:", errors.length ? errors : "none");
}
await browser.close();
