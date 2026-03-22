import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LandingPage from './page'

describe('LandingPage', () => {
  it('renders the hero heading', () => {
    render(<LandingPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chat with your')
    expect(screen.getByText('documents')).toBeInTheDocument()
  })

  it('renders at least 3 feature cards', () => {
    render(<LandingPage />)

    expect(screen.getByText('Upload Any Document')).toBeInTheDocument()
    expect(screen.getByText('AI-Powered Answers')).toBeInTheDocument()
    expect(screen.getByText('Source Citations')).toBeInTheDocument()
    expect(screen.getByText('Chat History')).toBeInTheDocument()
  })

  it('renders Free and Pro pricing cards', () => {
    render(<LandingPage />)

    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('$9')).toBeInTheDocument()
  })

  it('renders CTA links to /signup', () => {
    render(<LandingPage />)

    const signupLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/signup')

    // Hero CTA + nav CTA + two pricing CTAs = at least 4
    expect(signupLinks.length).toBeGreaterThanOrEqual(4)
  })

  it('renders login link in navigation', () => {
    render(<LandingPage />)

    const loginLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/login')

    expect(loginLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the footer text', () => {
    render(<LandingPage />)

    expect(screen.getByText('Built with Next.js, Supabase, and OpenAI')).toBeInTheDocument()
  })

  it('renders the GitHub link in footer', () => {
    render(<LandingPage />)

    const githubLink = screen.getByRole('link', { name: /github/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com')
    expect(githubLink).toHaveAttribute('target', '_blank')
  })
})
