'use client'

import { useState } from 'react'
import { Loader2, Crown, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { SubscriptionPlan } from '@/types/database'

interface UpgradeButtonProps {
  plan: SubscriptionPlan
}

export function UpgradeButton({ plan }: UpgradeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      const endpoint = plan === 'pro' ? '/api/stripe/portal' : '/api/stripe/checkout'
      const response = await fetch(endpoint, { method: 'POST' })
      const data = (await response.json()) as { url?: string; error?: string }

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Unable to start checkout. Payments may not be configured yet.')
      }
    } catch {
      toast.error('Unable to start checkout. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  if (plan === 'pro') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Settings className="size-4" />}
        Manage Subscription
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full gap-2"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Crown className="size-4 text-yellow-500" />
      )}
      Upgrade to Pro
    </Button>
  )
}
