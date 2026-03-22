import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

export async function POST() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, plan')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.plan === 'pro') {
      return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 })
    }

    let customerId = profile.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: STRIPE_CONFIG.prices.pro, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
