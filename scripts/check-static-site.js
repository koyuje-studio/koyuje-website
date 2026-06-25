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

const publicPages = {
  "index.html": "https://koyuje-website.vercel.app/",
  "guide.html": "https://koyuje-website.vercel.app/guide",
  "reservation.html": "https://koyuje-website.vercel.app/reservation",
  "board.html": "https://koyuje-website.vercel.app/board",
  "status.html": "https://koyuje-website.vercel.app/status",
};

const internalPages = ["admin.html", "mvno.html"];

const requiredPublicMeta = [
  '<meta name="description"',
  '<meta name="robots" content="index,follow">',
  '<meta property="og:type" content="website">',
  '<meta property="og:locale" content="ko_KR">',
  '<meta property="og:site_name"',
  '<meta property="og:title"',
  '<meta property="og:description"',
  '<meta property="og:image" content="https://koyuje-website.vercel.app/assets/images/social/og-image.jpg">',
  '<meta property="og:image:secure_url" content="https://koyuje-website.vercel.app/assets/images/social/og-image.jpg">',
  '<meta property="og:image:alt"',
  '<meta property="og:image:type" content="image/jpeg">',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta name="theme-color" content="#f7f2ea">',
  '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
];

const expectedSitemapUrls = Object.values(publicPages);
const blockedSitemapParts = [".html", "/admin", "/mvno", "/imweb-reservation-widget-full", "/assets/"];

let hasError = false;

function requireIncludes(file, html, snippet, label) {
  if (!html.includes(snippet)) {
    console.error(`Missing ${label}: ${file}`);
    hasError = true;
  }
}

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

  if (publicPages[file]) {
    requireIncludes(file, html, `<link rel="canonical" href="${publicPages[file]}">`, "canonical");
    requireIncludes(file, html, `<meta property="og:url" content="${publicPages[file]}">`, "og:url");

    for (const snippet of requiredPublicMeta) {
      requireIncludes(file, html, snippet, snippet);
    }
  }

  if (internalPages.includes(file)) {
    requireIncludes(file, html, '<meta name="robots" content="noindex,nofollow">', "noindex robots meta");
  }
}

if (fs.existsSync("sitemap.xml")) {
  const sitemap = fs.readFileSync("sitemap.xml", "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

  for (const url of expectedSitemapUrls) {
    if (!sitemapUrls.includes(url)) {
      console.error(`Missing sitemap URL: ${url}`);
      hasError = true;
    }
  }

  for (const url of sitemapUrls) {
    if (!expectedSitemapUrls.includes(url)) {
      console.error(`Unexpected sitemap URL: ${url}`);
      hasError = true;
    }

    if (blockedSitemapParts.some((part) => url.includes(part))) {
      console.error(`Blocked sitemap URL pattern: ${url}`);
      hasError = true;
    }
  }
}

if (hasError) process.exit(1);

console.log("Static site check passed.");
