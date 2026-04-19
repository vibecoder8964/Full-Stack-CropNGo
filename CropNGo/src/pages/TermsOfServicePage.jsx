import { Sprout, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfServicePage() {
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
        <h1 className="font-display font-bold text-4xl md:text-5xl text-bark-700 mb-6 drop-shadow-sm">Terms of Service</h1>
        <p className="text-bark-400 mb-10 font-bold uppercase tracking-widest text-sm">Last Updated: April 2026</p>
        
        <div className="prose prose-forest max-w-none text-bark-600 leading-relaxed text-lg space-y-8">
          <p>
            Welcome to CropNGo! By accessing or using our platform, you agree to comply with and be bound by the following Terms of Service.
          </p>
          
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">1. Acceptance of Terms</h2>
            <p>By registering for and using CropNGo, you acknowledge that you have read, understood, and agree to follow these Terms. If you do not agree, please do not use our services.</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">2. User Conduct</h2>
            <p>Users are expected to communicate respectfully. Harassment, fraud, and misrepresentation of agricultural products or services are strictly prohibited and will result in account termination.</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">3. Marketplace Transactions</h2>
            <p>CropNGo facilitates connections but is not a party to the transactions between Farmers, Vendors, and Suppliers. We do not guarantee the quality, safety, or legality of items listed.</p>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold font-display text-bark-700 mb-4">4. Modifications</h2>
            <p>We reserve the right to modify these Terms at any time. Continued use of the platform after any changes indicates your acceptance of the new Terms.</p>
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
