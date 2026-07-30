const fs = require("fs");
const vm = require("vm");

const requiredFiles = [
  "index.html",
  "guide.html",
  "reservation.html",
  "board.html",
  "status.html",
  "qr.html",
  "admin-analytics.html",
  "robots.txt",
  "sitemap.xml",
  "assets/js/runtime-config.js",
  "assets/js/tracking.js",
  "scripts/generate-runtime-config.js",
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
  "assets/images/payment/gongju-pay-qr.webp",
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
  "admin-analytics.html",
  "status.html",
  "qr.html",
  "mvno.html",
];

const publicPages = {
  "index.html": "https://koyuje.com/",
  "guide.html": "https://koyuje.com/guide",
  "reservation.html": "https://koyuje.com/reservation",
  "board.html": "https://koyuje.com/board",
  "status.html": "https://koyuje.com/status",
};

const internalPages = ["admin.html", "admin-analytics.html", "mvno.html", "qr.html"];
const appsScriptUrl = "https://script.google.com/macros/s/AKfycbyAAe8It1LY5t6kGYXj2n-VfI9aTrDJsUHmGpWVKEp-D1ekjYN9nrawPwvtubpwZHRe/exec";
const appsScriptPages = ["index.html", "reservation.html", "admin.html", "admin-analytics.html", "board.html", "status.html"];

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
  /const\s+ADMIN_PASSWORD_HASH\s*=\s*['"][a-f0-9]{64}['"]/i,
  /const\s+ADMIN_TOTP_SECRET\s*=\s*['"][A-Z2-7]{16,}['"]/i,
  /const\s+ADMIN_EMAIL_CODE\s*=\s*['"]\d{6}['"]/i,
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
    ["float-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["float-reserve", "/reservation"],
    ["mobile-reserve", "https://pf.kakao.com/_xiRxjhxj"],
  ],
  "guide.html": [
    ["hero-primary", "https://pf.kakao.com/_xiRxjhxj"],
    ["btn-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["fg-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["fg-form", "/reservation"],
    ["btn-tel", "/reservation"],
  ],
  "reservation.html": [
    ["btn-check", "/status"],
  ],
  "board.html": [
    ["nav-cta-btn", "https://pf.kakao.com/_xiRxjhxj"],
    ["guide-kakao", "https://pf.kakao.com/_xiRxjhxj"],
    ["guide-form", "/reservation"],
    ["guide-status", "/status"],
  ],
  "status.html": [
    ["support-kakao", "https://pf.kakao.com/_xiRxjhxj"],
  ],
};

const requiredPageSnippets = {
  "index.html": [
    ":where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--gold)",
    "family=Noto+Serif+KR:wght@300&family=Noto+Sans+KR:wght@300;400&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap",
    "rel=\"stylesheet\" media=\"print\" onload=\"this.media='all'\"",
    "src=\"/assets/js/runtime-config.js\" defer",
    "function getBoardUrl()",
    'class="float-reserve" aria-label="예약확정서">예약확정서</a>',
    'class="mobile-booking-links"',
    "min-width:126px;min-height:40px;text-align:center;white-space:nowrap",
    'class="float-kakao" aria-label="카톡 가능일 문의">카톡 가능일 문의</a>',
    "--gold:#8b642f;--gold2:#c49a58;--muted:#73675b",
    ".footer-links a{font-size:13px;color:rgba(247,242,234,.5)",
    "grid-template-columns:1.08fr .92fr",
    "transition:all .3s;white-space:nowrap",
    "@media(max-width:600px) and (max-height:700px)",
    ".hero-proof{display:none}",
    "예약제 운영 · 하루 두 팀 촬영 · 카카오톡 우선 문의",
    '<a href="/status">예약 현황 확인</a>',
    '<a href="/board">공지·예약 현황으로 이동</a>',
    '<a href="/board">공지·예약 현황</a>',
    "공지사항 &amp; 예약 현황",
    "가능일 확인, 예약금 입금, 예약확정서 작성 순서",
    '<div class="step-title">예약확정서</div>',
    "촬영 정보와 상품별 필요 정보",
    "촬영 정보와 상품별 필요 정보를 작성하시면 예약 정보가 접수됩니다.",
    "function escapeHTML(value)",
    "const safeTitle = escapeHTML(displayTitle)",
    "const safeDate = escapeHTML(getNoticeDateLabel(item))",
    "한옥 처마 아래에서 함께한 가족사진",
    "instagram-2026-07-26.webp",
    "images.slice(0, 6)",
    'src="${escapeHTML(img.src)}"',
    '<video class="hero-video" muted loop playsinline aria-hidden="true"',
    'poster="/assets/images/hero/_0049_poster.webp"',
    'preload="none"',
    '<source data-src="/assets/video/hero/_0049_mobile.mp4" type="video/mp4" media="(max-width: 900px)">',
    '<source data-src="/assets/video/hero/_0049_desktop.webm" type="video/webm" media="(min-width: 901px)">',
    "navigator.connection && navigator.connection.saveData",
    "video.querySelectorAll('source[data-src]')",
    '<img src="/assets/images/hero/_0049_poster.webp"',
    'fetchpriority="high"',
    "const NAVER_SEARCH_URL = 'https://map.naver.com/p/search/고유재%20한옥스튜디오'",
    'class="kakao-btn naver',
    'class="map-link naver"',
  ],
  "guide.html": [
    '<a href="/reservation" class="btn-tel">예약확정서</a>',
    'class="fg-form">예약확정서</a>',
    "하루 두 팀만 촬영하는 프라이빗 돌사진·가족사진 예약",
    "처음 문의하실 때, 이 다섯 가지만 준비해 주세요",
    "위 다섯 가지 항목 중 가능한 내용을 함께 보내주세요",
    "날짜 변경은 촬영일 기준 30일 전까지 1회 가능합니다.",
    "예약금은 입금 후 7일 이내에 환불 요청이 가능",
    '<h2 class="step-title">예약확정서</h2>',
    "예약확정서",
    "예약확정서에 기재하신 입금자명과 동일하게 입금해 주세요",
    "아기 정보, 촬영 날짜, 배송 주소를 입력하시면 예약 정보가 접수됩니다.",
    "가족 실내 앨범형</strong> · 선택 시 부모님 키·한복·신발 사이즈",
  ],
  "reservation.html": [
    ":where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--gold)",
    "for=\"babyName\"",
    "for=\"shootTime\"",
    "<title>예약확정서 | 고유재 한옥스튜디오</title>",
    '<meta property="og:title" content="예약확정서 | 고유재 한옥스튜디오">',
    '<meta property="og:description" content="예약 가능일 확인과 예약금 입금 후 아기 정보, 촬영 일정, 상품별 필요 정보를 작성하는 고유재 한옥스튜디오 예약 정보 접수 양식입니다.">',
    '<meta property="og:image:alt" content="고유재 한옥스튜디오 예약확정서 대표 이미지">',
    'aria-label="예약확정서 안내"',
    'aria-label="예약확정서 제출 전 확인"',
    '<div class="step-t">예약확정서</div>',
    "예약금 입금 후 이 예약확정서를 작성하시면 예약 정보가 접수됩니다.",
    "예약확정서 작성 안내",
    "입금자명은 예약확정서에 적으실 이름과",
    "예약확정서 제출하기",
    "제출 후 <strong>48시간 이내</strong>에 예약 확인 연락을 드립니다.",
    "<strong style=\"color:var(--ink);font-weight:400;\">48시간 이내</strong>에 예약 확인 연락을 드리겠습니다.",
    "오류가 발생했습니다. 다시 시도해 주시고, 계속 반복되면 카카오톡 채널로 문의 주세요.",
    "예약확정서가<br>정상 접수되었습니다",
    "제출하신 예약확정서 요약",
    "입금자명과 예약 정보를 확인한 뒤",
    "급한 일정 확인이 필요하시면 카카오톡으로 아기 이름과 촬영 예정일을 함께 남겨주세요.",
    "예약 상태 문의",
    "아기 정보, 촬영 일정, 상품별 필요 정보와 배송 주소를 작성해 주세요",
    "부모님 키·한복·신발 사이즈는 가족 실내 앨범형 선택 시에만 작성합니다.",
    "가족 실내 앨범형을 선택하시면 부모님 키·한복·신발 사이즈 입력란이 이어서 열립니다.",
    "엄마 키·한복·신발",
    "아빠 키·한복·신발",
    "photoUsageConsent",
    "고객님께서 동의해 주신 사진에 한해",
    'data-family-size-section',
    "function isFamilyAlbumSelected()",
    "return getRadio('product') === '가족실내앨범형'",
    "function getCheckboxArray(name)",
    "channelCheckedList.map",
    "action: 'reservation'",
    "function getScriptUrl()",
    "function escapeHTML(value)",
    "const scriptUrl = getScriptUrl()",
    "if (!scriptUrl)",
    "if (navigator.onLine === false)",
    "예약 접수 시스템 연결 정보를 불러오지 못했습니다",
    "인터넷 연결을 확인한 뒤 다시 제출해 주세요",
    ".f-input,.f-select{min-height:46px",
    ".r-item,.c-item{min-height:44px",
    ".r-item input[type=radio],.c-item input[type=checkbox]{width:18px;height:18px",
    "if (isFamilyProduct) {",
    "momHeight: isFamilyProduct ? val('momHeight') : ''",
    "dadShoes: isFamilyProduct ? val('dadShoes') : ''",
    "아기 앨범형은 부모님 키·한복·신발 사이즈 입력 없이 제출할 수 있습니다.",
    "가족 실내 앨범형은 부모님 키·한복·신발 사이즈를 함께 확인해 주세요.",
    "successRow('입금자명', payload.depositor)",
    "successRow('사진 활용', payload.photoUsageConsent)",
    "address-search-row",
    "postcode-input",
    "address-search-btn",
    "function loadPostcodeScript()",
    "script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'",
    '<main id="mainContent">',
    "family=Noto+Serif+KR:wght@300&family=Noto+Sans+KR:wght@300;400&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap",
    "rel=\"stylesheet\" media=\"print\" onload=\"this.media='all'\"",
    "src=\"/assets/js/runtime-config.js\" defer",
    "--gold:#8b642f;--gold2:#c49a58;--muted:#73675b",
    "scroll-margin-top:96px",
    "function populateShootTimeOptions()",
    "const startMinutes = 9 * 60",
    "const endMinutes = 15 * 60",
    "const interval = 30",
    "function buildSuccessInfo(payload)",
    "successSection('기본 정보'",
    "successSection('입금/요청 정보'",
    ".success-wrap{margin:48px auto 64px;padding:0 16px;}",
    ".success-confirm-value{min-width:0;color:var(--ink);overflow-wrap:anywhere",
    ".btn-check{width:100%;min-height:48px;padding:12px 16px;}",
    ".f-input:-webkit-autofill",
    ".extra-in:-webkit-autofill",
    "예약 접수 안내와 촬영 결과물 발송에 사용되니 메일 주소를 한 번 더 확인해 주세요.",
    'data-extra-for="family"',
    'data-extra-for="baby"',
    'data-extra-for="all"',
    ".sec.is-hidden,.add-card.is-hidden,.twin-fields.is-hidden,.sibling-fields.is-hidden,.sibling-shoes-field.is-hidden{display:none;}",
    "function updateExtraOptions()",
    "extra: getVisibleCheckboxes('extra')",
    "extras.filter(input => input !== changedInput)",
    "termsConsent: document.getElementById('agree').checked ? '동의' : '미동의'",
    'id="siblingFields" aria-hidden="true"',
    "function updateSiblingDependentFields()",
    "if (needsSiblingDetail() && !val('siblingInfo'))",
    "document.getElementById('babyBirth').max = todayText",
    "document.getElementById('shootDate').min = todayText",
    "if (!getCheckboxArray('sibling').length)",
    'aria-label="형제 신발 사이즈"',
    'aria-label="상세 주소"',
    'aria-label="소개자 이름"',
    'aria-label="유입 경로 기타 내용"',
  ],
  "status.html": [
    ":where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--gold)",
    "role=\"group\" aria-label=\"휴대폰 번호 뒤 8자리\"",
    '<meta name="description" content="고유재 한옥스튜디오 예약 현황 확인. 예약확정서를 작성한 예약 정보의 접수 확인중, 예약 확인 완료 상태를 휴대폰 번호로 확인하세요.">',
    '<meta property="og:description" content="예약확정서를 작성한 예약 정보의 접수 확인중, 예약 확인 완료 상태를 확인하고 조회되지 않는 경우 카카오톡으로 문의할 수 있습니다.">',
    "예약확정서를 작성하신 뒤",
    "접수 및 예약 확인 상태를 조회할 수 있습니다.",
    "예약확정서를 작성한 예약 정보와 입금 확인이 진행 중인 상태입니다. 보통 48시간 이내 예약 확인 연락을 드립니다.",
    "접수 확인중",
    "조회되지 않으면 카카오톡으로 문의해 주세요",
    "예약확정서를 작성하셨다면 카카오톡으로 아기 이름과 촬영 예정일을 함께 알려주세요.",
    "카카오톡으로 예약 상태 문의",
    "function getPhone8()",
    "function getScriptUrl()",
    "const scriptUrl=getScriptUrl()",
    "if(!scriptUrl)",
    "el.addEventListener('paste',function(e)",
    "pasted.length>=10&&pasted.startsWith('010')",
    '<main id="mainContent">',
    "family=Noto+Serif+KR:wght@300&family=Noto+Sans+KR:wght@300;400&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap",
    "rel=\"stylesheet\" media=\"print\" onload=\"this.media='all'\"",
    "src=\"/assets/js/runtime-config.js\" defer",
    "--gold:#8b642f;--gold2:#c49a58;--muted:#73675b",
    "function fetchWithTimeout(url,options,timeoutMs=20000)",
    "if(p.length!==8)",
    "function getLookupClientId()",
    "action:'reservationLookup',phone:'010'+p,clientId:getLookupClientId()",
    "throw new Error('INVALID_RESPONSE')",
    "restoreSearchButton();",
    "예약 조회 응답을 확인하지 못했습니다",
    "조회 중 오류가 발생했습니다",
    "예약 조회 응답이 지연되고 있습니다",
    "function escapeHTML(value)",
    "function statusText(s)",
    "escapeHTML(item.babyName||'-')",
    "escapeHTML(item.product||'-')",
    "escapeHTML(statusText(item.status))",
    "예약 정보가 접수되었습니다.",
    "추가 확인이 필요하시면 카카오톡 채널로 문의해 주세요.",
    "class=\"support-actions\"",
    "예약 상태 문의하기",
    "번호 다시 입력",
    "작성 직후에는 아직 예약 현황에 반영되지 않았을 수 있습니다.",
    "resetSearch()",
    ".pin-group{flex:1;min-width:0;gap:2px;}",
    ".pin-input{flex:1;width:100%;min-width:0;height:50px",
  ],
  "board.html": [
    ":where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--gold)",
    '<meta name="description" content="고유재 한옥스튜디오 공지사항과 최근 예약확정서 접수 현황을 확인하세요. 고객 이름은 개인정보 보호를 위해 일부만 표시됩니다.">',
    "Notice &amp; Reservation",
    "예약 접수 흐름을 확인하세요",
    "촬영 일정이 순차적으로<br>채워지고 있습니다",
    "월별 촬영 가능 일정이 많지 않습니다.",
    "예약 가능 일정은 문의와 접수 흐름에 따라 순차적으로 안내해 드립니다.",
    "최근 접수 현황",
    "id=\"boardList\"",
    "function loadPublicBoard()",
    "?action=board&page=1",
    "class=\"public-badge",
    "공지·예약 현황",
    "class=\"guide-form\">예약확정서</a>",
    ".board-guide-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:44px",
    "function getScriptUrl()",
    "function escapeHTML(value)",
    "const scriptUrl=getScriptUrl()",
    "if(!scriptUrl)",
    '<main id="mainContent">',
    "family=Noto+Serif+KR:wght@300&family=Noto+Sans+KR:wght@300;400&family=Cormorant+Garamond:ital,wght@0,300;1,300&display=swap",
    "rel=\"stylesheet\" media=\"print\" onload=\"this.media='all'\"",
    "src=\"/assets/js/runtime-config.js\" defer",
    "--gold:#8b642f;--gold2:#c49a58;--muted:#73675b",
    "최근 접수 현황을 잠시 불러오지 못했습니다",
  ],
  "admin.html": [
    '<meta name="robots" content="noindex,nofollow">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    ":where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--gold2)",
    '<main id="mainContent">',
    '<label class="sr-only" for="pwInput">관리자 비밀번호</label>',
    'autocomplete="current-password"',
    'id="loginErr" role="alert" aria-live="polite"',
    "function getScriptUrl()",
    "const scriptUrl=getScriptUrl()",
    "src=\"/assets/js/runtime-config.js\" defer",
    "window.addEventListener('DOMContentLoaded',bootAdminSession)",
    "function fetchWithTimeout(url,options,timeoutMs=20000)",
    "function requireActiveAdminSession(data)",
    "function adminRequestError(err,fallback)",
    "ADMIN_VIEW_STATE_KEY='koyujeAdminViewState'",
    "function saveAdminViewState()",
    "function syncAdminViewControls()",
    "class=\"admin-actions\" aria-label=\"관리자 주요 메뉴\"",
    ".admin-actions>*{flex:0 0 auto",
    ".filter-btn,.sort-btn{flex:1 1 calc(50% - 6px);min-height:44px",
    "deleteReservation('${escapeAttr(rowId)}',this)",
    "button.textContent='처리 중...'",
    "ADMIN_SESSION_EXPIRED",
    "관리자 인증 응답이 지연되고 있습니다",
    "item.siblingInfo",
    "isFamilyProduct",
    "엄마 키·한복·신발",
    "아빠 키·한복·신발",
    "아기 생년월일",
    "요청 사항",
    "예약 정보 수정",
    "삭제 처리",
    "function deleteReservation(rowId,button)",
    "action:'deleteReservation'",
    "function getAdminToken()",
    "function saveAdminSession(token,expiresIn)",
    "localStorage.setItem('koyujeAdminSession'",
    "function adminApi(payload)",
    'id="securityModalBg"',
    "action:'adminChangePassword'",
    "action:'adminVerifyEmailOtp'",
    "action:'adminResendEmailOtp'",
    "action:'adminBeginPasswordReset'",
    "action:'adminResetPassword'",
    "function getAdminClientId()",
    "clientId:getAdminClientId()",
    "function startAdminLoginLockTimer(seconds)",
    "로그인 대기 ",
    "비밀번호를 잊으셨나요?",
    "24시간 유지",
    'autocomplete="one-time-code"',
    "월별 접수 집계",
    "function updateMonthlyStats(source)",
    "savedAdminViewState.month",
    "function setMonthFilter(monthKey)",
    ".monthly-chip.active",
    "이름 · 연락처 검색",
    "고객 수정 요청은 카카오톡으로 접수",
    "action:'updateReservation'",
    "Apps Script 응답 누락",
    "미입력 또는 빈값",
    "사진 활용",
    "유입 경로",
    "min-height:44px",
  ],
  "admin-analytics.html": [
    '<meta name="robots" content="noindex,nofollow">',
    '<meta name="description" content="고유재 한옥스튜디오 내부 예약·매출 통계 분석 페이지입니다.">',
    '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
    ':where(a,button,input,select,textarea,[tabindex]):focus-visible{outline:2px solid var(--gold2)',
    '<label class="sr-only" for="pwInput">관리자 비밀번호</label>',
    '<main class="login booting" id="loginBox" aria-label="통계 관리자 로그인">',
    'id="loginErr" role="alert" aria-live="polite"',
    'id="mainContent"',
    'role="group" aria-label="통계 조회 기간"',
    'src="/assets/js/runtime-config.js" defer',
    "function getScriptUrl()",
    "function fetchWithTimeout(url,options,timeoutMs=20000)",
    "function requireActiveAdminSession(data)",
    "function setAnalyticsBusy(isBusy)",
    "window.addEventListener('DOMContentLoaded',bootAnalyticsSession)",
    "관리자 인증 응답이 지연되고 있습니다",
    'autocomplete="one-time-code"',
    "data.requiresEmailOtp",
    "action:'adminVerifyEmailOtp'",
    "action:'adminResendEmailOtp'",
    "action:'adminBeginPasswordReset'",
    "action:'adminResetPassword'",
    "function getAdminClientId()",
    "clientId:getAdminClientId()",
    "function startAdminLoginLockTimer(seconds)",
    "로그인 대기 ",
    "비밀번호를 잊으셨나요?",
    "통계 응답이 지연되고 있습니다",
    ".periods{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))",
    ".grid,.insight-grid{grid-template-columns:repeat(2,minmax(0,1fr))",
    ".nav-right .nav-primary{grid-column:1/-1",
    ".revenue-grid{grid-template-columns:1fr",
  ],
  "웹사이트가이드.txt": [
    "최종 운영 전 체크리스트",
    "검색/플레이스 등록용 소개 문구",
    "카카오 공유 디버거: https://developers.kakao.com/tool/debugger/sharing",
    "네이버 서치어드바이저: https://searchadvisor.naver.com/",
    "제출 사이트맵: https://koyuje.com/sitemap.xml",
    "공주 한옥에서 하루 두 팀만 촬영하는 프리미엄 돌사진·가족사진 스튜디오입니다.",
    "핵심 키워드: 공주 돌사진, 공주 한옥스튜디오, 공주 돌촬영, 충남 돌사진, 가족사진, 한옥 돌사진, 실크 한복 촬영",
    "예약폼 테스트 제출 기준",
    "테스트 제출 시 아기 이름은 테스트아기, 보호자명은 테스트보호자로 입력합니다.",
    "제출 후 예약 현황 조회와 관리자 화면 반영을 확인",
    "아기 앨범형 선택 시 부모님 사이즈 입력란이 숨겨지는지 확인",
    "예약 정보 제출 완료 화면에서 48시간 안내와 카카오톡 문의 안내가 자연스럽게 보이는지 확인",
    "예약 현황 조회 결과가 없을 때 작성 직후 반영 전 안내와 카카오톡 문의 버튼이 보이는지 확인",
    "관리자 페이지에서 예약 상태 변경과 형제 정보 표시를 확인",
    "고객 직접 수정 기능은 만들지 않습니다.",
    "Apps Script 저장/조회 필수 필드",
    "MailApp.sendEmail",
  ],
};

const expectedSitemapUrls = Object.values(publicPages);
const expectedSitemapLastmod = "2026-07-23";
const blockedSitemapParts = [".html", "/admin", "/mvno", "/imweb-reservation-widget-full", "/assets/"];
const requiredRobotsLines = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin",
  "Disallow: /admin.html",
  "Disallow: /admin/analytics",
  "Disallow: /admin-analytics.html",
  "Disallow: /mvno",
  "Disallow: /mvno.html",
  "Disallow: /qr",
  "Disallow: /qr.html",
  "Disallow: /imweb-reservation-widget-full",
  "Disallow: /imweb-reservation-widget-full.html",
  "Disallow: /assets/raw",
  "Disallow: /assets/raw/",
  "Sitemap: https://koyuje.com/sitemap.xml",
];

const requiredVercelIgnoreLines = [
  "assets/raw/",
  "0918.mov",
  "scripts/",
  "backup-before-sync/",
  "folder-color-tool/",
  "imweb-reservation-widget-full.html",
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
  ["/mvno/", "/mvno"],
  ["/qr/", "/qr"],
  ["/guide.html", "/guide"],
  ["/reservation.html", "/reservation"],
  ["/board.html", "/board"],
  ["/status.html", "/status"],
  ["/mvno.html", "/mvno"],
  ["/qr.html", "/qr"],
];

const requiredVercelRewrites = [
  ["/", "/index.html"],
  ["/guide", "/guide.html"],
  ["/reservation", "/reservation.html"],
  ["/board", "/board.html"],
  ["/status", "/status.html"],
  ["/admin", "/admin.html"],
  ["/mvno", "/mvno.html"],
  ["/qr", "/qr.html"],
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
  "/assets/js/runtime-config.js",
  "/assets/(.*)",
  "/:internal(admin|admin\\.html|admin-analytics\\.html|mvno|mvno\\.html|qr|qr\\.html|imweb-reservation-widget-full|imweb-reservation-widget-full\\.html)",
  "/admin/analytics",
  "/assets/raw/(.*)",
  "/assets/raw",
];

const requiredNoindexHeaderSources = [
  "/:internal(admin|admin\\.html|admin-analytics\\.html|mvno|mvno\\.html|qr|qr\\.html|imweb-reservation-widget-full|imweb-reservation-widget-full\\.html)",
  "/admin/analytics",
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

function arraysMatch(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
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
          data.url === "https://koyuje.com/" &&
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

    const h1Count = (html.match(/<h1\b/gi) || []).length;
    if (h1Count !== 1) {
      console.error(`Public page should contain exactly one H1: ${file} (${h1Count})`);
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

if (fs.existsSync("apps-script-code.gs")) {
  const appsScriptSource = fs.readFileSync("apps-script-code.gs", "utf8");

  try {
    new vm.Script(appsScriptSource);
  } catch (error) {
    console.error(`Invalid Apps Script syntax: ${error.message}`);
    hasError = true;
  }

  try {
    const appsScriptContext = vm.createContext({ console });
    new vm.Script(appsScriptSource).runInContext(appsScriptContext);

    const estimate = appsScriptContext.calculateServerEstimate({
      product: "가족실내앨범형",
      weekday: "주말/공휴일",
      sibling: "쌍둥이",
      siblingShoes: "대여신청",
      extra: "야외가족한옥스냅(+30만원)",
    });
    if (estimate.total !== 2020000) {
      console.error(`Apps Script estimate regression: expected 2020000, received ${estimate.total}`);
      hasError = true;
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    while (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
      futureDate.setDate(futureDate.getDate() + 1);
    }
    const futureDateText = [
      futureDate.getFullYear(),
      String(futureDate.getMonth() + 1).padStart(2, "0"),
      String(futureDate.getDate()).padStart(2, "0"),
    ].join("-");
    const validReservation = {
      babyName: "점검",
      babyGender: "남아",
      babyBirth: "2025-01-01",
      parentName: "보호자",
      phone: "01012345678",
      email: "test@example.com",
      weekday: "평일",
      shootDate: futureDateText,
      shootTime: "09:00",
      product: "아기앨범형",
      sibling: "형제없음",
      depositor: "보호자",
      address: "점검 주소",
      termsConsent: "동의",
      photoUsageConsent: "미동의",
    };
    if (appsScriptContext.validateReservationData(validReservation) !== "") {
      console.error("Apps Script rejected a valid reservation fixture");
      hasError = true;
    }
    if (appsScriptContext.validateReservationData({ ...validReservation, termsConsent: "미동의" }) !== "예약 약관 동의가 필요합니다.") {
      console.error("Apps Script terms consent validation regression");
      hasError = true;
    }

    const rows = [
      [],
      [null, "활성 예약", null, null, null, null, null, null, null, null, null, null, null, null, null, null, futureDateText, "09:00", null, null, null, null, null, null, null, "확인중"],
      [null, "취소 예약", null, null, null, null, null, null, null, null, null, null, null, null, null, null, futureDateText, "10:00", null, null, null, null, null, null, null, "취소"],
    ];
    if (appsScriptContext.findActiveScheduleConflict(rows, futureDateText, "09:00", -1) !== 1) {
      console.error("Apps Script active schedule conflict regression");
      hasError = true;
    }
    if (appsScriptContext.findActiveScheduleConflict(rows, futureDateText, "10:00", -1) !== -1) {
      console.error("Apps Script cancelled reservation should not block a schedule");
      hasError = true;
    }
  } catch (error) {
    console.error(`Apps Script behavior check failed: ${error.message}`);
    hasError = true;
  }

  for (const pattern of blockedSensitiveSnippets) {
    if (pattern.test(appsScriptSource)) {
      console.error("Sensitive admin credential pattern found: apps-script-code.gs");
      hasError = true;
    }
  }

  for (const snippet of [
    "ADMIN_PASSWORD_HASH_PROPERTY",
    "ADMIN_AUTH_VERSION_PROPERTY",
    "ADMIN_LOGIN_EMAIL",
    "ADMIN_SESSION_TTL_SECONDS = 24 * 60 * 60",
    "ADMIN_EMAIL_CODE_TTL_SECONDS = 5 * 60",
    "ADMIN_LOGIN_MAX_ATTEMPTS = 5",
    "ADMIN_LOGIN_WINDOW_SECONDS = 15 * 60",
    "PropertiesService.getScriptProperties().getProperty",
    "function verifyAdminEmailCode",
    "function resendAdminEmailCode",
    "function beginAdminPasswordReset",
    "function handleAdminPasswordReset",
    "function recordAdminLoginFailure",
    "MailApp.sendEmail",
    "function cleanupExpiredAdminSessions",
    "function handleAdminPasswordChange",
    "function findActiveScheduleConflict",
    "function consumeReservationLookupRate",
    "비공개 글은 공개 조회할 수 없습니다.",
    "if (!isReservation && String(rows[i][5]) !== '공개') continue;",
    "safeText(data.termsConsent) !== '동의'",
    "형제/자매 상세 정보가 누락되었습니다.",
    "calculateServerEstimate(reservationRowToEstimateData(updatedRow))",
  ]) {
    if (!appsScriptSource.includes(snippet)) {
      console.error(`Missing Apps Script credential property lookup: ${snippet}`);
      hasError = true;
    }
  }
}

for (const file of appsScriptPages) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, "utf8");
  const scriptUrls = [...html.matchAll(/https:\/\/script\.google\.com\/macros\/s\/[^'")\s]+\/exec/g)].map((match) => match[0]);

  if (!html.includes('/assets/js/runtime-config.js')) {
    console.error(`Missing runtime config loader: ${file}`);
    hasError = true;
  }

  for (const url of scriptUrls) {
    console.error(`Apps Script URL must come from runtime config in ${file}: ${url}`);
    hasError = true;
  }
}

for (const configFile of ['scripts/generate-runtime-config.js', 'assets/js/runtime-config.js']) {
  if (!fs.existsSync(configFile)) continue;
  const source = fs.readFileSync(configFile, 'utf8');
  if (!source.includes(appsScriptUrl)) {
    console.error(`Missing current Apps Script URL: ${configFile}`);
    hasError = true;
  }
}

if (fs.existsSync("sitemap.xml")) {
  const sitemap = fs.readFileSync("sitemap.xml", "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const sitemapDates = [...sitemap.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map((match) => match[1]);
  const uniqueSitemapUrls = new Set(sitemapUrls);

  if (!arraysMatch(sitemapUrls, expectedSitemapUrls)) {
    console.error("Sitemap URL order should match public canonical page order");
    hasError = true;
  }

  if (uniqueSitemapUrls.size !== sitemapUrls.length) {
    console.error("Sitemap contains duplicate URLs");
    hasError = true;
  }

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

    if (!url.startsWith("https://koyuje.com")) {
      console.error(`Sitemap URL should use production HTTPS domain: ${url}`);
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

    if (date !== expectedSitemapLastmod) {
      console.error(`Sitemap lastmod should be ${expectedSitemapLastmod}: ${date}`);
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

  const globalHeaders = headers.find((entry) => entry.source === "/(.*)");
  const securityHeaders = new Map((globalHeaders?.headers || []).map((header) => [header.key, header.value]));
  const requiredSecurityHeaders = new Map([
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["X-Frame-Options", "SAMEORIGIN"],
    ["Content-Security-Policy", "frame-ancestors 'self'; base-uri 'self'; object-src 'none'"],
  ]);
  for (const [key, value] of requiredSecurityHeaders) {
    if (securityHeaders.get(key) !== value) {
      console.error(`Missing or invalid security header: ${key}`);
      hasError = true;
    }
  }
}

if (hasError) process.exit(1);

console.log("Static site check passed.");
