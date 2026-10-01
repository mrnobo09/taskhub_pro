import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { apiErrorMessage } from '../action/request'
import { useAuth } from '../context/useAuth'

export default function SignInScreen() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
      navigate(from ?? '/', { replace: true })
    } catch (submitError) {
      setError(apiErrorMessage(submitError, 'We could not sign you in. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      mode="signin"
      heading="Good work starts here."
      description="Sign in to pick up right where your team left off."
    >
      <form className="auth-form" onSubmit={submit}>
        <label className="field-label" htmlFor="signin-email">Email address</label>
        <input
          id="signin-email"
          className="text-input"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <div className="field-label-row">
          <label className="field-label" htmlFor="signin-password">Password</label>
        </div>
        <div className="password-input-wrap">
          <input
            id="signin-password"
            className="text-input"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="password-toggle"
            type="button"
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={18} /> : <>Sign in <ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthShell>
  )
}