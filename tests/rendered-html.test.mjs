import assert from "node:assert/strict";
import test from "node:test";

async function worker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

const environment = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const context = { waitUntil() {}, passThroughOnException() {} };

test("server-renders the Recast application", async () => {
  const response = await (await worker()).fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), environment, context);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Recast AI/);
  assert.match(html, /Repurpose studio/);
  assert.match(html, /Generate content suite/);
  assert.match(html, /7-day content calendar/);
  assert.doesNotMatch(html, /Building your site|Your site is taking shape|codex-preview/i);
});

test("generation endpoint rejects an unconfigured deployment safely", async () => {
  const response = await (await worker()).fetch(new Request("http://localhost/api/generate", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ source: "This source contains enough words to pass validation but has no configured server API key for the test environment today.", title: "Test" }),
  }), environment, context);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "AI generation is not configured." });
});
