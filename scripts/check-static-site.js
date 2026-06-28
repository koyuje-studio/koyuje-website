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

const assetSizeLimits = {
  "assets/images/social/og-image.jpg": 500 * 1024,
  "assets/images/hero/_0049_poster.webp": 350 * 1024,
  "assets/images/gallery/webp/gallery_01.webp": 350 * 1024,
  "assets/video/hero/_0049_mobile.mp4": 1.5 * 1024 * 1024,
  "assets/video/hero/_0049_desktop.webm": 3 * 1024 * 1024,
};

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

const blockedPublicMeta = [
  'name="twitter:',
  'property="twitter:',
  "twitter.com",
  "x.com/",
];

const blockedPublicContactPatterns = [
  /href=(["'])tel:/i,
  /010-7635-9689/,
  /\+82-10-7635-9689/,
];

const blockedSensitiveSnippets = [
  /const\s+ADMIN_PW\s*=/,
];

const blockedInquiryLinks = [
  /<a\b[^>]*href="\/guide"[^>]*>[^<]*가능일 문의/gi,
  /<a\b[^>]*href='\/guide'[^>]*>[^<]*가능일 문의/gi,
];

const blockedReservationLabels = [
  /<a\b[^>]*href="\/reservation"[^>]*>\s*예약확정 작성\s*<\/a>/gi,
  /<a\b[^>]*href='\/reservation'[^>]*>\s*예약확정 작성\s*<\/a>/gi,
];

const blockedReservationTerms = [
  /SNS에 올라갈 수 있습니다/,
  /원치 않으시는 분은 예약 시 미리 말씀해주세요/,
];

const requiredExternalAnchorAttributes = [
  {
    label: "Kakao channel",
    href: "https://pf.kakao.com/_xiRxjhxj",
    attributes: ["target=\"_blank\"", "rel=\"noopener\""],
  },
  {
    label: "Naver map",
    href: "https://map.naver.com/p/search/고유재%20한옥스튜디오",
    attributes: ["target=\"_blank\"", "rel=\"noopener\""],
  },
];

const requiredPageSnippets = {
  "index.html": [
    'class="float-reserve">입금 후 작성</a>',
    'class="notice-form">입금 후 작성</a>',
    'class="mobile-booking-links"',
    '<a href="/status">현황 확인</a>',
    '<a href="/board">게시판으로 이동</a>',
    "function escapeHTML(value)",
    "const safeTitle = escapeHTML(displayTitle)",
    "const safeDate = escapeHTML(item.date",
    'src="${escapeHTML(img.src)}"',
    "const NAVER_SEARCH_URL = 'https://map.naver.com/p/search/고유재%20한옥스튜디오'",
    'class="kakao-btn naver',
    'class="map-link naver"',
  ],
  "guide.html": [
    '<a href="/reservation" class="btn-tel">입금 후 작성</a>',
    'class="fg-form">입금 후 작성</a>',
  ],
  "reservation.html": [
    "photoUsageConsent",
    "고객님께서 동의해주신 사진에 한해",
    'data-family-size-section',
    "function isFamilyAlbumSelected()",
    "return getRadio('product') === '가족실내앨범형'",
    "if (isFamilyProduct) {",
    "momHeight: isFamilyProduct ? val('momHeight') : ''",
    "dadShoes: isFamilyProduct ? val('dadShoes') : ''",
    "사진 활용 &nbsp;<span>",
    "입금자명 &nbsp;<span>",
  ],
  "status.html": [
    "번호 다시 입력",
    "resetSearch()",
  ],
  "board.html": [
    "목록으로 돌아가기",
    "help-close",
  ],
};

const expectedSitemapUrls = Object.values(publicPages);
const blockedSitemapParts = [".html", "/admin", "/mvno", "/imweb-reservation-widget-full", "/assets/"];
const requiredRobotsLines = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin",
  "Disallow: /admin.html",
  "Disallow: /mvno",
  "Disallow: /mvno.html",
  "Disallow: /imweb-reservation-widget-full",
  "Disallow: /imweb-reservation-widget-full.html",
  "Disallow: /assets/raw",
  "Disallow: /assets/raw/",
  "Sitemap: https://koyuje-website.vercel.app/sitemap.xml",
];

const requiredVercelRedirects = [
  ["/index.html", "/"],
  ["/guide/", "/guide"],
  ["/reservation/", "/reservation"],
  ["/board/", "/board"],
  ["/status/", "/status"],
  ["/guide.html", "/guide"],
  ["/reservation.html", "/reservation"],
  ["/board.html", "/board"],
  ["/status.html", "/status"],
];

const requiredVercelRewrites = [
  ["/", "/index.html"],
  ["/guide", "/guide.html"],
  ["/reservation", "/reservation.html"],
  ["/board", "/board.html"],
  ["/status", "/status.html"],
  ["/admin", "/admin.html"],
  ["/og-image.jpg", "/assets/images/social/og-image.jpg"],
  ["/gallery_01.jpg", "/assets/images/gallery/gallery_01.jpg"],
  ["/_0049_mobile.mp4", "/assets/video/hero/_0049_mobile.mp4"],
];

const requiredVercelHeaderSources = [
  "/(.*)",
  "/assets/(.*)",
  "/:internal(admin|admin\\.html|mvno|mvno\\.html|imweb-reservation-widget-full|imweb-reservation-widget-full\\.html)",
  "/assets/raw/(.*)",
  "/assets/raw",
];

const requiredNoindexHeaderSources = [
  "/:internal(admin|admin\\.html|mvno|mvno\\.html|imweb-reservation-widget-full|imweb-reservation-widget-full\\.html)",
  "/assets/raw/(.*)",
  "/assets/raw",
];

let hasError = false;

function requireIncludes(file, html, snippet, label) {
  if (!html.includes(snippet)) {
    console.error(`Missing ${label}: ${file}`);
    hasError = true;
  }
}

function getHtmlTags(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) || [];
}

