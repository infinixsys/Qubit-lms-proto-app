import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const local = process.argv.includes("--local");
const windows = process.platform === "win32";
const run = (command, args, cwd = process.cwd()) => {
  const r = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: windows,
    env: {
      ...process.env,
      VITE_LOCAL_ANDROID: local ? "1" : "",
      QUBIT_LOCAL_ANDROID: local ? "1" : "",
    },
  });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status || 1);
};
run("npm", ["run", "build"]);
run("npx", ["cap", "sync", "android"]);
run(
  windows ? "gradlew.bat" : "./gradlew",
  ["assembleDebug", "--no-daemon", "--max-workers=2"],
  resolve("android"),
);
console.log("APK ready: android/app/build/outputs/apk/debug/app-debug.apk");
console.log(
  local
    ? "Local testing build: HTTP institute servers are allowed."
    : "HTTPS coaching server required.",
);
