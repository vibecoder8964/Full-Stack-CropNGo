export const mockConversations = [
  {
    id: 'conv-1',
    with: {
      id: 'user-3',
      username: 'maya_vendor',
      role: 'Vendor',
      avatar: null,
    },
    lastMessage: 'Okay, I can arrange pickup by Friday.',
    lastTimestamp: '2026-04-11T09:32:00Z',
    hasInteracted: true,
    reviewed: false,
    unread: true,
  },
  {
    id: 'conv-2',
    with: {
      id: 'user-2',
      username: 'fazrul_supply',
      role: 'Supplier',
      avatar: null,
    },
    lastMessage: 'The irrigation kit is ready for collection.',
    lastTimestamp: '2026-04-10T14:17:00Z',
    hasInteracted: true,
    reviewed: true,
  },
  {
    id: 'conv-3',
    with: {
      id: 'user-5',
      username: 'nurul_agri',
      role: 'Farmer',
      avatar: null,
    },
    lastMessage: 'Thanks for the advice on soil pH!',
    lastTimestamp: '2026-04-09T18:05:00Z',
    hasInteracted: false,
    reviewed: false,
  },
]

export const mockMessages = {
  'conv-1': [
    { id: 'm1', senderId: 'user-3', text: 'Hi! I saw your paddy listing. Is 200kg available this week?', timestamp: '2026-04-11T08:00:00Z' },
    { id: 'm2', senderId: 'demo-user-1', text: 'Yes, I have about 300kg ready. What price are you looking at?', timestamp: '2026-04-11T08:15:00Z' },
    { id: 'm3', senderId: 'user-3', text: 'Market rate is fine. Around RM 3.50/kg?', timestamp: '2026-04-11T08:45:00Z' },
    { id: 'm4', senderId: 'demo-user-1', text: 'That works for me. Can you pick up in Alor Setar?', timestamp: '2026-04-11T09:00:00Z' },
    { id: 'm5', senderId: 'user-3', text: 'Okay, I can arrange pickup by Friday.', timestamp: '2026-04-11T09:32:00Z' },
  ],
  'conv-2': [
    { id: 'm6', senderId: 'user-2', text: 'Your order for the drip irrigation kit has been processed.', timestamp: '2026-04-10T13:00:00Z' },
    { id: 'm7', senderId: 'demo-user-1', text: 'Great! When can I pick it up?', timestamp: '2026-04-10T13:30:00Z' },
    { id: 'm8', senderId: 'user-2', text: 'The irrigation kit is ready for collection.', timestamp: '2026-04-10T14:17:00Z' },
  ],
  'conv-3': [
    { id: 'm9', senderId: 'user-5', text: 'Hey, do you have any tips on improving soil quality for leafy greens?', timestamp: '2026-04-09T17:30:00Z' },
    { id: 'm10', senderId: 'demo-user-1', text: 'Sure! Adding compost and keeping pH between 6.0–6.5 works well.', timestamp: '2026-04-09T17:50:00Z' },
    { id: 'm11', senderId: 'user-5', text: 'Thanks for the advice on soil pH!', timestamp: '2026-04-09T18:05:00Z' },
  ],
}
