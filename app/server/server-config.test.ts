import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveHostname, resolvePort } from "./server-config.js";

test("resolveHostname binds to all interfaces in production-like environments", () => {
  assert.equal(resolveHostname({ NODE_ENV: "production" }), "0.0.0.0");
  assert.equal(resolveHostname({ IISNODE_VERSION: "1.0" }), "0.0.0.0");
});

test("resolvePort falls back to the standard application port", () => {
  assert.equal(resolvePort({}), 3000);
  assert.equal(resolvePort({ PORT: "4000" }), 4000);
});
