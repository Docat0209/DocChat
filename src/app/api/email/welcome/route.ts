import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email/send-welcome'

export async function POST(request: Request) {
  const { email, name } = await request.json()

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  await sendWelcomeEmail(email, name)
  return NextResponse.json({ success: true })
}
