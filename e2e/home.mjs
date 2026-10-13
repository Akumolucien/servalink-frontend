// Home page E2E against the LOCAL harness (fake data only).
// Prerequisites: `python -m local_dev.server --seed minimal` and `npm run dev:local -- --port 5273`.
import path from "node:path";
import { API, APP, PASSWORD, SHOTS, context, launch, login, resetBackend } from "./lib.mjs";

let failed = false;
async function step(name, fn) {
  try { await fn(); console.log(`  PASS  ${name}`); }
  catch (error) { failed = true; console.log(`  FAIL  ${name}\n        ${String(error.message).split("\n").slice(0, 4).join("\n        ")}`); }
}
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const post = async (url, body) => { const r = await fetch(API + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); return r.json().catch(() => ({})); };
const call = async (token, method, url, body) => {
  const r = await fetch(API + url, { method, headers: { "Content-Type": "application/json", Authorization: token }, body: body ? JSON.stringify(body) : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${url} -> ${r.status}`);
  return data;
};
async function provider(admin, email, name, title) {
  await post("/__dev/auth/signup", { email, password: PASSWORD }); await post("/__dev/auth/confirm", { email, code: "123456" });
  const user = await post("/__dev/auth/signin", { email, password: PASSWORD });
  await call(user.idToken, "PUT", "/profile", { full_name: name, city: "Buea" });
  await call(user.idToken, "POST", "/provider", { service_category: "Plumbing", service_title: title, description: "Pipes and fittings" });
  await call(admin.idToken, "PUT", `/admin/providers/${user.sub}/status`, { status: "APPROVED", reason: "ok" });
  return user;
}
const hideBanner = (page) => page.addStyleTag({ content: ".local-banner { display: none !important; }" });

await resetBackend("minimal");
const admin = await post("/__dev/auth/signin", { email: "admin@servalink.test", password: PASSWORD });
const categories = (await (await fetch(`${API}/service-categories`)).json()).categories;

const browser = await launch();
const ctx = await context(browser); const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error" && !/404 \(Not Found\)|status of 500|ERR_INSUFFICIENT_RESOURCES/.test(m.text())) errors.push(m.text()); });

// Known harness flake, diagnosed: the Vite DEV server serves ~100 unbundled modules per page load and Chrome
// occasionally refuses some with net::ERR_INSUFFICIENT_RESOURCES on a low-memory machine, leaving a blank page.
// Production serves one bundle, so this cannot happen there. Retry such a load once, and say so in the output.
let starved = false, starvedRetries = 0;
page.on("requestfailed", (r) => { if (/ERR_INSUFFICIENT_RESOURCES/.test(r.failure()?.errorText ?? "")) starved = true; });
const rawGoto = page.goto.bind(page);
page.goto = async (url, options) => {
  for (let attempt = 0; ; attempt++) {
    starved = false;
    const response = await rawGoto(url, options);
    const rendered = await page.waitForFunction(() => document.getElementById("root")?.childElementCount > 0, null, { timeout: 8000 }).then(() => true, () => false);
    if (rendered || !starved || attempt >= 2) return response;
    starvedRetries++;
  }
};

await step("empty state: no approved providers yet -> clear message and a Become a Provider link", async () => {
  await page.goto(APP);
  await page.getByRole("heading", { name: "Meet Local Professionals" }).waitFor();
  await page.getByText("No providers are listed yet").waitFor();
  await page.locator(".state").getByRole("link", { name: "Become a Provider" }).waitFor();
});

await step("error state: API failures show a retry message instead of a blank section", async () => {
  const p = await (await context(browser)).newPage();
  await p.route("**/service-categories", (route) => route.fulfill({ status: 500, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: "{}" }));
  await p.route("**/providers?*", (route) => route.fulfill({ status: 500, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: "{}" }));
  await p.goto(APP);
  await p.getByText("We couldn't load service categories").waitFor();
  await p.getByText("We couldn't load providers").waitFor();
  await p.close();
});

// ---- scene: two approved providers, one with a gallery photo ----
const lucien = await provider(admin, "lucien@home.test", "Lucien Fon", "Fon Plumbing");
const ada = await provider(admin, "ada@home.test", "Ada Njoh", "Njoh Pipe Works");
{
  const p = await (await context(browser)).newPage();
  await login(p, "lucien@home.test");
  await p.goto(`${APP}/app/provider/gallery`);
  await p.getByRole("button", { name: "Add photo" }).first().click();
  const d = p.getByRole("dialog");
  await d.locator('input[type="file"]').setInputFiles(path.resolve("e2e/fixtures/photo.png"));
  await d.getByLabel("Caption").fill("New kitchen sink fitting");
  await d.getByRole("button", { name: "Upload photo" }).click();
  await p.getByText("New kitchen sink fitting").waitFor();
  await p.close();
}

await step("hero: new headline, validated search by category and city, Find Providers goes to results", async () => {
  await page.goto(APP);
  await page.getByRole("heading", { level: 1, name: "Find the Right Professional for Every Job." }).waitFor();
  await page.getByText("Discover skilled local service providers in your city, explore their work, and book services with confidence.").waitFor();
  await page.getByRole("button", { name: "Find Providers" }).click();
  await page.getByText("Choose a category").last().waitFor();
  await page.getByText("Enter your town or city").waitFor();
  await page.getByLabel("Service category").selectOption("Plumbing");
  await page.getByLabel("Town or city").fill("Buea");
  await page.getByRole("button", { name: "Find Providers" }).click();
  await page.waitForURL(`${APP}/search?category=Plumbing&city=Buea`);
  await page.getByRole("heading", { name: "Plumbing services in Buea" }).waitFor();
});

await step("popular services: one tile per API category (no invented ones); click keeps the category", async () => {
  await page.goto(APP);
  const tiles = page.locator(".home-cat");
  await tiles.first().waitFor();
  assert((await tiles.count()) === categories.length, `expected ${categories.length} tiles, got ${await tiles.count()}`);
  const names = (await page.locator(".home-cat .name").allInnerTexts()).sort();
  assert(JSON.stringify(names) === JSON.stringify(categories.map((c) => c.category_name).sort()), "tile names differ from the API categories");
  await page.locator(".home-cat", { hasText: "Plumbing" }).click();
  await page.waitForURL(`${APP}/search?category=Plumbing`);
});

await step("featured providers: real approved providers, gallery photo when there is one, avatar when not, View Profile works", async () => {
  await page.goto(APP);
  await page.getByRole("heading", { name: "Meet Local Professionals" }).waitFor();
  const cards = page.locator(".home-provider");
  await cards.first().waitFor();
  assert((await cards.count()) === 2, `expected 2 provider cards, got ${await cards.count()}`);
  const withPhoto = page.locator(".home-provider", { hasText: "Fon Plumbing" });
  await withPhoto.locator("img").waitFor();
  const info = await withPhoto.locator("img").evaluate((img) => ({ loaded: img.complete && img.naturalWidth > 0, lazy: img.loading, alt: img.alt }));
  assert(info.loaded && info.lazy === "lazy" && info.alt === "Example of work by Lucien Fon", "gallery image not loaded lazily with alt text: " + JSON.stringify(info));
  assert((await page.locator(".home-provider", { hasText: "Njoh Pipe Works" }).locator("img").count()) === 0, "provider without gallery should show the avatar block");
  await withPhoto.getByText("Plumbing").first().waitFor(); await withPhoto.getByText("Buea").waitFor();
  assert((await withPhoto.locator(".rating").count()) === 0, "a rating is shown without reviews");
  await page.getByRole("link", { name: "View Profile of Lucien Fon" }).click();
  await page.waitForURL(`${APP}/providers/${lucien.sub}`);
  await page.getByText("Fon Plumbing").first().waitFor();
});

await step("how it works (4 steps), why choose (5 benefits), FAQ (5 questions, keyboard operable)", async () => {
  await page.goto(APP);
  await page.locator(".home-step").first().waitFor();
  assert((await page.locator(".home-step").count()) === 4, "expected 4 steps");
  for (const t of ["Search for a Service", "Explore Providers", "Request a Booking", "Confirm Completion"]) await page.getByRole("heading", { name: t }).waitFor();
  assert((await page.locator(".home-benefit").count()) === 5, "expected 5 benefits");
  const text = (await page.locator("#about").innerText()).toLowerCase();
  assert(!/background check|guarantee|qualification|certified/.test(text), "unsupported claim on the page");
  assert((await page.locator(".home-faq details").count()) === 5, "expected 5 FAQ items");
  const first = page.locator(".home-faq summary").first();
  await first.focus(); await page.keyboard.press("Enter");
  assert(await page.locator(".home-faq details").first().evaluate((d) => d.open), "Enter did not open the answer");
  await page.keyboard.press("Space");
  assert(!(await page.locator(".home-faq details").first().evaluate((d) => d.open)), "Space did not close the answer");
});

await step("Become a Provider call to action mentions admin approval and opens the existing flow", async () => {
  await page.goto(APP);
  await page.getByRole("heading", { name: "Your Skills Deserve to Be Discovered." }).waitFor();
  await page.getByText("Provider applications are reviewed and approved by an administrator.").waitFor();
  await page.locator(".home-cta").getByRole("link", { name: "Become a Provider" }).click();
  await page.waitForURL(`${APP}/become-provider`);
});

await step("footer: every link leads somewhere that exists", async () => {
  await page.goto(APP);
  await page.locator("footer a").first().waitFor();
  const hrefs = await page.locator("footer a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  assert(hrefs.length >= 7, "footer links missing: " + hrefs.join(","));
  for (const href of hrefs) {
    const [route, hash] = href.split("#");
    await page.goto(APP + (route || "/") + (hash ? "#" + hash : ""));
    await page.locator("main").waitFor().catch(() => { throw new Error(`${href}: the page did not render at ${page.url()}`); });
    assert((await page.getByText("We can't find that page").count()) === 0, `${href} leads to a missing page`);
    if (hash) assert((await page.locator("#" + hash).count()) === 1, `${href}: anchor #${hash} does not exist`);
  }
});

