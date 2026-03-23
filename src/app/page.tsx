export const dynamic = 'force-static'

import Link from 'next/link'
import {
  FileText,
  Brain,
  BookOpen,
  MessageSquare,
  Check,
  ArrowRight,
  Github,
  Sparkles,
  Zap,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Upload Any Document',
    description: 'Support for PDF, DOCX, and TXT files. Simply drag and drop to get started.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Answers',
    description:
      'GPT-4o-mini with retrieval-augmented generation for accurate, contextual responses.',
  },
  {
    icon: BookOpen,
    title: 'Source Citations',
    description: 'Every answer cites the exact page, so you can verify and trust the information.',
  },
  {
    icon: MessageSquare,
    title: 'Chat History',
    description: 'Revisit past conversations anytime. Your chat history is always preserved.',
  },
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for trying out DocChat',
    features: ['3 documents', '20 questions per day', 'PDF, DOCX, TXT support', 'Chat history'],
    cta: 'Get Started',
    ctaHref: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    description: 'For power users and teams',
    features: [
      'Unlimited documents',
      'Unlimited questions',
      'Priority support',
      'PDF, DOCX, TXT support',
      'Chat history',
    ],
    cta: 'Upgrade to Pro',
    ctaHref: '/signup',
    highlighted: true,
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Sparkles className="size-5 text-primary" />
            DocChat
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 py-24 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-sm text-muted-foreground">
              <Zap className="size-3.5" />
              Powered by GPT-4o-mini
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Chat with your
              <br />
              <span className="text-primary">documents</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Upload PDF, DOCX, or TXT files and get AI-powered answers with source citations. Stop
              searching, start asking.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started Free
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-6 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Login
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border/40 px-6 py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
              <p className="mt-3 text-muted-foreground">
                Powerful features to help you understand your documents faster.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-border/60 bg-card p-6 transition-colors hover:border-border hover:bg-muted/30"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-muted p-2.5">
                    <feature.icon className="size-5 text-foreground" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-t border-border/40 px-6 py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
              <p className="mt-3 text-muted-foreground">Start free, upgrade when you need more.</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-xl border p-8 ${
                    plan.highlighted
                      ? 'border-primary bg-card shadow-lg shadow-primary/5'
                      : 'border-border/60 bg-card'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                      Popular
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm">
                        <Check className="size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.ctaHref}
                    className={`mt-8 flex h-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">Built with Next.js, Supabase, and OpenAI</p>
          <a
            href="https://github.com/Docat0209/DocChat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Github className="size-4" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
