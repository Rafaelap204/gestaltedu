export function generateReferralCode(name?: string): string {
  const prefix = name 
    ? name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) 
    : 'ref'
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${prefix}${suffix}`
}
