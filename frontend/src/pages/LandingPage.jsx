import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Sprout,
  ShoppingCart,
  Bot,
  MessageCircle,
  Star,
  Calendar,
  MapPin,
  Tractor,
  Store,
  Wrench,
  ArrowRight,
  Menu,
  X,
  UserPlus,
  LayoutDashboard,
  Globe,
  Share2,
  Hash,
  Link as LinkIcon
} from 'lucide-react'

// Placeholder images based on your description
import heroImg from '../assets/hero_banner.jpg'
import farmerImg from '../assets/farmer.jpg'
import supplierImg from '../assets/supplier.jpg'
const HERO_IMG = heroImg
const CTA_IMG = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2072&auto=format&fit=crop"

export default function LandingPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle reveal animations on scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible', 'reveal-visible')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    const elements = document.querySelectorAll('.reveal')
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80 // Offset for navbar
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-cream-50 font-body text-bark-700 selection:bg-forest-500 selection:text-white">

      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-[#F8F3E8] border-b border-cream-200 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-colors ${isScrolled ? 'bg-forest-500 text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
              <Sprout size={24} />
            </div>
            <span className={`font-display font-bold text-xl tracking-wide transition-colors ${isScrolled ? 'text-bark-700' : 'text-white drop-shadow-md'}`}>
              CropNGo
            </span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-3 text-sm font-semibold">
            {[
              { id: 'roles', label: 'Who We Serve' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'features', label: 'Features' }
            ].map((link) => (
              <button 
                key={link.id}
                onClick={() => scrollTo(link.id)} 
                className={`px-5 py-2 rounded-full transition-all duration-300 ${
                  isScrolled
                    ? 'border border-bark-400/20 text-bark-600 hover:bg-white/50 hover:border-bark-400/40'
                    : 'border border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className={`font-semibold text-sm transition-colors ${isScrolled ? 'text-bark-700 hover:text-forest-600' : 'text-white hover:text-white/80 drop-shadow-sm'}`}
            >
              Log In
            </button>
            <button
              onClick={() => { logout(); navigate('/signup'); }}
              className="bg-forest-500 hover:bg-forest-600 active:bg-forest-700 text-white font-semibold text-sm px-6 py-2.5 rounded-pill transition-all active:scale-95 shadow-sm"
            >
              Get Started Free
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className={`md:hidden p-2 -mr-2 transition-colors ${isScrolled ? 'text-bark-700' : 'text-white'}`}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white p-6 flex flex-col animate-fade-in">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-forest-500 text-white flex items-center justify-center rounded-2xl"><Sprout size={24} /></div>
              <span className="font-display font-bold text-xl text-bark-700">CropNGo</span>
            </div>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-bark-400"><X size={24} /></button>
          </div>
          <div className="flex flex-col gap-6 text-lg font-display font-semibold text-bark-700">
            <button onClick={() => scrollTo('roles')} className="text-left w-full py-2">Who We Serve</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-left w-full py-2">How It Works</button>
            <button onClick={() => scrollTo('features')} className="text-left w-full py-2">Features</button>
          </div>
          <div className="mt-auto flex flex-col gap-3 pb-8">
            <button onClick={() => { logout(); navigate('/login'); }} className="w-full py-3.5 border-2 border-cream-200 rounded-pill font-semibold text-bark-700">Log In</button>
            <button onClick={() => { logout(); navigate('/signup'); }} className="w-full py-3.5 bg-forest-500 text-white rounded-pill font-semibold">Get Started Free</button>
          </div>
        </div>
      )}

      {/* ── SECTION 1: HERO ───────────────────────────────────── */}
      <section className="relative min-h-[100dvh] pt-32 pb-20 flex flex-col items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-forest-900 border-none m-0 p-0">
          <div
            className="absolute inset-0 w-full h-full bg-cover bg-center animate-ken-burns border-none m-0 p-0"
            style={{ backgroundImage: `url(${HERO_IMG})` }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(20,40,25,0.55) 0%, rgba(20,40,25,0.3) 50%, rgba(20,40,25,0.65) 100%)' }} />
          <div className="grain-overlay" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center flex-1 w-full -mt-[6vh] pb-[6vh]">

          <h1
            className="font-display font-bold text-[3rem] sm:text-[4.5rem] md:text-[6rem] leading-[1.05] tracking-tight mb-6 drop-shadow-xl w-full text-[#FFFFFF]"
            style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            Grow Together.<br />
            <span>Connect Smarter.</span>
          </h1>

          <p
            className="text-lg md:text-xl font-body leading-relaxed mb-10 drop-shadow-md max-w-2xl"
            style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            CropNGo bridges Malaysian farmers, vendors, and suppliers — creating a seamless ecosystem to buy, sell, and manage your agricultural operations all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button onClick={() => { logout(); navigate('/signup'); }} className="bg-[#FFFFFF] text-[#2D6A4F] font-bold px-8 py-4 rounded-full transition-all hover:bg-cream-50 active:scale-[0.97] text-base shadow-xl flex items-center justify-center gap-2 group">
              Get Started Free <ArrowRight size={18} className="transition-transform group-hover:translate-x-1 text-[#2D6A4F]" />
            </button>
            <button onClick={() => scrollTo('roles')} className="bg-transparent hover:bg-white/10 backdrop-blur-sm border-[1.5px] border-white/70 text-white font-bold px-8 py-4 rounded-full transition-all text-base flex items-center justify-center active:scale-[0.97]" style={{ borderColor: 'rgba(255,255,255,0.7)' }}>
              Learn More
            </button>
          </div>

          <div className="mt-16 flex flex-col sm:flex-row items-center gap-4 text-sm text-white/80 font-body">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})` }}></div>
              ))}
            </div>
            <p>Trusted by <span className="font-bold text-white">2,000+</span> farmers, vendors & suppliers.</p>
          </div>
        </div>
      </section>
      <hr className="section-divider relative z-20 -mt-[2px] bg-white border-none py-1.5" />

      {/* ── SECTION 2: WHO IS THIS FOR? ───────────────────────── */}
      <section id="roles" className="py-24 bg-cream-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-bark-700 mb-5">Built for Everyone</h2>
            <p className="text-bark-500 font-body text-lg">Whether you are growing crops, sourcing fresh produce, or supplying the tools to make it happen, CropNGo is built for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Tractor size={32} className="text-[#2D6A4F]" />,
                title: 'Farmers',
                desc: 'List your crops, find vendors to sell to, and get AI-powered farming advice tailored to your specific land and climate.',
                bg: 'bg-[#F0FFF4]',
                border: 'border-[#95D5B2]/30',
                link: 'text-[#2D6A4F] hover:text-forest-700',
                img: farmerImg
              },
              {
                icon: <Store size={32} className="text-[#2563EB]" />,
                title: 'Vendors',
                desc: 'Discover local farmers selling the exact crops you need, connect directly, and consistently grow your supply chain.',
                bg: 'bg-blue-50',
                border: 'border-blue-200/50',
                link: 'text-[#2563EB] hover:text-blue-700',
                img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop'
              },
              {
                icon: <Wrench size={32} className="text-[#EA580C]" />,
                title: 'Suppliers',
                desc: 'Reach farmers actively looking for tools and equipment. Showcase your products exactly where your target audience is.',
                bg: 'bg-orange-50',
                border: 'border-orange-200/50',
                link: 'text-[#EA580C] hover:text-orange-700',
                img: supplierImg
              }
            ].map((role, i) => (
              <div key={i} className="card p-0 flex flex-col group h-full relative overflow-hidden bg-white reveal" style={{ transitionDelay: `${i * 150}ms`, animationDelay: `${i * 150}ms` }}>

                {/* Background Image Container */}
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${role.img})`, transition: 'transform 0.6s ease' }}
                  />
                  {/* Hover effect triggers via CSS class coupling */}
                  <style>{`.group:hover .bg-cover { transform: scale(1.03); }`}</style>
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.4) 100%)' }}
                  />
                </div>

                <div className={`h-2 ${role.bg} ${role.border} border-b w-full relative z-10`} />
                <div className="p-8 flex flex-col flex-1 relative z-10">
                  <div className={`w-16 h-16 rounded-2xl ${role.bg} flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm border border-black/5`}>
                    {role.icon}
                  </div>
                  <h3 className="font-display font-bold text-3xl text-bark-700 mb-3">{role.title}</h3>
                  <p className="text-bark-500 font-body leading-relaxed flex-1 mb-8">{role.desc}</p>
                  <div className={`font-bold flex items-center gap-1.5 ${role.link} cursor-pointer w-fit px-4 py-2 bg-cream-50 rounded-full border border-cream-200 group-hover:border-current transition-colors`}>
                    Learn More <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <hr className="section-divider" />

      {/* ── SECTION 3: HOW IT WORKS ───────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 reveal">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-bark-700 mb-5">Get Connected in 3 Simple Steps</h2>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[44px] left-24 right-24 h-[2px] border-b-2 border-dashed border-cream-200 -z-10"></div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              {[
                { icon: <UserPlus size={32} />, title: "Create Your Account", desc: "Sign up and select your role as a Farmer, Vendor, or Supplier." },
                { icon: <LayoutDashboard size={32} />, title: "Build Your Profile", desc: "Tell the community about your crops, products, or the tools you offer." },
                { icon: <Globe size={32} />, title: "Connect & Grow", desc: "Browse the marketplace, chat with partners, and use AI to scale faster." }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center relative z-10 reveal" style={{ transitionDelay: `${i * 200}ms`, animationDelay: `${i * 200}ms` }}>
                  <div className="w-[88px] h-[88px] bg-white border-4 border-cream-100 shadow-md rounded-full flex items-center justify-center text-forest-500 mb-6 relative">
                    {step.icon}
                    <div className="absolute -top-1 -right-1 w-8 h-8 bg-forest-600 text-white rounded-full flex items-center justify-center text-sm font-bold font-display shadow-sm">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-2xl text-bark-700 mb-3">{step.title}</h3>
                  <p className="text-bark-500 font-body leading-relaxed max-w-[280px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <hr className="section-divider" />

      {/* ── SECTION 4: FEATURES HIGHLIGHT ─────────────────────── */}
      <section id="features" className="py-24 bg-cream-100 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
            <h2 className="font-display font-bold text-4xl md:text-5xl text-bark-700 mb-5">Everything You Need</h2>
            <p className="text-bark-500 font-body text-lg">Purpose-built tools to help the Malaysian agriculture sector thrive in the digital age.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

            {/* 1. Smart Marketplace (Wide) */}
            <div className="md:col-span-2 lg:col-span-2 rounded-[2rem] p-8 flex flex-col bg-[#1e3a2a] text-[#F8F3E8] hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl border border-black/10 relative overflow-hidden group reveal" style={{ transitionDelay: '0ms', animationDelay: '0ms' }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-forest-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <span className="text-xs font-bold tracking-widest uppercase opacity-60 mb-8 block font-body relative z-10">Marketplace</span>
              <h3 className="font-display font-bold text-3xl mb-4 relative z-10">Smart Marketplace</h3>
              <p className="font-body leading-relaxed opacity-80 max-w-sm mb-12 flex-1 relative z-10">Browse crops, tools, and equipment meticulously structured and filtered by category, distance, and ratings.</p>
              <div className="mt-auto flex flex-wrap gap-2 relative z-10">
                {['Crops', 'Tractors', 'Fertilisers', 'Seeds', 'Sprinklers'].map(tag => (
                  <span key={tag} className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 border border-white/5 uppercase tracking-wide backdrop-blur-sm">{tag}</span>
                ))}
              </div>
            </div>

            {/* 2. AI-Powered Insights */}
            <div className="col-span-1 rounded-[2rem] p-8 flex flex-col bg-[#FAF7F2] text-bark-900 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg border border-black/5 relative overflow-hidden group reveal" style={{ transitionDelay: '150ms', animationDelay: '150ms' }}>
              <span className="text-xs font-bold tracking-widest uppercase opacity-40 mb-8 block font-body relative z-10">Intelligence</span>
              <h3 className="font-display font-bold text-3xl mb-4 relative z-10">AI-Powered Insights</h3>
              <p className="font-body leading-relaxed text-bark-500 mb-8 flex-1 relative z-10">Get farm suitability predictions and personalised recommendations based on your land and crops.</p>
              <div className="mt-auto w-14 h-14 rounded-2xl bg-white shadow-sm border border-cream-100 flex items-center justify-center text-forest-600 transition-transform group-hover:scale-110 relative z-10">
                <Bot size={24} />
              </div>
            </div>

            {/* 3. Direct Messaging */}
            <div className="col-span-1 rounded-[2rem] p-8 flex flex-col bg-[#eef4ff] text-bark-900 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg border border-blue-900/5 relative overflow-hidden group reveal" style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
              <span className="text-xs font-bold tracking-widest uppercase text-blue-900/40 mb-8 block font-body relative z-10">Communication</span>
              <h3 className="font-display font-bold text-3xl mb-4 relative z-10">Direct Messaging</h3>
              <p className="font-body leading-relaxed text-bark-600 mb-8 flex-1 relative z-10">Chat instantly with any farmer, vendor, or supplier directly within the platform securely.</p>
              <div className="mt-auto w-14 h-14 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center text-blue-500 transition-transform group-hover:scale-110 relative z-10">
                <MessageCircle size={24} />
              </div>
            </div>

            {/* 4. Verified Reviews */}
            <div className="col-span-1 rounded-[2rem] p-8 flex flex-col bg-white text-bark-900 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg border border-black/5 relative overflow-hidden group reveal" style={{ transitionDelay: '0ms', animationDelay: '0ms' }}>
              <span className="text-xs font-bold tracking-widest uppercase opacity-30 mb-8 block font-body relative z-10">Trust</span>
              <h3 className="font-display font-bold text-3xl mb-4 relative z-10">Verified Reviews</h3>
              <p className="font-body leading-relaxed text-bark-500 mb-6 flex-1 relative z-10">Build reputation and trust through real community ratings and written reviews from active partners.</p>
              <div className="mt-auto flex items-start gap-1 relative z-10 transition-transform group-hover:scale-105 origin-left">
                <span className="text-7xl font-display font-bold text-bark-800 tracking-tight leading-none">4.9</span>
                <span className="text-4xl text-amber-400 mt-1 drop-shadow-sm">★</span>
              </div>
            </div>

            {/* 5. Location-Based Matching (Wide) */}
            <div className="md:col-span-2 lg:col-span-2 rounded-[2rem] p-8 flex flex-col bg-[#2c4a6e] text-white hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl border border-black/10 relative overflow-hidden group reveal" style={{ transitionDelay: '150ms', animationDelay: '150ms' }}>
              <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl -mr-20 -mb-20 transition-transform group-hover:scale-110"></div>
              <span className="text-xs font-bold tracking-widest uppercase opacity-60 mb-8 block font-body relative z-10">Logistics</span>
              <h3 className="font-display font-bold text-3xl mb-4 relative z-10">Location-Based Matching</h3>
              <p className="font-body leading-relaxed text-blue-100 max-w-sm mb-12 flex-1 relative z-10">Find partners and resources strictly near you using intelligent geographic distance filtering.</p>
              <div className="mt-auto flex flex-wrap gap-2 relative z-10">
                {['< 5km', '< 10km', '< 25km', '< 50km', 'Nationwide'].map(tag => (
                  <span key={tag} className="px-4 py-2 rounded-full text-xs font-bold bg-white/10 border border-white/5 text-blue-50 uppercase tracking-wide backdrop-blur-sm">{tag}</span>
                ))}
              </div>
            </div>

            {/* 6. Agricultural Events */}
            <div className="col-span-1 rounded-[2rem] p-8 flex flex-col bg-[#e6f4ea] text-bark-900 hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-lg border border-forest-900/5 relative overflow-hidden group reveal" style={{ transitionDelay: '300ms', animationDelay: '300ms' }}>
              <span className="text-xs font-bold tracking-widest uppercase text-forest-900/40 mb-8 block font-body relative z-10">Community</span>
              <h3 className="font-display font-bold text-3xl mb-4 relative z-10">Agricultural Events</h3>
              <p className="font-body leading-relaxed text-bark-600 mb-8 flex-1 relative z-10">Stay entirely updated on industry events, workshops, courses, and expos happening nationwide.</p>
              <div className="mt-auto w-14 h-14 rounded-2xl bg-white shadow-sm border border-forest-100 flex items-center justify-center text-forest-500 transition-transform group-hover:scale-110 relative z-10">
                <Calendar size={24} />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 5: STATS BANNER ───────────────────────────── */}
      <section className="relative overflow-hidden bg-forest-600 py-24 text-white text-center">
        <div className="grain-overlay" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative z-20">
          {[
            { metric: "2,000+", label: "Registered Users" },
            { metric: "3", label: "Roles Connected" },
            { metric: "500+", label: "Active Listings" },
            { metric: "50+", label: "Agricultural Events" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-2 items-center reveal" style={{ transitionDelay: `${i * 150}ms`, animationDelay: `${i * 150}ms` }}>
              <span className="font-display font-bold text-5xl lg:text-6xl text-cream-100 tracking-tight drop-shadow-sm">{stat.metric}</span>
              <span className="font-body text-white font-bold tracking-widest uppercase text-sm">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 6: CTA BANNER ─────────────────────────────── */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img src={CTA_IMG} alt="Agricultural farm" className="object-cover w-full h-full transform scale-105" />
          <div className="absolute inset-0 bg-bark-900/50 mix-blend-multiply"></div>
          <div className="grain-overlay" />
        </div>

        <div className="relative z-20 max-w-3xl mx-auto px-6 text-white reveal">
          <h2 className="font-display font-bold text-5xl md:text-6xl mb-6 leading-tight drop-shadow-xl text-white">
            Ready to grow your<br />agricultural network?
          </h2>
          <p className="font-body text-xl text-white/95 mb-10 max-w-xl mx-auto drop-shadow-md font-medium">
            Join thousands of Malaysian farmers, vendors, and suppliers on CropNGo today. Registration is completely free.
          </p>
          <button onClick={() => { logout(); navigate('/signup'); }} className="btn-primary px-10 py-5 text-lg shadow-2xl">
            Join the Network
          </button>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-cream-100 pt-16 pb-8 border-t border-cream-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

            {/* Brand Col */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <div className="w-8 h-8 rounded-xl bg-forest-600 text-white flex items-center justify-center">
                  <Sprout size={18} />
                </div>
                <span className="font-display font-bold text-xl text-bark-700">CropNGo</span>
              </div>
              <p className="text-bark-500 text-sm font-body leading-relaxed mb-6">
                Bridging the gap between everyone in the Malaysian agricultural ecosystem.
              </p>
              <div className="flex gap-4 text-bark-400">
                {/* Facebook */}
                <a href="https://www.facebook.com/cropngoxx" target="_blank" rel="noopener noreferrer" className="hover:text-forest-600 transition-colors" aria-label="Facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a href="https://www.instagram.com/cropngoxx" target="_blank" rel="noopener noreferrer" className="hover:text-forest-600 transition-colors" aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a href="http://wa.me/+60125545562" target="_blank" rel="noopener noreferrer" className="hover:text-forest-600 transition-colors" aria-label="WhatsApp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.996 0A12 12 0 1024 12 12.013 12.013 0 0011.996 0zm6.91 17.37c-.287.82-1.423 1.543-2.185 1.637-.624.08-1.433.205-4.148-.91-3.23-1.328-5.328-4.61-5.49-4.83-.16-.22-1.31-1.745-1.31-3.326 0-1.58.826-2.36 1.12-2.67.286-.307.632-.387.842-.387.21 0 .42.003.606.012.203.01.472-.078.736.56.28.67 1.056 2.585 1.144 2.766.088.18.148.397.028.64-.12.24-.18.388-.358.598-.18.21-.375.45-.53.585-.166.143-.34.303-.146.638.194.336.866 1.433 1.865 2.327 1.288 1.153 2.364 1.503 2.696 1.65.334.148.532.128.733-.105.203-.23.866-1.008 1.1-1.353.232-.345.463-.287.765-.174.302.112 1.91.902 2.238 1.062.328.16.547.24.626.375.08.136.08.784-.207 1.603z" />
                  </svg>
                </a>
                {/* X */}
                <a href="https://x.com/cropngoxx" target="_blank" rel="noopener noreferrer" className="hover:text-forest-600 transition-colors" aria-label="X">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Explore Col */}
            <div>
              <h4 className="font-display font-bold text-bark-700 mb-4">Explore</h4>
              <ul className="flex flex-col gap-3 text-sm text-bark-500 font-body">
                <li><button onClick={() => scrollTo('roles')} className="hover:text-forest-600 transition-colors">Who We Serve</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-forest-600 transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollTo('features')} className="hover:text-forest-600 transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('events')} className="hover:text-forest-600 transition-colors">Events</button></li>
              </ul>
            </div>

            {/* Company Col */}
            <div>
              <h4 className="font-display font-bold text-bark-700 mb-4">Company</h4>
              <ul className="flex flex-col gap-3 text-sm text-bark-500 font-body">
                <li><a href="#" className="hover:text-forest-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-forest-600 transition-colors">Contact Us</a></li>
              </ul>
            </div>

            {/* Legal Col */}
            <div>
              <h4 className="font-display font-bold text-bark-700 mb-4">Legal</h4>
              <ul className="flex flex-col gap-3 text-sm text-bark-500 font-body">
                <li><button onClick={() => { navigate('/privacy'); window.scrollTo(0, 0); }} className="hover:text-forest-600 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => { navigate('/terms'); window.scrollTo(0, 0); }} className="hover:text-forest-600 transition-colors">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-cream-200 flex justify-center items-center gap-4 text-sm text-bark-400 font-body">
            <p className="text-center w-full">© 2025 CropNGo. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
