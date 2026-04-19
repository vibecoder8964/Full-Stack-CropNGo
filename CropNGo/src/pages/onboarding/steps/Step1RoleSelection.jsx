import { Tractor, Store, Wrench } from 'lucide-react'

const ROLES = [
  { id: 'Farmer',   icon: <Tractor size={32} className="text-forest-600" />, title: 'Farmer',   desc: 'I grow crops and manage a plantation' },
  { id: 'Vendor',   icon: <Store size={32} className="text-blue-600" />, title: 'Vendor',   desc: 'I buy crops from farmers to sell' },
  { id: 'Supplier', icon: <Wrench size={32} className="text-amber-600" />, title: 'Supplier', desc: 'I supply tools and equipment to farmers' },
]

export default function Step1RoleSelection({ data, onChange, next }) {
  const handleSelect = (roleId) => {
    onChange({ role: roleId })
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in py-4">
      <div className="text-center mb-2 flex flex-col items-center">
        <h2 className="font-display font-bold text-3xl text-bark-700 mb-2">What best describes you?</h2>
        <p className="text-base text-bark-500 font-body">
          Select your primary role to customize your experience in CropNGo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROLES.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => handleSelect(r.id)}
            className={`flex flex-col items-center justify-start p-6 rounded-2xl border-2 transition-all duration-300 text-center
              ${data.role === r.id ? 'border-forest-500 bg-forest-50 shadow-sm ring-4 ring-forest-500/10' : 'border-cream-200 bg-white hover:border-cream-300 hover:shadow-md hover:-translate-y-1'}`}
          >
            <div className={`p-4 rounded-[20px] mb-5 inline-flex shadow-sm border ${
              r.id === 'Farmer' ? 'bg-[#F0FFF4] border-[#2D6A4F]/20' : 
              r.id === 'Vendor' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
            }`}>
              {r.icon}
            </div>
            <span className="block font-display font-bold text-xl text-bark-700 mb-2">{r.title}</span>
            <span className="block text-sm font-body text-bark-500 leading-relaxed">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
