import { Sprout, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-cream-50 font-body text-bark-700 selection:bg-forest-500 selection:text-white">
      <nav className="bg-[#F8F3E8] border-b border-cream-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 flex items-center justify-center rounded-2xl bg-forest-500 text-white">
              <Sprout size={24} />
            </div>
            <span className="font-display font-bold text-xl tracking-wide text-bark-700">
              CropNGo
            </span>
          </div>
          <button onClick={() => navigate(-1)} className="text-bark-500 hover:text-forest-600 flex gap-2 items-center font-bold transition-colors">
            <ArrowLeft size={18} /> Back
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="font-display font-bold text-4xl md:text-5xl text-bark-700 mb-6 drop-shadow-sm">Privacy Policy</h1>
        <p className="text-bark-400 mb-10 font-bold uppercase tracking-widest text-sm">Last Updated: April 2026</p>
        
        <div className="prose prose-forest max-w-none text-bark-600 leading-relaxed text-lg space-y-8">
          <p>
            At CropNGo, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal data when you use our platform designed for the Malaysian agricultural sector.
          </p>
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">1. Information We Collect</h2>
            <p>We may collect personal information such as your name, email address, phone number, location, and role (Farmer, Vendor, Supplier) when you create an account to use CropNGo.</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">2. How We Use Your Information</h2>
            <p>The information we collect is used to provide matchmaking services, operate our Marketplace, power AI-driven insights, and enable direct chat functionalities securely.</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">3. Data Sharing and Protection</h2>
            <p>We do not sell your personal data to third parties. Your data is stored securely and only shared with other users on the platform when you engage in transactions or communications.</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">4. Contact Us</h2>
            <p>If you have any questions or concerns about this policy, please contact our support team at support@cropngo.com.my.</p>
          </div>
        </div>
      </main>
      
      <footer className="bg-cream-100 pt-12 pb-8 border-t border-cream-200 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center gap-4 text-sm text-bark-400 font-body">
            <p className="text-center w-full">© 2025 CropNGo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
