const fs = require("fs");
const path = require("path");

const outDir = path.join(process.cwd(), "assets", "js");
const outFile = path.join(outDir, "runtime-config.js");

const config = {
  APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbyAAe8It1LY5t6kGYXj2n-VfI9aTrDJsUHmGpWVKEp-D1ekjYN9nrawPwvtubpwZHRe/exec",
  META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || "",
  META_CAPI_ENABLED: Boolean((process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID) && process.env.META_ACCESS_TOKEN),
  TRACKING_DEBUG: process.env.TRACKING_DEBUG === "1" || process.env.NEXT_PUBLIC_TRACKING_DEBUG === "1"
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outFile,
  `window.KOYUJE_RUNTIME_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  "utf8"
);

console.log(`Runtime config generated. Meta Pixel: ${config.META_PIXEL_ID ? "configured" : "empty"}. CAPI token: ${config.META_CAPI_ENABLED ? "present" : "empty"}.`);
