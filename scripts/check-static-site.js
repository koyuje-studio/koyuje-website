const fs = require("fs");

const requiredFiles = [
  "index.html",
  "guide.html",
  "reservation.html",
  "board.html",
  "status.html",
  "robots.txt",
  "sitemap.xml",
  "assets/images/hero/_0049.jpg",
  "assets/images/hero/_0049_poster.webp",
  "assets/video/hero/_0049_mobile.mp4",
  "assets/video/hero/_0049_desktop.webm",
  "assets/video/hero/_0049_animation.mp4",
  "assets/images/gallery/gallery_01.jpg",
  "assets/images/gallery/webp/gallery_01.webp",
  "assets/images/gallery/webp/0057.webp",
  "assets/images/gallery/webp/0073.webp",
  "assets/images/gallery/webp/0075.webp",
  "assets/images/gallery/webp/0138_.webp",
  "assets/images/social/og-image.jpg",
];

const htmlFiles = [
  "index.html",
  "guide.html",
  "reservation.html",
  "board.html",
  "admin.html",
  "status.html",
  "mvno.html",
];

let hasError = false;

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    hasError = true;
  }
}

for (const file of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const title = html.match(/<title>(.*?)<\/title>/i)?.[1];
  const htmlOpen = (html.match(/<html\b/gi) || []).length;
  const htmlClose = (html.match(/<\/html>/gi) || []).length;

  if (!title) {
    console.error(`Missing title: ${file}`);
    hasError = true;
  }

  if (htmlOpen !== 1 || htmlClose !== 1) {
    console.error(`Invalid html wrapper: ${file}`);
    hasError = true;
  }
}

if (hasError) process.exit(1);

console.log("Static site check passed.");
