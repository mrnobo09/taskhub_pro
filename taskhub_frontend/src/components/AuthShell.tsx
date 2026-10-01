import { ArrowUpRight, Check } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthShellProps {
  mode: 'signin' | 'signup'
  heading: string
  description: string
  children: ReactNode
}

export default function AuthShell({ mode, heading, description, children }: AuthShellProps) {
  return (
    <main className="auth-page">
      <section className="auth-form-side">
        <Link className="brand-lockup" to="/signin" aria-label="TaskHub home">
          <span className="brand-glyph">t</span>
          <span>taskhub</span>
        </Link>

        <div className="auth-form-wrap">
          <p className="eyebrow">{mode === 'signin' ? 'YOUR WORKSPACE AWAITS' : 'START WITH A CLEAR BOARD'}</p>
          <h1>{heading}</h1>
          <p className="auth-description">{description}</p>
          {children}
          <p className="auth-switch">
            {mode === 'signin' ? 'New to TaskHub?' : 'Already have an account?'}{' '}
            <Link to={mode === 'signin' ? '/signup' : '/signin'}>
              {mode === 'signin' ? 'Create an account' : 'Sign in'}
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </p>
        </div>

        <p className="auth-footnote">© 2026 TaskHub · Make room for the work that matters.</p>
      </section>

      <aside className="auth-story" aria-label="TaskHub workspace preview">
        <div className="story-topline">
          <span className="live-dot" />
          A calmer way to move work forward
        </div>
        <div className="story-copy">
          <span className="story-index">01 / FOCUS</span>
          <p>Make the next right thing<br />easy to see.</p>
          <span className="story-rule" />
          <span className="story-caption">A shared home for plans, progress, and the small wins in between.</span>
        </div>
        <div className="story-board" aria-hidden="true">
          <div className="story-board-head">
            <span>THIS WEEK</span>
            <span className="story-board-count">03</span>
          </div>
          <div className="story-task">
            <span className="story-check"><Check size={13} /></span>
            <span>Shape the launch brief</span>
            <i className="task-priority priority-high" />
          </div>
          <div className="story-task">
            <span className="story-check story-check-open" />
            <span>Review onboarding flow</span>
            <i className="task-priority priority-medium" />
          </div>
          <div className="story-task story-task-muted">
            <span className="story-check story-check-open" />
            <span>Share the Friday update</span>
            <i className="task-priority priority-low" />
          </div>
          <div className="story-board-footer"><span>3 tasks in motion</span><span>↗</span></div>
        </div>
        <span className="story-orbit story-orbit-one" />
        <span className="story-orbit story-orbit-two" />
      </aside>
    </main>
  )
}