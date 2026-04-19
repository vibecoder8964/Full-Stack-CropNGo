import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Leaf } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ usernameOrContact: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.usernameOrContact || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(form)
      navigate('/app/profile')
    } catch (e) {
      setError(e.message || "Invalid credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-cream-50 flex">
      {/* Left side (Image panel, hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-forest-600 relative flex-col justify-end p-12 overflow-hidden shadow-2xl">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80" alt="Golden hour farm field" className="object-cover w-full h-full" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,30,15,0.85) 0%, rgba(10,30,15,0.3) 60%, rgba(10,30,15,0.15) 100%)' }} />
        </div>
        <div className="relative z-10 text-left w-full max-w-xl text-white">
          <h2 className="font-display font-bold text-4xl mb-4 drop-shadow-md">Connect with Malaysia's Agricultural Future.</h2>
          <p className="font-body text-cream-100 text-lg opacity-90 drop-shadow-sm">Join the network trusted by thousands of farmers, vendors and suppliers.</p>
        </div>
      </div>

      {/* Right side (Form) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 w-fit">
            <div className="w-10 h-10 bg-forest-600 rounded-xl flex items-center justify-center shadow-md">
              <Leaf size={22} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-bark-700">CropNGo</span>
          </Link>

          <div>
            <h1 className="font-display font-bold text-4xl text-bark-700 mb-2">Welcome back.</h1>
            <p className="text-bark-500 font-body text-base mb-8">Log in to your CropNGo account.</p>
          </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-body px-4 py-2.5 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Phone, Gmail, or Username</label>
            <input
              id="login-contact"
              type="text"
              value={form.usernameOrContact}
              onChange={e => setForm(f => ({ ...f, usernameOrContact: e.target.value }))}
              placeholder="+601X or email or username"
              className="w-full bg-[#F8F6F1] border border-[#E0D9CC] rounded-xl px-4 py-3 text-bark-700 placeholder-bark-300 font-body focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 focus:outline-none transition-all duration-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Password</label>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full bg-[#F8F6F1] border border-[#E0D9CC] rounded-xl px-4 py-3 pr-10 text-bark-700 placeholder-bark-300 font-body focus:border-[#2D6A4F] focus:ring-[3px] focus:ring-[#2D6A4F]/15 focus:outline-none transition-all duration-200"
              />
              <button type="button" onClick={() => setShowPw(x => !x)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-300 hover:text-bark-600 transition-colors">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 mt-4 bg-forest-600 hover:bg-[#1e4d38] active:bg-[#153828] text-white font-body font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-md hover:-translate-y-0.5"
          >
            {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm font-body text-bark-400 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-forest-600 font-bold hover:underline">Sign Up</Link>
        </p>
        </div>
      </div>
    </div>
  )
}
