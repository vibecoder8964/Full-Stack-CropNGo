import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Phone, Mail, Leaf, CheckCircle2, XCircle, Tractor, Store, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// Roles removed from signup page to decouple from auth.

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a letter', ok: /[a-zA-Z]/.test(password) },
    { label: 'Contains a number', ok: /\d/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="flex flex-col gap-1 mt-1.5">
      {checks.map(c => (
        <div key={c.label} className={`flex items-center gap-1.5 text-xs font-body ${c.ok ? 'text-forest-600' : 'text-bark-400'}`}>
          {c.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {c.label}
        </div>
      ))}
    </div>
  )
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({ emailOrPhone: '', username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.emailOrPhone.trim()) e.emailOrPhone = 'Please enter your phone or Gmail.'
    if (form.username.trim().length < 2) e.username = 'Username must be at least 2 characters.'
    if (form.password.length < 8 || !/[a-zA-Z]/.test(form.password) || !/\d/.test(form.password))
      e.password = 'Password must be 8+ characters with at least 1 letter and 1 number.'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/onboarding')
    } catch (err) {
      console.error("Registration error:", err)
      const msg = err.message || ""
      if (msg.includes('Username')) {
        setErrors({ username: msg })
      } else if (msg.includes('contact') || msg.includes('registered') || msg.includes('Gmail') || msg.includes('Phone')) {
        setErrors({ emailOrPhone: msg })
      } else {
        setErrors({ general: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-cream-50 flex">
      {/* Left side (Image panel) */}
      <div className="hidden lg:flex w-1/2 bg-forest-600 relative flex-col items-center justify-center p-12 overflow-hidden shadow-2xl">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1595841696677-6489ff3f8cd1?q=80&w=2070&auto=format&fit=crop" alt="A farmer in field" className="object-cover w-full h-full opacity-60 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-900/80 to-transparent" />
          <div className="grain-overlay opacity-30" />
        </div>
        <div className="relative z-10 text-center max-w-lg mt-auto text-white">
          <h2 className="font-display font-bold text-4xl mb-4 drop-shadow-md">Join Malaysia's Premium Network.</h2>
          <p className="font-body text-cream-100 text-lg opacity-90 drop-shadow-sm">Connect, trade, and grow your agricultural business with the right people.</p>
        </div>
      </div>

      {/* Right side (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 w-fit">
            <div className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center shadow-md">
              <Leaf size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-bark-700">CropNGo</span>
          </Link>

          <div>
            <h1 className="font-display font-bold text-4xl text-bark-700 mb-2">Create an account.</h1>
            <p className="text-bark-500 font-body text-base mb-8">Join Malaysia's agricultural network today.</p>
          </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Contact */}
          <div>
            <label className="label">Phone Number or Gmail</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-300">
                {form.emailOrPhone.includes('@') ? <Mail size={16} /> : <Phone size={16} />}
              </div>
              <input
                id="signup-contact"
                type="text"
                value={form.emailOrPhone}
                onChange={e => set('emailOrPhone', e.target.value)}
                placeholder="+601X-XXXXXXX or email@gmail.com"
                className={`input-field pl-9 ${errors.emailOrPhone ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.emailOrPhone && <p className="text-xs text-red-500 mt-1 font-body">{errors.emailOrPhone}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="label">Username</label>
            <input
              id="signup-username"
              type="text"
              value={form.username}
              onChange={e => set('username', e.target.value.replace(/\s/g, '_').toLowerCase())}
              placeholder="e.g. amirul_farmer"
              className={`input-field ${errors.username ? 'border-red-400' : ''}`}
            />
            {errors.username && <p className="text-xs text-red-500 mt-1 font-body">{errors.username}</p>}
            {form.username.length >= 2 && !errors.username && (
              <p className="text-xs text-forest-600 mt-1 font-body flex items-center gap-1">
                <CheckCircle2 size={12} /> Looks good!
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 8 characters"
                className={`input-field pr-10 ${errors.password ? 'border-red-400' : ''}`}
              />
              <button type="button" onClick={() => setShowPw(x => !x)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-300 hover:text-bark-600 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
            {errors.password && !form.password && <p className="text-xs text-red-500 mt-1 font-body">{errors.password}</p>}
          </div>

          {/* Role selection is now handled in Onboarding */}

          <button
            id="signup-submit"
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-1 flex items-center justify-center gap-2"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm font-body text-bark-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-forest-600 font-semibold hover:underline">Log In</Link>
        </p>
        </div>
      </div>
    </div>
  )
}
