export default function ChatBubble({ message, isOwn }) {
  const time = new Date(message.timestamp).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
      <div className={`max-w-[78%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 text-[15px] font-body leading-relaxed md-shadow
          ${isOwn
            ? 'bg-[#2D6A4F] text-white rounded-2xl rounded-br-[2px] shadow-sm'
            : 'bg-white border border-[#E0D9CC] text-[#1A1A1A] rounded-2xl rounded-bl-[2px] shadow-sm'
          }`}>
          {message.text}
        </div>
        <span className="text-[11px] text-bark-400 px-1 font-medium">{time}</span>
      </div>
    </div>
  )
}
