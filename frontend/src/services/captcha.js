// FILE: frontend/src/services/captcha.js
// Google reCAPTCHA v3 integration
// Uses the test/demo key by default — replace VITE_RECAPTCHA_SITE_KEY in .env for production

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LfX3Y0sAAAAAIGGcuE-kU0bJP2YVEfFlnmGhF8P'

/**
 * Execute reCAPTCHA v3 invisible challenge
 * @param {string} action - Action name for analytics (e.g. 'login', 'register')
 * @returns {Promise<string>} - reCAPTCHA token
 */
export async function getCaptchaToken(action = 'submit') {
  return new Promise((resolve) => {
    if (!window.grecaptcha) {
      console.warn('[CAPTCHA] reCAPTCHA not loaded, skipping')
      resolve('')
      return
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(SITE_KEY, { action })
        .then(token => resolve(token))
        .catch(err => {
          console.warn('[CAPTCHA] Failed to execute:', err)
          resolve('')
        })
    })
  })
}

export default { getCaptchaToken }
