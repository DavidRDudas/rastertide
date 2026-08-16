import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Glyphfield studio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Glyphfield — Animated ASCII Generator<\/title>/i);
  assert.match(html, /Images and video/);
  assert.match(html, /redrawn as type/);
  assert.match(html, /Glyph motion/);
  assert.match(html, /Add image or video/);
  assert.match(html, /Flow direction/);
  assert.match(html, /Files stay on your device/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("keeps the conversion private and browser-native", async () => {
  const studio = await readFile(new URL("app/AsciiStudio.tsx", root), "utf8");
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");
  const packageJson = await readFile(new URL("package.json", root), "utf8");

  assert.match(studio, /URL\.createObjectURL/);
  assert.match(studio, /canvas\.captureStream/);
  assert.match(studio, /navigator\.clipboard\.writeText/);
  assert.match(studio, /Files stay on your device/);
  assert.match(layout, /og\.png/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
