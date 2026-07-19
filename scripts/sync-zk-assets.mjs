import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const source = resolve("contract/src/managed/private-party");
const target = resolve("public/zk/private-party");

if (!existsSync(source)) {
  console.log("Compact output not found yet. Run npm run compact first.");
  process.exit(0);
}

mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
console.log(`Synced Compact artifacts to ${target}`);
