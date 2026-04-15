import TagInput from '../../../components/TagInput'
import ImageUploader from '../../../components/ImageUploader'
import { PREDEFINED_CROPS, PREDEFINED_TOOLS } from '../../../data/mockAI'
import { Tractor, Sprout, Store, Wrench, MapPin } from 'lucide-react'

const FARMER_TYPES = [
  {
    id: 'new',
    icon: <Sprout size={28} className="text-forest-600" />,
    title: 'New Farmer',
    desc: 'Just starting out — I need tools and supplier recommendations.',
  },
  {
    id: 'existing',
    icon: <Tractor size={28} className="text-forest-600" />,
    title: 'Existing Farmer',
    desc: 'Already farming — I want to connect with vendors and buyers.',
  },
]

export default function Step2RoleContext({ data, onChange }) {
  const currentRole = data.role

  // ── FARMER ─────────────────────────────────────────────────────────────────
  if (currentRole === 'Farmer') {
    return (
      <div className="flex flex-col gap-8 animate-fade-in py-2">
        <div className="text-center mb-2 flex flex-col items-center">
          <div className="bg-forest-100 p-4 rounded-[20px] mb-4 inline-flex shadow-sm border border-forest-200"><Tractor size={32} className="text-forest-600" /></div>
          <h2 className="font-display font-bold text-3xl text-bark-700">Tell us about your farm</h2>
        </div>

        {/* New vs Existing */}
        <div>
          <label className="label">Are you a new or existing farmer?</label>
          <div className="grid grid-cols-2 gap-3">
            {FARMER_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                id={`farmer-type-${t.id}`}
                onClick={() => onChange({ farmerType: t.id })}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 text-center transition-all duration-200
                  ${data.farmerType === t.id
                    ? 'border-forest-500 bg-forest-50'
                    : 'border-cream-200 bg-white hover:border-cream-300'}`}
              >
                <div className="mb-1">{t.icon}</div>
                <span className={`text-sm font-body font-bold ${data.farmerType === t.id ? 'text-forest-700' : 'text-bark-600'}`}>{t.title}</span>
                <span className="text-xs text-bark-400 font-body leading-tight">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Crops */}
        <TagInput
          label="Types of crop you grow"
          options={PREDEFINED_CROPS}
          selected={data.crops ?? []}
          onChange={crops => onChange({ crops })}
          placeholder="Search crops..."
          allowOther
        />

        {/* Place of Cultivation */}
        <div>
          <label className="label">Place of cultivation</label>
          <input
            type="text"
            value={data.placeOfCultivation ?? ''}
            onChange={e => onChange({ placeOfCultivation: e.target.value })}
            placeholder="e.g. Sg. Petani, Kedah"
            className="input-field"
          />
        </div>

        {/* Land Size */}
        <div>
          <label className="label">Land size</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={data.landSize ?? ''}
              onChange={e => onChange({ landSize: e.target.value })}
              placeholder="e.g. 8"
              className="input-field flex-1"
            />
            <select
              value={data.landUnit ?? 'acres'}
              onChange={e => onChange({ landUnit: e.target.value })}
              className="input-field w-32"
            >
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
        </div>

        {/* Tools */}
        <TagInput
          label="Tools / Equipment available"
          options={PREDEFINED_TOOLS}
          selected={data.toolsAvailable ?? []}
          onChange={toolsAvailable => onChange({ toolsAvailable })}
          placeholder="Search tools..."
          allowOther
        />

        {/* Soil photo */}
        <div>
          <label className="label">Soil quality photo <span className="text-bark-300 font-normal">(optional)</span></label>
          <ImageUploader
            value={data.soilPhoto}
            onChange={soilPhoto => onChange({ soilPhoto })}
            shape="rect"
            label="Upload a photo of your soil (optional)"
          />
        </div>
      </div>
    )
  }

  // ── VENDOR ─────────────────────────────────────────────────────────────────
  if (currentRole === 'Vendor') {
    return (
      <div className="flex flex-col gap-8 animate-fade-in py-2">
        <div className="text-center mb-2 flex flex-col items-center">
          <div className="bg-blue-100 p-4 rounded-[20px] mb-4 inline-flex shadow-sm border border-blue-200"><Store size={32} className="text-blue-600" /></div>
          <h2 className="font-display font-bold text-3xl text-bark-700 mb-2">What are you looking to buy?</h2>
          <p className="text-base text-bark-500 font-body">This helps farmers understand your needs.</p>
        </div>
        <TagInput
          label="Types of crops you're looking to buy"
          options={PREDEFINED_CROPS}
          selected={data.cropsWanted ?? []}
          onChange={cropsWanted => onChange({ cropsWanted })}
          placeholder="Search crops..."
          allowOther
        />

        {/* Location */}
        <div>
          <label className="label">Your location</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-300" />
            <input
              type="text"
              value={data.location ?? ''}
              onChange={e => onChange({ location: e.target.value })}
              placeholder="e.g. Georgetown, Penang"
              className="input-field pl-9"
            />
          </div>
          <p className="text-xs text-bark-400 font-body mt-1.5 flex items-center gap-1">
            <span className="text-amber-500">⚠️</span>
            Google Maps autocomplete will be enabled once API key is provided.
          </p>
        </div>
      </div>
    )
  }

  // ── SUPPLIER ───────────────────────────────────────────────────────────────
  if (currentRole === 'Supplier') {
    return (
      <div className="flex flex-col gap-8 animate-fade-in py-2">
        <div className="text-center mb-2 flex flex-col items-center">
          <div className="bg-orange-100 p-4 rounded-[20px] mb-4 inline-flex shadow-sm border border-orange-200"><Wrench size={32} className="text-[#EA580C]" /></div>
          <h2 className="font-display font-bold text-3xl text-bark-700 mb-2">What do you supply?</h2>
          <p className="text-base text-bark-500 font-body">Tell farmers what tools and equipment you provide.</p>
        </div>
        <TagInput
          label="What tools & equipment do you supply?"
          options={PREDEFINED_TOOLS}
          selected={data.toolsProvided ?? []}
          onChange={toolsProvided => onChange({ toolsProvided })}
          placeholder="Search categories..."
          allowOther
        />

        {/* Location */}
        <div>
          <label className="label">Your location</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-bark-300" />
            <input
              type="text"
              value={data.location ?? ''}
              onChange={e => onChange({ location: e.target.value })}
              placeholder="e.g. Shah Alam, Selangor"
              className="input-field pl-9"
            />
          </div>
          <p className="text-xs text-bark-400 font-body mt-1.5 flex items-center gap-1">
            <span className="text-amber-500">⚠️</span>
            Google Maps autocomplete will be enabled once API key is provided.
          </p>
        </div>
      </div>
    )
  }

  return null
}
