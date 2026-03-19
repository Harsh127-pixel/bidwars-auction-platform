const { getSettings } = require("../services/settingsService")

const verifyCaptcha = async (req, res, next) => {
  const settings = await getSettings()
  
  if (settings.captchaEnabled === false) {
    return next()
  }

  const token = req.body.captchaToken || req.headers['x-captcha-token']

  // Skip verification if secret key not configured
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('[CAPTCHA] No RECAPTCHA_SECRET_KEY set — skipping verification')
    return next()
  }

  if (!token) {
    return res.status(400).json({ error: 'Missing captcha token' })
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    })

    const data = await response.json()

    if (!data.success) {
      console.warn('[CAPTCHA] Verification failed:', data['error-codes'])
      return res.status(403).json({ error: 'Captcha verification failed' })
    }

    // For v3, check score (0.0 = bot, 1.0 = human) — 0.5 is a reasonable threshold
    if (data.score !== undefined && data.score < 0.3) {
      console.warn(`[CAPTCHA] Low score: ${data.score} for action: ${data.action}`)
      return res.status(403).json({ error: 'Suspicious activity detected' })
    }

    // Attach captcha data to request for logging
    req.captcha = { score: data.score, action: data.action }
    next()
  } catch (err) {
    console.error('[CAPTCHA] Verification error:', err.message)
    // Don't block login on captcha service failure
    next()
  }
}

module.exports = { verifyCaptcha }
