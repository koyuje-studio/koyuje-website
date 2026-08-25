const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ||
  'https://script.google.com/macros/s/AKfycbyAAe8It1LY5t6kGYXj2n-VfI9aTrDJsUHmGpWVKEp-D1ekjYN9nrawPwvtubpwZHRe/exec';

const ALLOWED_ACTIONS = new Set([
  'adminLogin', 'adminVerifyEmailOtp', 'adminResendEmailOtp',
  'adminBeginPasswordReset', 'adminResetPassword', 'adminLogout',
  'adminSecurityStatus', 'adminChangePassword', 'admin', 'analytics',
  'updateStatus', 'deleteReservation', 'syncCalendar',
  'updateReservation', 'writePost'
]);

const RETRY_ACTIONS = new Set([
  'adminLogin', 'adminVerifyEmailOtp', 'adminResendEmailOtp',
  'adminBeginPasswordReset', 'adminResetPassword',
  'adminSecurityStatus', 'admin', 'analytics'
]);

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function forward(payload, retries) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
        signal: AbortSignal.timeout(30000)
      });
      const text = await response.text();
      if (!response.ok || !text.trim().startsWith('{')) {
        throw new Error('Invalid Apps Script response');
      }
      return JSON.parse(text);
    } catch (err) {
      lastError = err;
      if (attempt < retries) await wait(400 * (attempt + 1));
    }
  }
  throw lastError;
}

function formatSeoulDate(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function addDays(dateText, amount) {
  const date = new Date(`${dateText}T12:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatSeoulDate(date);
}

function getMetaDateRange(payload) {
  if (payload.period === 'custom' && /^\d{4}-\d{2}-\d{2}$/.test(payload.startDate || '') && /^\d{4}-\d{2}-\d{2}$/.test(payload.endDate || '')) {
    return { since: payload.startDate, until: payload.endDate };
  }
  const today = formatSeoulDate(new Date());
  if (payload.period === 'today') return { since: today, until: today };
  if (payload.period === 'yesterday') {
    const yesterday = addDays(today, -1);
    return { since: yesterday, until: yesterday };
  }
  if (payload.period === '30d') return { since: addDays(today, -29), until: today };
  if (payload.period === 'this_month') return { since: `${today.slice(0, 8)}01`, until: today };
  if (payload.period === 'last_month') {
    const thisMonthStart = `${today.slice(0, 8)}01`;
    const lastMonthEnd = addDays(thisMonthStart, -1);
    return { since: `${lastMonthEnd.slice(0, 8)}01`, until: lastMonthEnd };
  }
  return { since: addDays(today, -6), until: today };
}

function sumActionValue(actions, names) {
  return (actions || []).reduce((total, item) => {
    return names.includes(String(item.action_type || '')) ? total + Number(item.value || 0) : total;
  }, 0);
}

async function fetchMetaAdsInsights(payload) {
  const accessToken = String(process.env.META_ACCESS_TOKEN || '').trim();
  const accountId = String(process.env.META_AD_ACCOUNT_ID || '').replace(/^act_/, '').trim();
  if (!accessToken || !accountId) {
    return { configured: false, status: 'not_configured', daily: [] };
  }

  const range = getMetaDateRange(payload);
  const version = String(process.env.META_GRAPH_VERSION || 'v25.0').trim();
  const params = new URLSearchParams({
    access_token: accessToken,
    level: 'account',
    time_increment: '1',
    time_range: JSON.stringify(range),
    fields: 'date_start,date_stop,spend,impressions,reach,clicks,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,ctr,cpc,cpm,actions,action_values',
    limit: '500'
  });

  try {
    const response = await fetch(`https://graph.facebook.com/${version}/act_${accountId}/insights?${params}`, {
      signal: AbortSignal.timeout(15000)
    });
    const json = await response.json();
    if (!response.ok || json.error) throw new Error(json.error && json.error.message ? json.error.message : 'Meta API response error');

    const daily = (json.data || []).map(item => ({
      date: item.date_start,
      spend: Number(item.spend || 0),
      impressions: Number(item.impressions || 0),
      reach: Number(item.reach || 0),
      clicks: Number(item.inline_link_clicks || item.clicks || 0),
      ctr: Number(item.inline_link_click_ctr || item.ctr || 0),
      cpc: Number(item.cost_per_inline_link_click || item.cpc || 0),
      cpm: Number(item.cpm || 0),
      leads: sumActionValue(item.actions, ['lead', 'offsite_conversion.fb_pixel_lead']),
      registrations: sumActionValue(item.actions, ['complete_registration', 'offsite_conversion.fb_pixel_complete_registration'])
    }));
    const summary = daily.reduce((total, item) => {
      total.spend += item.spend;
      total.impressions += item.impressions;
      total.reach += item.reach;
      total.clicks += item.clicks;
      total.leads += item.leads;
      total.registrations += item.registrations;
      return total;
    }, { spend: 0, impressions: 0, reach: 0, clicks: 0, leads: 0, registrations: 0 });
    summary.ctr = summary.impressions ? (summary.clicks / summary.impressions) * 100 : 0;
    summary.cpc = summary.clicks ? summary.spend / summary.clicks : 0;
    summary.cpm = summary.impressions ? (summary.spend / summary.impressions) * 1000 : 0;
    return { configured: true, status: 'success', range, summary, daily };
  } catch (err) {
    return {
      configured: true,
      status: 'error',
      message: 'Meta 광고 데이터를 불러오지 못했습니다.',
      daily: []
    };
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ result: 'error', message: '허용되지 않은 요청입니다.' });
  }

  let payload = req.body;
  try {
    if (typeof payload === 'string') payload = JSON.parse(payload);
  } catch (err) {
    return res.status(400).json({ result: 'error', message: '요청 형식을 확인해 주세요.' });
  }

  if (!payload || !ALLOWED_ACTIONS.has(String(payload.action || ''))) {
    return res.status(400).json({ result: 'error', message: '허용되지 않은 관리자 요청입니다.' });
  }

  try {
    const retries = RETRY_ACTIONS.has(payload.action) ? 1 : 0;
    const result = await forward(payload, retries);
    if (payload.action === 'analytics' && result && result.result === 'success') {
      result.metaAds = await fetchMetaAdsInsights(payload);
    }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({
      result: 'error',
      retryable: true,
      message: '관리자 서버 연결이 일시적으로 지연되고 있습니다. 다시 한 번 눌러 주세요.'
    });
  }
};
