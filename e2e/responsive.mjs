// Responsive sweep: every main screen, for every role, must fit the viewport (no horizontal page scroll).
// Uses a plain narrow viewport (not mobile emulation, which silently zooms out and hides overflow). Demo seed.
import { APP, launch, login, resetBackend } from "./lib.mjs";

await resetBackend("demo");
const browser = await launch();
const widths = [360, 390, 820, 1024];
const problems = [];
let checked = 0;

const ROLES = [
  { email: null, pages: ["/", "/search?category=Plumbing&city=Buea", "/login", "/register", "/forgot-password", "/become-provider"] },
  { email: "marie@servalink.test", pages: ["/app", "/app/bookings", "/app/reviews", "/app/reports", "/app/profile", "/app/become-provider"], withBooking: true },
  { email: "lucien@servalink.test", pages: ["/app/provider", "/app/provider/bookings", "/app/provider/services", "/app/provider/gallery", "/app/provider/profile"] },
  { email: "admin@servalink.test", pages: ["/admin", "/admin/providers", "/admin/reports", "/admin/categories"] },
];

for (const width of widths) {
  for (const role of ROLES) {
    const ctx = await browser.newContext({ viewport: { width, height: 800 } });
    ctx.setDefaultTimeout(20000);
    const page = await ctx.newPage();
    if (role.email) await login(page, role.email);
    const pages = [...role.pages];
    if (role.withBooking) {
      await page.goto(APP + "/app/bookings"); await page.locator("article").first().waitFor();
      const href = await page.locator("article a[href^='/app/bookings/']").first().getAttribute("href");
      pages.push(href, href + "/report");
    }
    for (const path of pages) {
      await page.goto(APP + path);
      await page.waitForLoadState("networkidle");
      await page.waitForFunction(() => !document.querySelector(".skeleton"), null, { timeout: 15000 }).catch(() => {});
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      checked++;
      if (overflow > 1) problems.push(`${width}px ${role.email ?? "anonymous"} ${path}: +${overflow}px`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`${checked} page/width combinations checked`);
if (problems.length) { console.log("OVERFLOW:\n  " + problems.join("\n  ")); process.exit(1); }
console.log("No horizontal overflow anywhere.");
