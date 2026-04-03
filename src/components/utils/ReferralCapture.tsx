'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { setReferralCookie } from '@/lib/utils/referral'
import { trackReferralClickAction } from '@/lib/actions/referral'

function ReferralCaptureContent() {
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const refCode = searchParams.get('ref')
    
    if (refCode) {
      // Set the referral cookie (30 days)
      setReferralCookie(refCode)
      
      // Track the referral click in the database
      // Use a simple fingerprint based on user agent (optional)
      const fingerprint = typeof navigator !== 'undefined' 
        ? btoa(navigator.userAgent).slice(0, 32) 
        : undefined
      
      trackReferralClickAction(refCode, fingerprint).catch(console.error)
    }
  }, [searchParams])
  
  // This component renders nothing
  return null
}

export function ReferralCapture() {
  return (
    <Suspense fallback={null}>
      <ReferralCaptureContent />
    </Suspense>
  )
}