function hasAttribute(tag, attribute) {
  return new RegExp(`\\s${attribute}(=|\\s|>)`, "i").test(tag);
}

function getAnchorTags(html) {
  return html.match(/<a\b[^>]*>/gi) || [];
}

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    hasError = true;
  }
}

for (const [file, maxBytes] of Object.entries(assetSizeLimits)) {
  if (!fs.existsSync(file)) continue;

  const size = fs.statSync(file).size;
  if (size > maxBytes) {
    console.error(`Asset too large: ${file} (${Math.round(size / 1024)}KB > ${Math.round(maxBytes / 1024)}KB)`);
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

  for (const pattern of blockedSensitiveSnippets) {
    if (pattern.test(html)) {
      console.error(`Sensitive admin credential pattern found: ${file}`);
      hasError = true;
    }
  }

  for (const snippet of requiredPageSnippets[file] || []) {
    requireIncludes(file, html, snippet, snippet);
  }

  for (const tag of getHtmlTags(html, "img")) {
    const isTemplateImage = tag.includes("${");

    for (const attribute of ["src", "alt", "decoding"]) {
      if (!hasAttribute(tag, attribute)) {
        console.error(`Missing image ${attribute}: ${file}`);
        hasError = true;
      }
    }

    if (!isTemplateImage) {
      for (const attribute of ["width", "height"]) {
        if (!hasAttribute(tag, attribute)) {
          console.error(`Missing image ${attribute}: ${file}`);
          hasError = true;
        }
      }

      if (!hasAttribute(tag, "loading") && !hasAttribute(tag, "fetchpriority")) {
        console.error(`Missing image loading strategy: ${file}`);
        hasError = true;
      }
    }
  }

  for (const tag of getHtmlTags(html, "video")) {
    for (const attribute of ["poster", "preload", "width", "height"]) {
      if (!hasAttribute(tag, attribute)) {
        console.error(`Missing video ${attribute}: ${file}`);
        hasError = true;
      }
    }
  }

  for (const tag of getAnchorTags(html)) {
    if (tag.includes('target="_blank"') || tag.includes("target='_blank'")) {
      if (!tag.includes('rel="noopener"') && !tag.includes("rel='noopener'")) {
        console.error(`Missing noopener on blank target anchor: ${file}`);
        hasError = true;
      }
    }

    for (const rule of requiredExternalAnchorAttributes) {
      if (!tag.includes(`href="${rule.href}"`) && !tag.includes(`href='${rule.href}'`)) continue;

      for (const attribute of rule.attributes) {
        if (!tag.includes(attribute)) {
          console.error(`Missing ${rule.label} anchor attribute ${attribute}: ${file}`);
          hasError = true;
        }
      }
    }
  }

  if (publicPages[file]) {
    requireIncludes(file, html, `<link rel="canonical" href="${publicPages[file]}">`, "canonical");
    requireIncludes(file, html, `<meta property="og:url" content="${publicPages[file]}">`, "og:url");

    for (const snippet of requiredPublicMeta) {
      requireIncludes(file, html, snippet, snippet);
    }

    for (const snippet of blockedPublicMeta) {
      if (html.includes(snippet)) {
        console.error(`Blocked public meta found in ${file}: ${snippet}`);
        hasError = true;
      }
    }

    for (const pattern of blockedPublicContactPatterns) {
      if (pattern.test(html)) {
        console.error(`Public inquiry should prefer Kakao over phone in ${file}: ${pattern}`);
        hasError = true;
      }
    }

    for (const pattern of blockedInquiryLinks) {
      if (pattern.test(html)) {
        console.error(`Reservation inquiry CTA should point to Kakao: ${file}`);
        hasError = true;
      }
    }

    for (const pattern of blockedReservationLabels) {
      if (pattern.test(html)) {
        console.error(`Reservation form CTA should mention deposit timing: ${file}`);
        hasError = true;
      }
    }

    if (file === "reservation.html") {
      for (const pattern of blockedReservationTerms) {
        if (pattern.test(html)) {
          console.error(`Reservation terms should match optional photo usage consent: ${file}`);
          hasError = true;
        }
      }
    }
  }

  if (internalPages.includes(file)) {
    requireIncludes(file, html, '<meta name="robots" content="noindex,nofollow">', "noindex robots meta");
  }
}

if (fs.existsSync("sitemap.xml")) {
  const sitemap = fs.readFileSync("sitemap.xml", "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const sitemapDates = [...sitemap.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((match) => match[1]);

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

  if (sitemapDates.length !== sitemapUrls.length) {
    console.error("Sitemap lastmod count does not match URL count");
    hasError = true;
  }

  for (const date of sitemapDates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      console.error(`Invalid sitemap lastmod date: ${date}`);
      hasError = true;
    }
  }
}

if (fs.existsSync("robots.txt")) {
  const robots = fs.readFileSync("robots.txt", "utf8");

  for (const line of requiredRobotsLines) {
    requireIncludes("robots.txt", robots, line, line);
  }
}

if (fs.existsSync("vercel.json")) {
  const vercelConfig = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  const redirects = vercelConfig.redirects || [];
  const rewrites = vercelConfig.rewrites || [];
  const headers = vercelConfig.headers || [];

  for (const [source, destination] of requiredVercelRedirects) {
    const exists = redirects.some((entry) => (
      entry.source === source &&
      entry.destination === destination &&
      entry.permanent === true
    ));

    if (!exists) {
      console.error(`Missing Vercel redirect: ${source} -> ${destination}`);
      hasError = true;
    }
  }

  for (const [source, destination] of requiredVercelRewrites) {
    const exists = rewrites.some((entry) => (
      entry.source === source &&
      entry.destination === destination
    ));

    if (!exists) {
      console.error(`Missing Vercel rewrite: ${source} -> ${destination}`);
      hasError = true;
    }
  }

  for (const source of requiredVercelHeaderSources) {
    if (!headers.some((entry) => entry.source === source)) {
      console.error(`Missing Vercel header source: ${source}`);
      hasError = true;
    }
  }

  for (const source of requiredNoindexHeaderSources) {
    const entry = headers.find((headerEntry) => headerEntry.source === source);
    const hasNoindex = entry && (entry.headers || []).some((header) => (
      header.key === "X-Robots-Tag" &&
      header.value === "noindex, nofollow"
    ));

    if (!hasNoindex) {
      console.error(`Missing noindex header for Vercel source: ${source}`);
      hasError = true;
    }
  }
}

if (hasError) process.exit(1);

console.log("Static site check passed.");