await step("reduced motion: card hover motion is switched off", async () => {
  const rm = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })).newPage();
  await rm.goto(APP);
  await rm.locator(".home-cat").first().waitFor();
  assert((await rm.locator(".home-cat").first().evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))) < 0.01, "transition still active");
  await rm.close();
});

for (const [tag, opts] of [["desktop", { viewport: { width: 1440, height: 900 } }], ["tablet", { viewport: { width: 820, height: 1100 } }],
  ["mobile", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }]]) {
  await step(`${tag}: no horizontal scroll, hero image visible, screenshot captured`, async () => {
    const p = await (await browser.newContext(opts)).newPage();
    await p.goto(APP, { waitUntil: "networkidle" });
    await p.locator(".home-provider img").waitFor();
    await hideBanner(p);
    const over = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(over <= 1, `horizontal overflow ${over}px`);
    assert(await p.locator(".home-hero-photo img").evaluate((i) => i.complete && i.naturalWidth > 0), "hero photo not loaded");
    await p.evaluate(() => document.querySelectorAll("img[loading=lazy]").forEach((i) => { i.loading = "eager"; }));
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(SHOTS, `home-${tag}.png`), fullPage: true });
    await p.close();
  });
}

if (starvedRetries) console.log(`NOTE: ${starvedRetries} page load(s) were retried after Chrome ran out of resources loading the Vite dev server (harness only; not an app error).`);
console.log(errors.length ? "Browser errors:\n  " + errors.join("\n  ") : "No unexpected browser errors");
await browser.close();
process.exit(failed || errors.length ? 1 : 0);
