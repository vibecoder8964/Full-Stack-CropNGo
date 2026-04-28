import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import TopNav from './components/TopNav'
import BottomNav from './components/BottomNav'

import LandingPage        from './pages/LandingPage'
import PrivacyPolicyPage  from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import SignUpPage         from './pages/auth/SignUpPage'
import LoginPage          from './pages/auth/LoginPage'
import OnboardingWizard   from './pages/onboarding/OnboardingWizard'
import ProfilePage        from './pages/app/ProfilePage'
import ShopPage           from './pages/app/ShopPage'
import ProductDetailPage  from './pages/app/ProductDetailPage'
import ProductKeywordPage from './pages/app/ProductKeywordPage'
import ChatPage           from './pages/app/ChatPage'
import EventsPage         from './pages/app/EventsPage'
import AIPage             from './pages/app/AIPage'

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-cream-100 md:pt-20">
      <TopNav />
      {children}
      <BottomNav />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireOnboarding({ children }) {
  const { user, isOnboarded } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!isOnboarded) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  const { user, isOnboarded } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/"       element={<LandingPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms"   element={<TermsOfServicePage />} />
      <Route path="/signup" element={user ? <Navigate to={isOnboarded ? '/app/profile' : '/onboarding'} replace /> : <SignUpPage />} />
      <Route path="/login"  element={user ? <Navigate to="/app/profile" replace /> : <LoginPage />} />

      {/* Onboarding */}
      <Route path="/onboarding" element={
        <RequireAuth>
          <OnboardingWizard />
        </RequireAuth>
      } />

      {/* Main App */}
      <Route path="/app/profile"    element={<RequireOnboarding><AppShell><ProfilePage /></AppShell></RequireOnboarding>} />
      <Route path="/app/profile/:id" element={<RequireOnboarding><AppShell><ProfilePage /></AppShell></RequireOnboarding>} />
      <Route path="/app/shop"       element={<RequireOnboarding><AppShell><ShopPage /></AppShell></RequireOnboarding>} />
      <Route path="/app/shop/:id"   element={<RequireOnboarding><AppShell><ProductDetailPage /></AppShell></RequireOnboarding>} />
      <Route path="/app/shop/product/:keyword" element={<AppShell><ProductKeywordPage /></AppShell>} />
      <Route path="/app/chat"       element={<RequireOnboarding><AppShell><ChatPage /></AppShell></RequireOnboarding>} />
      <Route path="/app/events"     element={<RequireOnboarding><AppShell><EventsPage /></AppShell></RequireOnboarding>} />
      <Route path="/app/ai"         element={<RequireOnboarding><AppShell><AIPage /></AppShell></RequireOnboarding>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
