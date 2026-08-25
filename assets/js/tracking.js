(function () {
  "use strict";

  const config = window.KOYUJE_RUNTIME_CONFIG || {};
  const SCRIPT_URL = String(config.APPS_SCRIPT_URL || "").trim();
  const ALLOWED_PIXEL_HOSTS = ["koyuje.com", "www.koyuje.com"];
  const ADMIN_PATHS = ["/admin", "/admin.html", "/admin/analytics", "/admin-analytics.html"];
  const STORAGE_PREFIX = "koyuje_";
  const DAY = 24 * 60 * 60 * 1000;
  const host = window.location.hostname;
  const path = window.location.pathname;
  const isAdmin = ADMIN_PATHS.some((adminPath) => path === adminPath || path.startsWith(adminPath + "/"));
  const isAllowedPixelHost = ALLOWED_PIXEL_HOSTS.includes(host);
  const debugMode = Boolean(config.TRACKING_DEBUG) || !isAllowedPixelHost || window.location.protocol === "file:";
  const pixelId = String(config.META_PIXEL_ID || "").trim();
  let pixelReady = false;
  let formStarted = false;
  let packageObserved = false;
  let aboutObserved = false;

  if (isAdmin) return;

  function nowIso() {
    return new Date().toISOString();
  }

  function randomId(prefix) {
    const cryptoObj = window.crypto || window.msCrypto;
    if (cryptoObj && cryptoObj.getRandomValues) {
      const arr = new Uint32Array(4);
      cryptoObj.getRandomValues(arr);
      return `${prefix}_${Date.now()}_${Array.from(arr).map((n) => n.toString(36)).join("")}`;
    }
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  function setStored(name, value, days) {
    try {
      localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify({ value, expires: Date.now() + days * DAY }));
    } catch (err) {}
  }

  function getStored(name) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + name);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expires && parsed.expires < Date.now()) {
        localStorage.removeItem(STORAGE_PREFIX + name);
        return null;
      }
      return parsed.value || null;
    } catch (err) {
      return null;
    }
  }

  function getVisitorId() {
    let visitorId = getStored("visitor_id");
    if (!visitorId) {
      visitorId = randomId("visitor");
      setStored("visitor_id", visitorId, 180);
    }
    return visitorId;
  }

  function getUtmFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const data = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((key) => {
      const value = params.get(key);
      if (value) data[key] = value.slice(0, 180);
    });
    return data;
  }

  function getCookie(name) {
    const prefix = `${name}=`;
    const item = String(document.cookie || "").split(";").map((value) => value.trim()).find((value) => value.indexOf(prefix) === 0);
    return item ? decodeURIComponent(item.slice(prefix.length)) : "";
  }

  function getSafeLandingUrl() {
    const allowed = ["fbclid", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const url = new URL(window.location.href);
    const safe = new URL(url.origin + url.pathname);
    allowed.forEach((key) => {
      const value = url.searchParams.get(key);
      if (value) safe.searchParams.set(key, value.slice(0, 500));
    });
    return safe.toString().slice(0, 1500);
  }

  function refreshAttribution() {
    const utm = getUtmFromUrl();
    if (Object.keys(utm).length) {
      if (!getStored("first_utm")) setStored("first_utm", { ...utm, captured_at: nowIso() }, 30);
      setStored("current_utm", { ...utm, captured_at: nowIso() }, 30);
    }
    const params = new URLSearchParams(window.location.search);
    const fbclid = String(params.get("fbclid") || getStored("fbclid") || "").slice(0, 500);
    const fbp = String(getCookie("_fbp") || getStored("fbp") || "").slice(0, 500);
    let fbc = String(getCookie("_fbc") || getStored("fbc") || "").slice(0, 500);
    if (!fbc && fbclid) fbc = `fb.1.${Date.now()}.${fbclid}`;
    if (fbclid) setStored("fbclid", fbclid, 90);
    if (fbp) setStored("fbp", fbp, 90);
    if (fbc) setStored("fbc", fbc, 90);
    if (!getStored("first_landing_url")) setStored("first_landing_url", getSafeLandingUrl(), 180);
    if (!getStored("first_visited_at")) setStored("first_visited_at", nowIso(), 180);
    setStored("last_visited_at", nowIso(), 180);
  }

  function getAttribution() {
    const currentUtm = getStored("current_utm") || {};
    const firstUtm = getStored("first_utm") || {};
    return {
      visitorId: getVisitorId(),
      fbclid: String(getStored("fbclid") || ""),
      fbc: String(getCookie("_fbc") || getStored("fbc") || ""),
      fbp: String(getCookie("_fbp") || getStored("fbp") || ""),
      utmSource: currentUtm.utm_source || firstUtm.utm_source || "",
      utmMedium: currentUtm.utm_medium || firstUtm.utm_medium || "",
      utmCampaign: currentUtm.utm_campaign || firstUtm.utm_campaign || "",
      utmContent: currentUtm.utm_content || firstUtm.utm_content || "",
      utmTerm: currentUtm.utm_term || firstUtm.utm_term || "",
      firstLandingUrl: String(getStored("first_landing_url") || ""),
      firstVisitedAt: String(getStored("first_visited_at") || ""),
      lastVisitedAt: nowIso(),
      userAgent: (navigator.userAgent || "").slice(0, 500)
    };
  }

  function getDeviceType() {
    const width = window.innerWidth || document.documentElement.clientWidth || 0;
    if (width <= 767) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  }

  function detectBrowser() {
    const ua = navigator.userAgent || "";
    if (/Edg\//.test(ua)) return "edge";
    if (/Chrome\//.test(ua)) return "chrome";
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "safari";
    if (/Firefox\//.test(ua)) return "firefox";
    return "unknown";
  }

  function detectOs() {
    const ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    if (/Windows/.test(ua)) return "windows";
    if (/Mac OS/.test(ua)) return "macos";
    return "unknown";
  }

  function getReferrerDomain() {
    try {
      return document.referrer ? new URL(document.referrer).hostname : "";
    } catch (err) {
      return "";
    }
  }

  function buildPayload(eventName, metaEventName, params, eventId) {
    const currentUtm = getStored("current_utm") || {};
    const firstUtm = getStored("first_utm") || {};
    return {
      event_name: eventName,
      meta_event_name: metaEventName || "",
      event_id: eventId || randomId("event"),
      visitor_id: getVisitorId(),
      path: window.location.pathname + window.location.search,
      title: document.title || "",
      referrer: document.referrer || "",
      referrer_domain: getReferrerDomain(),
      utm_source: currentUtm.utm_source || firstUtm.utm_source || "",
      utm_medium: currentUtm.utm_medium || firstUtm.utm_medium || "",
      utm_campaign: currentUtm.utm_campaign || firstUtm.utm_campaign || "",
      utm_content: currentUtm.utm_content || firstUtm.utm_content || "",
      utm_term: currentUtm.utm_term || firstUtm.utm_term || "",
      device_type: getDeviceType(),
      browser: detectBrowser(),
      os: detectOs(),
      user_agent: (navigator.userAgent || "").slice(0, 500),
      created_at: nowIso(),
      params: params || {}
    };
  }

  function postOwnEvent(payload) {
    if (!SCRIPT_URL) return;
    const body = JSON.stringify({ action: "trackEvent", event: payload });
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
        navigator.sendBeacon(SCRIPT_URL, blob);
        return;
      }
    } catch (err) {}

    fetch(SCRIPT_URL, {
      method: "POST",
      body,
      keepalive: true
    }).catch(function () {});
  }

  function loadPixel() {
    if (pixelReady || !pixelId || !isAllowedPixelHost) return;
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", pixelId);
    pixelReady = true;
  }

  function sendPixel(metaEventName, params, eventId) {
    if (!metaEventName || !pixelId || !isAllowedPixelHost) return;
    loadPixel();
    if (!window.fbq) return;
    window.fbq("track", metaEventName, params || {}, { eventID: eventId });
  }

  function track(metaEventName, params, ownEventName, eventId) {
    const eventName = ownEventName || String(metaEventName || "").toLowerCase();
    const payload = buildPayload(eventName, metaEventName, params, eventId);
    postOwnEvent(payload);
    if (debugMode && config.TRACKING_DEBUG) {
      console.log("[Koyuje tracking]", payload);
    }
    sendPixel(metaEventName, params, payload.event_id);
    return payload.event_id;
  }

  function trackOwn(ownEventName, params) {
    return track("", params || {}, ownEventName);
  }

  function trackKakaoClick() {
    track("Contact", { method: "kakao", content_name: "카카오톡 문의" }, "kakao_click");
  }

  function trackPhoneClick() {
    track("Contact", { method: "phone", content_name: "전화 문의" }, "phone_click");
  }

  function trackInstagramClick() {
    track("Contact", { method: "instagram", content_name: "인스타그램 문의" }, "instagram_click");
  }

  function trackProductView(trigger) {
    track("ViewContent", { content_name: "상품 구성 보기", content_category: "product", trigger: trigger || "view" }, "product_view_click");
  }

  function trackProductSelect(value) {
    const labels = {
      "아기앨범형": "아기 앨범형",
      "가족실내앨범형": "가족 실내 앨범형"
    };
    track("CustomizeProduct", {
      content_name: labels[value] || value || "촬영 상품",
      content_category: "reservation_product"
    }, "product_select");
  }

  function trackContentReaction(name, trigger) {
    track("ViewContent", {
      content_name: String(name || "content").trim().slice(0, 120),
      content_category: "engagement",
      trigger: trigger || "click"
    }, "content_reaction");
  }

  function bindInteractions() {
    document.addEventListener("click", function (event) {
      const galleryControl = event.target.closest && event.target.closest("[data-gallery-index], [data-open-gallery]");
      if (galleryControl) trackContentReaction("갤러리 작품 보기", "gallery_click");

      const summary = event.target.closest && event.target.closest("summary");
      if (summary && !summary.closest(".pkg-details")) {
        trackContentReaction(summary.textContent || "상세 안내", "details_open");
      }

      const link = event.target.closest && event.target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.indexOf("pf.kakao.com/_xiRxjhxj") !== -1) trackKakaoClick();
      if (href.indexOf("tel:") === 0) trackPhoneClick();
      if (href === "#packages" || href === "/#packages") trackProductView("anchor_click");
      if (href.indexOf("instagram.com/koyuje_studio") !== -1) trackInstagramClick();
    }, true);

    document.querySelectorAll(".pkg-details summary, .btn-pkg").forEach(function (el) {
      el.addEventListener("click", function () {
        trackProductView("product_control_click");
      });
    });

    const reservationForm = document.getElementById("resForm");
    if (reservationForm) {
      reservationForm.addEventListener("input", function () {
        if (formStarted) return;
        formStarted = true;
        trackOwn("reservation_form_start", { content_name: "예약확정서 작성 시작" });
      }, true);
      reservationForm.addEventListener("change", function (event) {
        const target = event.target;
        if (target && target.name === "product" && target.checked) trackProductSelect(target.value);
      }, true);
    }

    const packages = document.getElementById("packages");
    if (packages && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!packageObserved && entry.isIntersecting && entry.intersectionRatio > 0.25) {
            packageObserved = true;
            trackProductView("section_view");
            observer.disconnect();
          }
        });
      }, { threshold: [0.25] });
      observer.observe(packages);
    }

    const about = document.getElementById("about");
    if (about && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!aboutObserved && entry.isIntersecting && entry.intersectionRatio > 0.25) {
            aboutObserved = true;
            track("ViewContent", {
              content_name: "고유재 한옥스튜디오 소개",
              content_category: "studio"
            }, "studio_view");
            observer.disconnect();
          }
        });
      }, { threshold: [0.25] });
      observer.observe(about);
    }
  }

  function applyLandingMessage() {
    if (path !== "/" && path !== "/index.html") return;
    const content = String(getAttribution().utmContent || "");
    const messages = {
      "01_날짜선점": ["원하는 계절의<br>한옥 돌촬영을<br>먼저 준비하세요", "대전·세종에서 찾는 프리미엄 한옥 돌촬영<br>하루 두 팀만 차분히 준비합니다."],
      "02_시원한실내": ["계절에 흔들리지 않는<br>시원한 한옥 실내<br>프리미엄 돌촬영", "대전·세종 가족을 위한 쾌적한 한옥 실내 촬영<br>하루 두 팀만 여유 있게 진행합니다."],
      "03_하루두팀": ["하루 두 팀,<br>우리 가족만을 위한<br>한옥 돌촬영", "대전·세종 프리미엄 한옥 돌촬영<br>한 가족의 시간을 충분히 남깁니다."],
      "04_올인원": ["한복부터 헤어·메이크업까지<br>한 번에 준비하는<br>한옥 돌촬영", "대전·세종 프리미엄 한옥 돌촬영<br>하루 두 팀만 정성껏 준비합니다."],
      "05_가을선예약": ["가을 한옥 돌촬영,<br>좋은 날짜부터<br>먼저 준비하세요", "대전·세종 프리미엄 한옥 돌촬영<br>하루 두 팀의 일정을 순차적으로 안내합니다."],
      "06_감성프리미엄": ["시간이 지나도 빛나는<br>프리미엄 한옥<br>가족 돌사진", "대전·세종에서 만나는 고요한 한옥의 미감<br>하루 두 팀만 깊이 있게 촬영합니다."]
    };
    const selected = messages[content];
    if (!selected) return;
    const title = document.getElementById("heroTitle");
    const lead = document.getElementById("heroLead");
    if (title) title.innerHTML = selected[0];
    if (lead) lead.innerHTML = selected[1];
  }

  let purchaseClaimTimer = 0;
  let purchaseClaimAttempts = 0;

  function stopPurchaseClaimPolling() {
    if (purchaseClaimTimer) window.clearTimeout(purchaseClaimTimer);
    purchaseClaimTimer = 0;
    purchaseClaimAttempts = 0;
  }

  function schedulePurchaseClaimRetry() {
    if (purchaseClaimTimer || purchaseClaimAttempts >= 60) return;
    purchaseClaimTimer = window.setTimeout(function () {
      purchaseClaimTimer = 0;
      claimPendingPurchase();
    }, 30000);
  }

  function claimPendingPurchase() {
    if (!SCRIPT_URL) return;
    let claim = null;
    try { claim = JSON.parse(sessionStorage.getItem("koyuje_purchase_claim") || "null"); } catch (err) {}
    if (!claim || !claim.reservationId || !claim.token) return;
    purchaseClaimAttempts += 1;
    fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "claimMetaPurchase",
        reservationId: claim.reservationId,
        token: claim.token
      })
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data || data.result !== "success") {
          schedulePurchaseClaimRetry();
          return;
        }
        if (data.status === "ready" && data.eventId) {
          track("Purchase", {
            value: Number(data.value || 0),
            currency: "KRW",
            content_name: "고유재 한옥 돌촬영 예약",
            content_category: "예약금 입금·예약확정 완료",
            order_id: data.reservationId || claim.reservationId
          }, "purchase_browser", data.eventId);
          sessionStorage.removeItem("koyuje_purchase_claim");
          stopPurchaseClaimPolling();
          return;
        }
        if (data.status === "already_claimed") {
          sessionStorage.removeItem("koyuje_purchase_claim");
          stopPurchaseClaimPolling();
          return;
        }
        schedulePurchaseClaimRetry();
      })
      .catch(schedulePurchaseClaimRetry);
  }

  refreshAttribution();

  window.KoyujeTracking = {
    track: track,
    trackSchedule: function (params, eventId) {
      return track("Schedule", params || { content_name: "예약 신청 접수 완료" }, "reservation_submit", eventId);
    },
    trackLead: function (params, eventId) {
      return track("Lead", params || { content_name: "상담 신청 저장 완료" }, "lead_submit", eventId);
    },
    beginPurchaseClaim: function (claim) {
      if (!claim || !claim.reservationId || !claim.token) return;
      try { sessionStorage.setItem("koyuje_purchase_claim", JSON.stringify(claim)); } catch (err) {}
      stopPurchaseClaimPolling();
      claimPendingPurchase();
    },
    trackSearch: function (label) {
      return track("Search", { search_string: label || "reservation_status" }, "status_check");
    },
    getVisitorId: getVisitorId,
    getAttribution: getAttribution
  };

  document.addEventListener("DOMContentLoaded", function () {
    applyLandingMessage();
    track("PageView", { page_title: document.title || "" }, "page_view");
    const contentPages = {
      "/baby": "아기 앨범형",
      "/baby.html": "아기 앨범형",
      "/family": "가족 실내 앨범형",
      "/family.html": "가족 실내 앨범형",
      "/hanok-snap": "야외 가족 스냅 추가",
      "/hanok-snap.html": "야외 가족 스냅 추가",
      "/pricing": "상품 가격 안내",
      "/pricing.html": "상품 가격 안내",
      "/": "고유재 프리미엄 한옥 돌촬영",
      "/index.html": "고유재 프리미엄 한옥 돌촬영"
    };
    if (contentPages[path]) {
      track("ViewContent", {
        content_name: contentPages[path],
        content_category: "product"
      }, "product_page_view");
    }
    if (path === "/reservation" || path === "/reservation.html") {
      trackOwn("reservation_page_view", { content_name: "예약확정서 진입" });
    }
    bindInteractions();
    claimPendingPurchase();
  });
})();
