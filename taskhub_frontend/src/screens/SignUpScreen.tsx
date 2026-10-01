import { ArrowRight, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../components/AuthShell'
import { apiErrorMessage } from '../action/request'
import { useAuth } from '../context/useAuth'

export default function SignUpScreen() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
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
      await signUp(email, password)
      navigate('/', { replace: true })
    } catch (submitError) {
      setError(apiErrorMessage(submitError, 'We could not create your account. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      mode="signup"
      heading="Start with a clean slate."
      description="Create your account and bring the important work into focus."
    >
      <form className="auth-form" onSubmit={submit}>
        <label className="field-label" htmlFor="signup-email">Work email</label>
        <input
          id="signup-email"
          className="text-input"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label className="field-label" htmlFor="signup-password">Create password</label>
        <div className="password-input-wrap">
          <input
            id="signup-password"
            className="text-input"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            minLength={8}
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

        <p className="signup-note">New accounts start with a standard member role.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button auth-submit" type="submit" disabled={submitting}>
          {submitting ? <LoaderCircle className="spin" size={18} /> : <>Create account <ArrowRight size={17} /></>}
        </button>
      </form>
    </AuthShell>
  )
}