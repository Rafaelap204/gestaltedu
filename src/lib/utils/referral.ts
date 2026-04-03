export function setReferralCookie(code: string): void {
  // Set cookie 'ref_code' with value=code, expires in 30 days
  document.cookie = `ref_code=${encodeURIComponent(code)};path=/;max-age=${30 * 24 * 60 * 60};SameSite=Lax`
}

export function getReferralCookie(): string | null {
  // Read 'ref_code' from cookies
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'ref_code') {
      return decodeURIComponent(value)
    }
  }
  return null
}

export function clearReferralCookie(): void {
  document.cookie = 'ref_code=;path=/;max-age=0;SameSite=Lax'
}
