import { createAdminClient } from '@/lib/supabase/admin'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import type { SubscriptionPlan } from '@/types/database'

export interface UsageStatus {
  plan: SubscriptionPlan
  documents: { current: number; limit: number; canUpload: boolean }
  questions: { current: number; limit: number; canAsk: boolean }
}

function isBeforeToday(dateString: string): boolean {
  const resetDate = new Date(dateString)
  const now = new Date()
  return (
    resetDate.getUTCFullYear() < now.getUTCFullYear() ||
    resetDate.getUTCMonth() < now.getUTCMonth() ||
    resetDate.getUTCDate() < now.getUTCDate()
  )
}

export async function getUsageStatus(userId: string): Promise<UsageStatus> {
  const supabase = createAdminClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, question_count_today, question_count_reset_at')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    throw new Error(`Failed to fetch profile: ${profileError?.message ?? 'Not found'}`)
  }

  const plan = profile.plan as SubscriptionPlan
  let questionCount = profile.question_count_today

  // Reset daily counter if reset_at is before today (UTC)
  if (isBeforeToday(profile.question_count_reset_at)) {
    questionCount = 0
    await supabase
      .from('profiles')
      .update({
        question_count_today: 0,
        question_count_reset_at: new Date().toISOString(),
      })
      .eq('id', userId)
  }

  const { count: documentCount, error: countError } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    throw new Error(`Failed to count documents: ${countError.message}`)
  }

  const planConfig = STRIPE_CONFIG.plans[plan]
  const docCount = documentCount ?? 0

  return {
    plan,
    documents: {
      current: docCount,
      limit: planConfig.documents,
      canUpload: docCount < planConfig.documents,
    },
    questions: {
      current: questionCount,
      limit: planConfig.questionsPerDay,
      canAsk: questionCount < planConfig.questionsPerDay,
    },
  }
}

export async function incrementQuestionCount(userId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('question_count_today, question_count_reset_at')
    .eq('id', userId)
    .single()

  if (!profile) return

  if (isBeforeToday(profile.question_count_reset_at)) {
    await supabase
      .from('profiles')
      .update({
        question_count_today: 1,
        question_count_reset_at: new Date().toISOString(),
      })
      .eq('id', userId)
  } else {
    await supabase
      .from('profiles')
      .update({
        question_count_today: profile.question_count_today + 1,
      })
      .eq('id', userId)
  }
}
