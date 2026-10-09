// Confirms the painter background actually loads on login and sign up (desktop) and is not rendered on phones.
import { APP, launch } from "./lib.mjs";
const browser = await launch();
let bad = 0;
for (const [name, vp] of [["desktop", { width: 1448, height: 1086 }], ["phone", { width: 390, height: 844 }]]) {
  const page = await (await browser.newContext({ viewport: vp })).newPage();
  for (const path of ["/login", "/register"]) {
    await page.goto(APP + path, { waitUntil: "networkidle" });
    const r = await page.evaluate(async () => {
      const el = document.querySelector(".auth-visual-img");
      const url = getComputedStyle(el).backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];
      const res = await fetch(url);
      const bmp = await createImageBitmap(await res.blob());
      return { url, status: res.status, type: res.headers.get("content-type"), w: bmp.width, h: bmp.height, size: getComputedStyle(el).backgroundSize, shown: el.offsetParent !== null };
    });
    const ok = r.status === 200 && r.w === 1448 && r.h === 1086 && r.size === "cover" && r.shown === (name === "desktop");
    if (!ok) bad++;
    console.log(ok ? "ok  " : "FAIL", name, path, JSON.stringify(r));
  }
}
await browser.close();
process.exit(bad ? 1 : 0);
