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
    return res.status(200).json(await forward(payload, retries));
  } catch (err) {
    return res.status(502).json({
      result: 'error',
      retryable: true,
      message: '관리자 서버 연결이 일시적으로 지연되고 있습니다. 다시 한 번 눌러 주세요.'
    });
  }
};

