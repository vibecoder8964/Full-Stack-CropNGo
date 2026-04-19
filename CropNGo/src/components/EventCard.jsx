import { Calendar, MapPin, ArrowRight } from 'lucide-react'

import expoImg from '../assets/events/expo.png'
import workshopImg from '../assets/events/workshop.png'
import webinarImg from '../assets/events/webinar.png'
import competitionImg from '../assets/events/competition.png'

const EVENT_IMAGES = {
  1: expoImg,
  2: workshopImg,
  3: webinarImg,
  4: competitionImg,
}

const CAT_COLORS = {
  Expo:        { bg: 'bg-[#2D6A4F]', text: 'text-[#2D6A4F]', bar: '#2D6A4F' },
  Workshop:    { bg: 'bg-[#1e4d8c]', text: 'text-[#1e4d8c]', bar: '#1e4d8c' },
  Webinar:     { bg: 'bg-[#92400E]', text: 'text-[#92400E]', bar: '#92400E' },
  Competition: { bg: 'bg-[#EA580C]', text: 'text-[#EA580C]', bar: '#EA580C' },
}

export default function EventCard({ event, showRelevance = false }) {
  const imageUrl = EVENT_IMAGES[event.image_slot] || EVENT_IMAGES[1]
  const colors = CAT_COLORS[event.category] || CAT_COLORS.Expo

  // Relevance bar color
  const getBarColor = (score) => {
    if (score >= 80) return '#2D6A4F'
    if (score >= 60) return '#CA8A04'
    if (score >= 40) return '#EA580C'
    return '#9CA3AF'
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden border border-cream-200 text-left w-full h-full">
      {/* Banner Area */}
      <div className="relative h-[200px] w-full overflow-hidden shrink-0">
        <img
          src={imageUrl}
          alt={event.category}
          className="absolute inset-0 w-full h-full object-cover rounded-t-[16px]"
        />
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 rounded-t-[16px]" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.55))' }} />

        {/* Badge (Top Pick / Recommended) */}
        {event.badge && (
          <span className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm text-bark-700 font-bold px-3 py-1 text-[11px] rounded-full shadow-sm border border-cream-200">
            {event.badge}
          </span>
        )}

        {/* Category Pill */}
        <span className={`absolute top-4 right-4 z-20 text-white font-bold px-3 py-1 text-[12px] rounded-full shadow-sm ${colors.bg}`}>
          {event.category}
        </span>

        {/* Title aligned bottom-left */}
        <div className="absolute bottom-4 left-5 right-5 z-20">
          <h3 className="font-display font-bold text-white text-[20px] leading-snug drop-shadow-sm line-clamp-2">
            {event.title}
          </h3>
        </div>
      </div>

      {/* Body Data */}
      <div className="p-5 flex flex-col flex-1">
        {/* Date + Time */}
        <div className="flex items-start gap-3 mb-4">
          <div className="mt-0.5 text-[#2D6A4F]">
            <Calendar size={18} />
          </div>
          <div className="flex items-center flex-wrap gap-x-2 text-[14px]">
            <span className="font-bold font-body text-[#1A1A1A]">{event.date_raw}</span>
            {event.time_raw && event.time_raw !== 'Time not specified' && (
              <>
                <span className="text-bark-400 font-body hidden xs:inline">•</span>
                <span className="text-bark-400 font-body">{event.time_raw}</span>
              </>
            )}
          </div>
        </div>

        {/* Location + Organiser */}
        <div className="flex items-start gap-3 mb-5">
          <div className="mt-0.5 text-[#2D6A4F]">
            <MapPin size={18} />
          </div>
          <div className="flex flex-col leading-snug">
            <span className="font-bold font-body text-[#1A1A1A] text-[14px] line-clamp-1">
              {event.venue || 'Venue not specified'}
            </span>
            <span className="text-sm font-body text-bark-400 mt-[2px]">
              {event.organiser || 'Not specified'}
            </span>
          </div>
        </div>

        {/* Relevance section — only when showRelevance is true */}
        {showRelevance && event.relevance_score != null && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-bold font-body text-bark-500">Relevance</span>
              <span className="text-[12px] font-bold font-body" style={{ color: getBarColor(event.relevance_score) }}>
                {event.relevance_score}/100 — {event.relevance_label}
              </span>
            </div>
            <div className="w-full h-2 bg-cream-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${event.relevance_score}%`,
                  backgroundColor: getBarColor(event.relevance_score),
                }}
              />
            </div>
            {event.relevance_reason && (
              <p className="text-[11px] text-bark-400 font-body italic mt-1.5 line-clamp-2">
                {event.relevance_reason}
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto">
          {/* Trusted badge */}
          {event.is_trusted_source && (
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[12px] font-bold font-body text-[#2D6A4F] bg-forest-50 border border-forest-200 px-2.5 py-0.5 rounded-full">
                ✅ Official Source
              </span>
            </div>
          )}

          <div className="h-[1px] w-full bg-[#E0D9CC] mb-4" />
          <a
            href={event.registration_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-[14px] font-bold font-body border border-[#2D6A4F] text-[#2D6A4F] rounded-full px-4 py-2.5 transition-colors hover:bg-forest-50 hover:border-forest-600"
          >
            View Details <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  )
}
