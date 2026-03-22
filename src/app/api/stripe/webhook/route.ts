import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSubscriptionEmail } from '@/lib/email/send-subscription'
import type Stripe from 'stripe'

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('checkout.session.completed: missing userId in metadata')
    return
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id

  // Idempotency: check if already on pro
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, name, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!profile) {
    console.error('checkout.session.completed: profile not found for userId', userId)
    return
  }

  if (profile.plan === 'pro') {
    return // Already processed
  }

  await supabase
    .from('profiles')
    .update({
      plan: 'pro',
      ...(customerId && !profile.stripe_customer_id ? { stripe_customer_id: customerId } : {}),
    })
    .eq('id', userId)

  await sendSubscriptionEmail(profile.email, profile.name ?? undefined)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

  if (!customerId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile) return

  // If subscription is active or trialing, ensure plan is pro
  // If cancel_at_period_end, plan stays pro until period ends (handled by subscription.deleted)
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    if (profile.plan !== 'pro') {
      await supabase.from('profiles').update({ plan: 'pro' }).eq('stripe_customer_id', customerId)
    }
  } else if (
    subscription.status === 'canceled' ||
    subscription.status === 'unpaid' ||
    subscription.status === 'past_due'
  ) {
    if (profile.plan !== 'free') {
      await supabase.from('profiles').update({ plan: 'free' }).eq('stripe_customer_id', customerId)
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id

  if (!customerId) return

  // Idempotency: only update if not already free
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!profile || profile.plan === 'free') return

  await supabase.from('profiles').update({ plan: 'free' }).eq('stripe_customer_id', customerId)
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      await handleCheckoutCompleted(session)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionUpdated(subscription)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionDeleted(subscription)
      break
    }
  }

  return NextResponse.json({ received: true })
}
