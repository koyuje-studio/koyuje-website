const fs = require("fs");
const vm = require("vm");

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

const blockedPublicHrefPatterns = [
  /href=(["'])\/[^"']+\.html\1/i,
  /href=(["'])\/admin(?:\.html)?\1/i,
  /href=(["'])\/mvno(?:\.html)?\1/i,
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

const requiredClassHrefRules = {
  "index.html": [
    ["nav-cta", "https://pf.kakao.com/_xiRxjhxj"],
    ["btn-primary", "https://pf.kakao.com/_xiRxjhxj"],
    ["bridge-primary", "https://pf.kakao.com/_xiRxjhxj"],
    ["process-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["process-form", "/reservation"],
    ["notice-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["notice-form", "/reservation"],
    ["notice-status", "/status"],
    ["float-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["float-reserve", "/reservation"],
    ["mobile-reserve", "https://pf.kakao.com/_xiRxjhxj"],
  ],
  "guide.html": [
    ["hero-primary", "https://pf.kakao.com/_xiRxjhxj"],
    ["message-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["btn-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["fg-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["fg-form", "/reservation"],
    ["btn-tel", "/reservation"],
  ],
  "reservation.html": [
    ["helper-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["btn-check", "/status"],
  ],
  "board.html": [
    ["nav-cta-btn", "https://pf.kakao.com/_xiRxjhxj"],
    ["guide-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["guide-form", "/reservation"],
    ["guide-status", "/status"],
  ],
  "status.html": [
    ["inquiry-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["inquiry-form", "/reservation"],
    ["support-kakao", "https://pf.kakao.com/_xiRxjhxj"],
  ],
};

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
    '<video class="hero-video" autoplay muted loop playsinline',
    'poster="/assets/images/hero/_0049_poster.webp"',
    'preload="metadata"',
    '<source src="/assets/video/hero/_0049_mobile.mp4" type="video/mp4" media="(max-width: 900px)">',
    '<source src="/assets/video/hero/_0049_desktop.webm" type="video/webm" media="(min-width: 901px)">',
    '<source src="/assets/video/hero/_0049_animation.mp4" type="video/mp4">',
    '<img src="/assets/images/hero/_0049_poster.webp"',
    'fetchpriority="high"',
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
    "function getPhone8()",
    "if(p.length!==8)",
    "fetch(SCRIPT_URL+'?phone8='+p)",
    "throw new Error('INVALID_RESPONSE')",
    "restoreSearchButton();",
    "예약 조회 응답을 확인하지 못했습니다",
    "조회 중 오류가 발생했습니다",
    "function escapeHTML(value)",
    "escapeHTML(item.babyName||'-')",
    "escapeHTML(item.product||'-')",
    "class=\"support-actions\"",
    "예약 상태 문의하기",
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

const requiredVercelIgnoreLines = [
  "assets/raw/",
  "0918.mov",
  "scripts/",
  "backup-before-sync/",
  "folder-color-tool/",
  "imweb-reservation-widget-full.html",
  "mvno.html",
];

const requiredGitIgnoreLines = [
  "assets/raw/",
  "backup-before-sync/",
  "folder-color-tool/",
  "imweb-reservation-widget-full.html",
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
  ["/0057.jpg", "/assets/images/gallery/0057.jpg"],
  ["/0073.jpg", "/assets/images/gallery/0073.jpg"],
  ["/0075.jpg", "/assets/images/gallery/0075.jpg"],
  ["/0138_.jpg", "/assets/images/gallery/0138_.jpg"],
  ["/_0049.jpg", "/assets/images/hero/_0049.jpg"],
  ["/_0049_poster.webp", "/assets/images/hero/_0049_poster.webp"],
  ["/_0049_mobile.mp4", "/assets/video/hero/_0049_mobile.mp4"],
  ["/_0049_desktop.webm", "/assets/video/hero/_0049_desktop.webm"],
  ["/_0049_animation.mp4", "/assets/video/hero/_0049_animation.mp4"],
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

function getJpegSize(file) {
  const buffer = fs.readFileSync(file);
  let offset = 2;

  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;

    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);

    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + length;
  }

  return null;
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

function getAttribute(tag, name) {
  return tag.match(new RegExp(`\\s${name}=(["'])(.*?)\\1`, "i"))?.[2] || "";
}

function hasAnchorWithClassAndHref(html, className, href) {
  return getAnchorTags(html).some((tag) => {
    const classes = getAttribute(tag, "class").split(/\s+/);
    return classes.includes(className) && getAttribute(tag, "href") === href;
  });
}

function getTitle(html) {
  return html.match(/<title>(.*?)<\/title>/i)?.[1]?.trim() || "";
}

function getMetaContent(html, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`<meta\\s+${escaped}\\s+content="([^"]+)"\\s*\\/?>`, "i");
  return html.match(pattern)?.[1]?.trim() || "";
}

function getScriptBlocks(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => !/type=(["'])application\/ld\+json\1/i.test(match[1]))
    .filter((match) => !/type=(["'])module\1/i.test(match[1]))
    .map((match) => match[2].trim())
    .filter(Boolean);
}

function getJsonLdBlocks(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((match) => /type=(["'])application\/ld\+json\1/i.test(match[1]))
    .map((match) => match[2].trim())
    .filter(Boolean);
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

if (fs.existsSync("assets/images/social/og-image.jpg")) {
  const ogImageSize = getJpegSize("assets/images/social/og-image.jpg");

  if (!ogImageSize || ogImageSize.width !== 1200 || ogImageSize.height !== 630) {
    console.error("OG image must be a 1200x630 JPEG: assets/images/social/og-image.jpg");
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

  for (const [className, href] of requiredClassHrefRules[file] || []) {
    if (!hasAnchorWithClassAndHref(html, className, href)) {
      console.error(`Missing required CTA link target in ${file}: .${className} -> ${href}`);
      hasError = true;
    }
  }

  for (const [index, script] of getScriptBlocks(html).entries()) {
    try {
      new vm.Script(script);
    } catch (error) {
      console.error(`Invalid inline script syntax: ${file} script #${index + 1} (${error.message})`);
      hasError = true;
    }
  }

  const jsonLdBlocks = getJsonLdBlocks(html);
  for (const [index, block] of jsonLdBlocks.entries()) {
    try {
      JSON.parse(block);
    } catch (error) {
      console.error(`Invalid JSON-LD syntax: ${file} block #${index + 1} (${error.message})`);
      hasError = true;
    }
  }

  if (file === "index.html") {
    const hasLocalBusiness = jsonLdBlocks.some((block) => {
      try {
        const data = JSON.parse(block);
        return (
          data["@context"] === "https://schema.org" &&
          data["@type"] === "LocalBusiness" &&
          data.name === "고유재 한옥스튜디오" &&
          data.url === "https://koyuje-website.vercel.app/" &&
          Array.isArray(data.sameAs) &&
          data.sameAs.includes("https://www.instagram.com/koyuje_studio/") &&
          data.sameAs.includes("https://pf.kakao.com/_xiRxjhxj")
        );
      } catch (error) {
        return false;
      }
    });

    if (!hasLocalBusiness) {
      console.error("Missing required LocalBusiness JSON-LD on index.html");
      hasError = true;
    }
  }

  if (publicPages[file]) {
    requireIncludes(file, html, `<link rel="canonical" href="${publicPages[file]}">`, "canonical");
    requireIncludes(file, html, `<meta property="og:url" content="${publicPages[file]}">`, "og:url");

    for (const snippet of requiredPublicMeta) {
      requireIncludes(file, html, snippet, snippet);
    }

    const publicTitle = getTitle(html);
    const publicDescription = getMetaContent(html, 'name="description"');
    const ogTitle = getMetaContent(html, 'property="og:title"');
    const ogDescription = getMetaContent(html, 'property="og:description"');

    if (!publicTitle.includes("고유재 한옥스튜디오")) {
      console.error(`Public title should include brand name: ${file}`);
      hasError = true;
    }

    if (publicDescription.length < 45) {
      console.error(`Public meta description is too short: ${file}`);
      hasError = true;
    }

    if (ogTitle !== publicTitle) {
      console.error(`OG title should match title: ${file}`);
      hasError = true;
    }

    if (ogDescription.length < 35) {
      console.error(`OG description is too short: ${file}`);
      hasError = true;
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

    for (const pattern of blockedPublicHrefPatterns) {
      if (pattern.test(html)) {
        console.error(`Public page should not link to html/internal route directly in ${file}: ${pattern}`);
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

if (fs.existsSync(".vercelignore")) {
  const vercelIgnore = fs.readFileSync(".vercelignore", "utf8");

  for (const line of requiredVercelIgnoreLines) {
    requireIncludes(".vercelignore", vercelIgnore, line, line);
  }
}

if (fs.existsSync(".gitignore")) {
  const gitIgnore = fs.readFileSync(".gitignore", "utf8");

  for (const line of requiredGitIgnoreLines) {
    requireIncludes(".gitignore", gitIgnore, line, line);
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
