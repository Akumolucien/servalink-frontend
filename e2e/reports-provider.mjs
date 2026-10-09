// Admin Reports -> provider actions (View provider / Suspend provider), against the LOCAL harness only (fake data).
// Prerequisites: `python -m local_dev.server --seed minimal` and `npm run dev:local -- --port 5273`.
import { API, APP, PASSWORD, context, launch, login, resetBackend, shot } from "./lib.mjs";

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
async function asUser(email) {
  await post("/__dev/auth/signup", { email, password: PASSWORD }); await post("/__dev/auth/confirm", { email, code: "123456" });
  return post("/__dev/auth/signin", { email, password: PASSWORD });
}

// ---- scene: one approved provider with a booking that a citizen reported ----
await resetBackend("minimal");
const admin = await post("/__dev/auth/signin", { email: "admin@servalink.test", password: PASSWORD });
const plumbing = (await (await fetch(`${API}/service-categories`)).json()).categories.find((c) => c.category_name === "Plumbing");
const lucien = await asUser("lucien@rp.test");
await call(lucien.idToken, "PUT", "/profile", { full_name: "Lucien Fon", city: "Buea" });
await call(lucien.idToken, "POST", "/provider", { service_category: "Plumbing", service_title: "Fon Plumbing", description: "Pipes" });
await call(admin.idToken, "PUT", `/admin/providers/${lucien.sub}/status`, { status: "APPROVED", reason: "ok" });
const lucienTok = (await post("/__dev/auth/signin", { email: "lucien@rp.test", password: PASSWORD })).idToken;
const service = (await call(lucienTok, "POST", "/services", { category_id: plumbing.category_id, city: "Buea", name: "Leaking pipe repair" })).service;
const marie = await asUser("marie@rp.test");
await call(marie.idToken, "PUT", "/profile", { full_name: "Marie Kamga", city: "Buea" });
const booking = (await call(marie.idToken, "POST", "/bookings", { service_id: service.service_id, booking_date: "2030-10-20T10:00", message: "Pipe leaks" })).booking;
await call(lucienTok, "PUT", `/bookings/${booking.booking_id}`, { action: "ACCEPT" });
await call(marie.idToken, "POST", "/reports", { booking_id: booking.booking_id, reason: "Grout left uneven", description: "Near the sink" });
const bookingStatus = async () => (await call(marie.idToken, "GET", `/bookings/${booking.booking_id}`)).booking.status;
assert((await bookingStatus()) === "ACCEPTED", "scene: booking should be ACCEPTED");

const browser = await launch();
const desk = await context(browser); const page = await desk.newPage();
await login(page, "admin@servalink.test");
const card = page.locator("article", { hasText: "Grout left uneven" });
const dialog = page.getByRole("dialog");

await step("report shows the provider's current status, View provider and Suspend provider", async () => {
  await page.goto(`${APP}/admin/reports`);
  await card.waitFor();
  await card.getByText("Provider status").waitFor();
  await card.locator(".badge", { hasText: "Active" }).waitFor();
  await card.getByRole("button", { name: "Suspend provider" }).waitFor();
  assert((await card.getByRole("link", { name: "View provider" }).getAttribute("href")) === `/admin/providers/${lucien.sub}`, "wrong View provider link");
  await shot(page, "rp-1-desktop-report-active");
});

await step("View provider opens the existing provider details dialog", async () => {
  await card.getByRole("link", { name: "View provider" }).click();
  await page.waitForURL(`${APP}/admin/providers/${lucien.sub}`);
  await dialog.getByText("Lucien Fon's application").waitFor();
  await dialog.getByRole("button", { name: "Suspend" }).waitFor();   // the Providers page still offers it too
  await page.goto(`${APP}/admin/reports`);
  await card.waitFor();
});

await step("phone width: provider and report actions are all visible with no horizontal scroll", async () => {
  const mctx = await context(browser, { mobile: true }); const m = await mctx.newPage();
  await login(m, "admin@servalink.test");
  await m.goto(`${APP}/admin/reports`);
  const mc = m.locator("article", { hasText: "Grout left uneven" });
  await mc.waitFor();
  await mc.getByRole("link", { name: "View provider" }).waitFor();
  for (const name of ["Suspend provider", "Resolve", "Dismiss"]) await mc.getByRole("button", { name }).waitFor();
  const over = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(over <= 1, `horizontal overflow ${over}px`);
  await shot(m, "rp-2-phone-report-active");
  await mctx.close();
});

await step("a failed or unauthorized suspension shows a clear message and changes nothing", async () => {
  await page.route("**/admin/providers/*/status", (route) => route.fulfill({ status: 403, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Admin access required" }) }));
  await card.getByRole("button", { name: "Suspend provider" }).click();
  await dialog.getByRole("button", { name: "Suspend" }).click();                       // no reason yet
  await dialog.getByText("Add a note before continuing").waitFor();
  await dialog.getByLabel("Reason for suspending").fill("Repeated customer complaints.");
  await dialog.getByRole("button", { name: "Suspend" }).click();
  await dialog.locator(".banner.danger").waitFor();
  console.log("        message shown:", JSON.stringify(await dialog.locator(".banner.danger").innerText()));
  await page.unroute("**/admin/providers/*/status");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await card.locator(".badge", { hasText: "Active" }).waitFor();
});

await step("suspending: status updates on the report, the report and bookings stay untouched, provider is hidden", async () => {
  await card.getByRole("button", { name: "Suspend provider" }).click();
  await dialog.getByLabel("Reason for suspending").fill("Repeated customer complaints.");
  await dialog.getByRole("button", { name: "Suspend" }).click();
  await page.locator(".toast", { hasText: "Provider suspended" }).waitFor();
  await card.locator(".badge", { hasText: "Suspended" }).waitFor();
  assert((await card.getByRole("button", { name: "Suspend provider" }).count()) === 0, "Suspend provider still offered");
  for (const name of ["Start review", "Resolve", "Dismiss"]) await card.getByRole("button", { name }).waitFor();
  await card.locator(".badge", { hasText: "Open" }).waitFor();                         // report status unchanged
  assert((await bookingStatus()) === "ACCEPTED", "booking status changed");
  const found = (await (await fetch(`${API}/providers?category=Plumbing&city=Buea`)).json()).providers;
  assert(found.length === 0, "suspended provider still in search");
  await shot(page, "rp-3-desktop-report-suspended");
});

await step("report actions still work independently after the suspension", async () => {
  await card.getByRole("button", { name: "Resolve" }).click();
  await dialog.getByLabel(/Resolution note/).fill("Provider suspended after review.");
  await dialog.getByRole("button", { name: "Resolve" }).click();
  await page.locator(".toast", { hasText: "Report resolved" }).waitFor();
  assert((await bookingStatus()) === "ACCEPTED", "booking status changed");
});

await browser.close();
process.exit(failed ? 1 : 0);
