export const PREDEFINED_CROPS = [
  'Paddy', 'Durian', 'Rambutan', 'Mango', 'Papaya', 'Banana', 'Pineapple',
  'Oil Palm', 'Rubber', 'Coconut', 'Cocoa',
  'Kangkung', 'Bayam', 'Lettuce', 'Cabbage', 'Chilli', 'Tomato',
  'Sweet Corn', 'Cucumber', 'Pumpkin', 'Long Beans', 'Lady Fingers',
  'Langsat', 'Watermelon', 'Dragon Fruit', 'Starfruit', 'Other'
]

export const PREDEFINED_TOOLS = [
  'Irrigation Systems', 'Plows', 'Fertilizers', 'Pesticides',
  'Harvesting Tools', 'Storage Equipment', 'Seedling Tools',
  'Tractors', 'Drones', 'Greenhouse Equipment', 'Other'
]

export const mockAIChat = {
  Farmer: [
    { role: 'assistant', text: 'Hello Amirul! I\'m your AgriConnect AI assistant. Ask me anything about farming, soil, crops, tools, or market prices.' },
    { role: 'user', text: 'What\'s the best time to plant paddy in Kedah?' },
    { role: 'assistant', text: 'In Kedah, the **main season (musim rendeng)** runs from October to March, while the **off-season (musim dera)** is April to September. For optimal yield, plant during the main season when rainfall is most reliable. Use certified high-yield varieties like MR297 or MR269. Would you like suggestions on irrigation setup for the off-season too?' },
  ],
  Vendor: [
    { role: 'assistant', text: 'Hello! I\'m your AgriConnect AI assistant. I can help you find farmers by crop type, analyse market availability, and give price insights.' },
    { role: 'user', text: 'Which regions have the most paddy supply right now?' },
    { role: 'assistant', text: 'The highest paddy supply is currently in **Kedah (42%)**, followed by **Perlis (18%)** and **Perak (15%)**. The main harvest season is wrapping up — expect peak availability until end of April. I\'ve found **3 farmers near your location** who have paddy listed. Want me to show them?' },
  ],
  Supplier: [
    { role: 'assistant', text: 'Hello! I\'m your AgriConnect AI assistant. Ask me which farmers need your equipment, market trends, or how to expand your reach across Malaysia.' },
    { role: 'user', text: 'Which farmers near me need irrigation tools?' },
    { role: 'assistant', text: 'Based on current profiles, I found **5 farmers within 200km** who have listed "Irrigation Systems" as a tool they need or don\'t have. New farmers in KL\'s Setapak area are especially showing interest. Would you like me to show their contact profiles?' },
  ],
}

export const mockSuitabilityResult = {
  badge: 'Suitable',
  badgeColor: 'forest',
  reason: 'Based on the provided land size (8 acres), available tools (Tractor, Irrigation), and location (Kedah lowlands), paddy cultivation shows high suitability. Kedah\'s climate and flat terrain are ideal for wet paddy farming.',
  suggestions: 'Consider adding a soil pH meter and using certified seed varieties (MR297) for higher yield. Drip irrigation is recommended for off-season planting.',
  tools: [
    { name: 'Drip Irrigation Kit', supplier: 'fazrul_supply', listingId: 'listing-8' },
    { name: 'DJI Agras T40 Drone', supplier: 'khairul_tools', listingId: 'listing-7' },
  ],
}

export const SUITABILITY_LEVELS = [
  { label: 'Not Suitable',          color: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Slightly Not Suitable', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { label: 'Decent',                color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { label: 'Suitable',              color: 'bg-forest-100 text-forest-700 border-forest-200' },
  { label: 'Very Suitable',         color: 'bg-forest-500 text-white border-forest-500' },
]
