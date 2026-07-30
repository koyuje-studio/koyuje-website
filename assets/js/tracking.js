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

  function refreshUtm() {
    const utm = getUtmFromUrl();
    if (Object.keys(utm).length) {
      if (!getStored("first_utm")) setStored("first_utm", { ...utm, captured_at: nowIso() }, 30);
      setStored("current_utm", { ...utm, captured_at: nowIso() }, 30);
    }
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

  function buildPayload(eventName, metaEventName, params) {
    const currentUtm = getStored("current_utm") || {};
    const firstUtm = getStored("first_utm") || {};
    return {
      event_name: eventName,
      meta_event_name: metaEventName || "",
      event_id: randomId("event"),
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

  function track(metaEventName, params, ownEventName) {
    const eventName = ownEventName || String(metaEventName || "").toLowerCase();
    const payload = buildPayload(eventName, metaEventName, params);
    postOwnEvent(payload);
    if (debugMode && config.TRACKING_DEBUG) {
      console.log("[Koyuje tracking]", payload);
    }
    sendPixel(metaEventName, params, payload.event_id);
    return payload.event_id;
  }

  function trackKakaoClick() {
    track("Contact", { method: "kakao", content_name: "카카오톡 문의" }, "kakao_click");
  }

  function trackPhoneClick() {
    track("Contact", { method: "phone", content_name: "전화 문의" }, "phone_click");
  }

  function trackProductView(trigger) {
    track("ViewContent", { content_name: "상품 구성 보기", content_category: "product", trigger: trigger || "view" }, "product_view_click");
  }

  function bindInteractions() {
    document.addEventListener("click", function (event) {
      const link = event.target.closest && event.target.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.indexOf("pf.kakao.com/_xiRxjhxj") !== -1) trackKakaoClick();
      if (href.indexOf("tel:") === 0) trackPhoneClick();
      if (href === "#packages" || href === "/#packages") trackProductView("anchor_click");
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
        track("Lead", { content_name: "예약확정서 작성 시작" }, "reservation_form_start");
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
  }

  refreshUtm();

  window.KoyujeTracking = {
    track: track,
    trackCompleteRegistration: function (params) {
      return track("CompleteRegistration", params || { content_name: "예약확정서 제출 완료" }, "reservation_submit");
    },
    trackSearch: function (label) {
      return track("Search", { search_string: label || "reservation_status" }, "status_check");
    },
    getVisitorId: getVisitorId
  };

  document.addEventListener("DOMContentLoaded", function () {
    track("PageView", { page_title: document.title || "" }, "page_view");
    const contentPages = {
      "/baby": "아기 앨범형",
      "/baby.html": "아기 앨범형",
      "/family": "가족 실내 앨범형",
      "/family.html": "가족 실내 앨범형",
      "/hanok-snap": "야외 가족 스냅 추가",
      "/hanok-snap.html": "야외 가족 스냅 추가",
      "/pricing": "상품 가격 안내",
      "/pricing.html": "상품 가격 안내"
    };
    if (contentPages[path]) {
      track("ViewContent", {
        content_name: contentPages[path],
        content_category: "product"
      }, "product_page_view");
    }
    if (path === "/reservation" || path === "/reservation.html") {
      track("Lead", { content_name: "예약확정서 진입" }, "reservation_page_view");
    }
    bindInteractions();
  });
})();
