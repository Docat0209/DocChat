export function subscriptionEmailHtml(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fafafa; padding: 40px 20px;">
      <div style="max-width: 560px; margin: 0 auto;">
        <h1 style="font-size: 24px; margin-bottom: 16px;">Welcome to DocChat Pro!</h1>
        <p style="color: #a1a1aa; line-height: 1.6;">
          Hi${name ? ` ${name}` : ''},
        </p>
        <p style="color: #a1a1aa; line-height: 1.6;">
          Your subscription is confirmed. You now have unlimited access to all DocChat features — unlimited documents and unlimited questions per day.
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}"
           style="display: inline-block; background: #fafafa; color: #0a0a0a; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 16px;">
          Start Exploring →
        </a>
        <p style="color: #52525b; font-size: 13px; margin-top: 32px;">
          — The DocChat Team
        </p>
      </div>
    </body>
    </html>
  `
}
