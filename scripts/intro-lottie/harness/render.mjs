// Render every frame of a Lottie JSON with lottie-web (svg renderer) in headless Chromium.
// usage: node render.mjs <lottie.json> <outdir> [scale]
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
const [,, jsonPath, outDir, scaleArg] = process.argv;
const scale = Number(scaleArg || 0.5);
fs.mkdirSync(outDir, { recursive: true });
const lottieSrc = fs.readFileSync(new URL("../../../node_modules/lottie-web/build/player/lottie_svg.min.js", import.meta.url).pathname, "utf8");
const data = fs.readFileSync(jsonPath, "utf8");
const W = 1920 * scale, H = 1080 * scale;
const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}#c{width:${W}px;height:${H}px}</style></head>
<body><div id="c"></div><script>${lottieSrc}</script><script>
window.__data=${data};
window.__anim=lottie.loadAnimation({container:document.getElementById('c'),renderer:'svg',loop:false,autoplay:false,animationData:window.__data,rendererSettings:{preserveAspectRatio:'xMidYMid meet',progressiveLoad:false}});
window.__ready=false; window.__anim.addEventListener('DOMLoaded',()=>{window.__ready=true});
</script></body></html>`;
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: Math.round(W), height: Math.round(H) }, deviceScaleFactor: 1 });
page.on("pageerror", e => console.error("PAGEERROR", e.message));
page.on("console", m => { if (m.type()==="error") console.error("CONSOLE", m.text()); });
await page.setContent(html);
await page.waitForFunction(() => window.__ready, null, { timeout: 20000 });
const total = await page.evaluate(() => window.__anim.totalFrames);
console.log("totalFrames", total);
const frames = process.env.FRAMES ? process.env.FRAMES.split(",").map(Number) : [...Array(Math.round(total)).keys()];
for (const f of frames) {
  await page.evaluate(f => window.__anim.goToAndStop(f, true), f);
  await page.waitForTimeout(15);
  await page.screenshot({ path: path.join(outDir, `f${String(f).padStart(3, "0")}.png`), omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
}
await browser.close();
console.log("done", frames.length);
