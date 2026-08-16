import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const outputRoot = new URL("../out/", import.meta.url);

test("builds a deployable Raster Tide Pages artifact", async () => {
  const html = await readFile(new URL("index.html", outputRoot), "utf8");

  assert.match(html, /<title>Raster Tide — Animated ASCII Generator<\/title>/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /rastertide\.com\/og\.png/i);

  const scriptSource = html.match(/src="(\/assets\/[^"]+\.js)"/i)?.[1];
  const stylesheet = html.match(/href="(\/assets\/[^"]+\.css)"/i)?.[1];
  assert.ok(scriptSource, "the static page should load its JavaScript bundle");
  assert.ok(stylesheet, "the static page should load its stylesheet");

  await access(new URL(scriptSource.slice(1), outputRoot));
  await access(new URL(stylesheet.slice(1), outputRoot));
  await access(new URL("demo-portrait.png", outputRoot));
  await access(new URL("favicon.png", outputRoot));
});
