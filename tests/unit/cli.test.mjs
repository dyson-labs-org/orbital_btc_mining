import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

test("status --json emits only deterministic status JSON", () => {
  const first = execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], {
    encoding: "utf8"
  });
  const second = execFileSync(process.execPath, ["src/cli.mjs", "status", "--json"], {
    encoding: "utf8"
  });
  assert.equal(first, second);
  const parsed = JSON.parse(first);
  assert.equal(parsed.product_name, "Orbital Compute Lab");
  assert.equal(parsed.implementation_status, "skeleton");
  assert.equal(parsed.capabilities.simulation_kernel, false);
});

test("status text and help do not overstate implementation", () => {
  const status = execFileSync(process.execPath, ["src/cli.mjs", "status"], {
    encoding: "utf8"
  });
  assert.match(status, /simulation: not implemented/);
  assert.match(status, /bitcoin behavior: not implemented/);
  assert.match(status, /ai behavior: not implemented/);

  const help = execFileSync(process.execPath, ["src/cli.mjs", "help"], {
    encoding: "utf8"
  });
  assert.match(help, /No simulation kernel/);
});

test("unknown commands fail nonzero and write diagnostics to stderr", () => {
  const result = spawnSync(process.execPath, ["src/cli.mjs", "simulate"], {
    encoding: "utf8"
  });
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unknown command: simulate/);
});
