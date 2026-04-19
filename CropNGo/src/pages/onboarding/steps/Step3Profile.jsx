import ImageUploader from '../../../components/ImageUploader'
import { User, Link, Share2, MessageCircle, Hash } from 'lucide-react'

const GENDERS = ['Male', 'Female', 'Prefer not to say']

export default function Step3Profile({ data, onChange }) {
  return (
    <div className="flex flex-col gap-8 animate-fade-in py-2">
      <div className="text-center mb-2 flex flex-col items-center">
        <div className="bg-forest-100 p-4 rounded-[20px] mb-4 inline-flex shadow-sm border border-forest-200"><User size={32} className="text-forest-600" /></div>
        <h2 className="font-display font-bold text-3xl text-bark-700 mb-2">Complete your profile</h2>
        <p className="text-base text-bark-500 font-body">Help others recognise you on CropNGo.</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center">
        <ImageUploader
          value={data.avatar}
          onChange={avatar => onChange({ avatar })}
          shape="circle"
          label="Add profile photo"
        />
      </div>

      {/* Name */}
      <div>
        <label className="label">Full Name</label>
        <input
          type="text"
          value={data.name ?? ''}
          onChange={e => onChange({ name: e.target.value })}
          placeholder="e.g. Amirul Amin"
          className="input-field"
        />
      </div>

      {/* Description / Bio */}
      <div>
        <label className="label">Description / Bio</label>
        <textarea
          rows={3}
          value={data.bio ?? ''}
          onChange={e => onChange({ bio: e.target.value })}
          placeholder="Tell the community a bit about yourself..."
          className="input-field resize-none"
        />
      </div>

      {/* Age */}
      <div>
        <label className="label">Age</label>
        <input
          type="number"
          min="16"
          max="99"
          value={data.age ?? ''}
          onChange={e => onChange({ age: e.target.value })}
          placeholder="e.g. 34"
          className="input-field"
        />
      </div>

      {/* Gender */}
      <div>
        <label className="label">Gender</label>
        <div className="flex gap-2 flex-wrap">
          {GENDERS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ gender: g })}
              className={`px-4 py-2 rounded-pill border text-sm font-body font-medium transition-all duration-200
                ${data.gender === g ? 'border-forest-500 bg-forest-100 text-forest-700' : 'border-cream-300 bg-white text-bark-500 hover:border-cream-400'}`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div>
        <label className="label">Social Links <span className="text-bark-300 font-normal">(optional)</span></label>
        <div className="flex flex-col gap-2">
          {[
            { key: 'linkedin',  icon: <Link size={16} />, placeholder: 'linkedin.com/in/yourname' },
            { key: 'facebook',  icon: <Share2 size={16} />, placeholder: 'facebook.com/yourname' },
            { key: 'whatsapp',  icon: <MessageCircle size={16} />, placeholder: '+60XXXXXXXXXX' },
            { key: 'twitter',   icon: <Hash size={16} />, placeholder: '@yourhandle' },
          ].map(s => (
            <div key={s.key} className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">{s.icon}</span>
              <input
                type="text"
                value={data.socials?.[s.key] ?? ''}
                onChange={e => onChange({ socials: { ...(data.socials ?? {}), [s.key]: e.target.value } })}
                placeholder={s.placeholder}
                className="input-field pl-9 text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
