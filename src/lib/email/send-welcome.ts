import { Resend } from 'resend'
import { welcomeEmailHtml } from './welcome-template'

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  try {
    const resend = getResendClient()
    await resend.emails.send({
      from: 'DocChat <onboarding@resend.dev>',
      to: email,
      subject: 'Welcome to DocChat!',
      html: welcomeEmailHtml(name || ''),
    })
  } catch (error) {
    // Fire-and-forget: log but don't throw
    console.error('Failed to send welcome email:', error)
  }
}
