import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const assets = readdirSync("dist/assets").map((f) => "/assets/" + f);
const version = createHash("sha256")
  .update(assets.join("|"))
  .digest("hex")
  .slice(0, 12);
let sw = readFileSync("public/sw.js", "utf8").replace(
  "const CACHE='qubit-shell-v1';",
  `const CACHE='qubit-shell-${version}';`,
);
sw = sw.replace(
  "cache.addAll(['/','/icon.svg','/manifest.webmanifest'])",
  `cache.addAll(${JSON.stringify(["/", "/icon.svg", "/manifest.webmanifest", ...assets])})`,
);
writeFileSync("dist/sw.js", sw);
console.log("Offline shell precached:", assets.length, "versioned assets");
