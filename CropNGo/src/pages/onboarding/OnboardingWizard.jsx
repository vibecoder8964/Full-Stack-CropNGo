import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ProgressBar from '../../components/ProgressBar'
import Step1RoleSelection from './steps/Step1RoleSelection'
import Step2RoleContext from './steps/Step2RoleContext'
import Step3Profile from './steps/Step3Profile'
import Step4Tutorial from './steps/Step4Tutorial'
import { Leaf } from 'lucide-react'

const STEP_LABELS = ['Role', 'Details', 'Profile', 'Tutorial']
const GOOGLE_MAPS_API_KEY = 'AIzaSyB_OKuMjoLCAAETlub6xPWj3uzQhYD0ljI'

export default function OnboardingWizard() {
  const navigate = useNavigate()
  const { user, isOnboarded, completeOnboarding, logout } = useAuth()
  const [step, setStep] = useState(0)

  // Guard: if user is already onboarded, skip to profile immediately
  useEffect(() => {
    if (user?.isOnboarded) {
      navigate('/app/profile', { replace: true })
    }
  }, [])

  if (user?.isOnboarded) return null
  const [data, setData] = useState({
    location: '',
    farmerType: null,
    crops: [],
    placeOfCultivation: '',
    landSize: '',
    landUnit: 'acres',
    toolsAvailable: [],
    soilPhoto: null,
    cropsWanted: [],
    toolsProvided: [],
    avatar: null,
    age: '',
    gender: '',
    socials: { linkedin: '', facebook: '', whatsapp: '', twitter: '' },
  })

  // ── GEOLOCATION LOGIC ──────────────────────────────────────────────────────
  const [geoLoading, setGeoLoading] = useState(false)

  const detectLocation = async () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
        const res = await fetch(url)
        const json = await res.json()
        
        if (json.status === 'OK' && json.results.length > 0) {
          // Find the most descriptive city/state string
          const address = json.results[0].formatted_address
          // Often the last components are easier to read for our app
          // Let's try to find city and state
          const components = json.results[0].address_components
          const city = components.find(c => c.types.includes('locality'))?.long_name
          const state = components.find(c => c.types.includes('administrative_area_level_1'))?.long_name
          
          const rawLocation = city && state ? `${city}, ${state}` : address
          update({ 
            location: rawLocation, 
            placeOfCultivation: rawLocation,
            latitude: latitude,
            longitude: longitude
          })
          console.log('Detected Location:', rawLocation, latitude, longitude)
        }
      } catch (err) {
        console.error('Reverse Geocoding failed:', err)
      } finally {
        setGeoLoading(false)
      }
    }, (err) => {
      console.warn('Geolocation denied or failed:', err)
      setGeoLoading(false)
    })
  }

  useEffect(() => {
    // Only try to auto-detect if location is empty and we just started
    if (!data.location) {
      detectLocation()
    }
  }, [])
  // ────────────────────────────────────────────────────────────────────────

  const update = (patch) => setData(d => ({ ...d, ...patch }))

  const next = () => {
    if (step === 0 && !data.role) {
      alert('Please select a role to continue.')
      return
    }
    setStep(s => s + 1)
  }
  const back = () => setStep(s => s - 1)

  const finish = async () => {
    await completeOnboarding(data)
    logout()
  }

  const steps = [
    <Step1RoleSelection key="step1" data={data} onChange={update} next={next} />,
    <Step2RoleContext key="step2" data={data} onChange={update} />,
    <Step3Profile key="step3" data={data} onChange={update} />,
    <Step4Tutorial key="step4" onComplete={finish} />,
  ]

  const isLastStep = step === steps.length - 1

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      {/* Top bar */}
      <div className="bg-[#F8F3E8] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center shadow-md">
            <Leaf size={20} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg text-bark-700">CropNGo</span>
        </div>
        <span className="px-3 py-1 bg-white border border-cream-200 rounded-full text-xs text-bark-500 font-body font-semibold shadow-sm">
          Step {step + 1} of {steps.length}
        </span>
      </div>

      <ProgressBar current={step} total={steps.length} labels={STEP_LABELS} />

      {/* Step content */}
      <div className="flex-1 overflow-y-auto w-full">
        <div className={`mx-auto px-4 py-6 ${step === 0 ? 'max-w-4xl' : 'max-w-md'}`}>
          {steps[step]}
        </div>
      </div>

      {/* Footer nav — hidden on step 4 (tutorial handles its own nav) */}
      {!isLastStep && (
        <div className="bg-white border-t border-cream-200 p-4 sm:p-6 w-full">
          <div className="max-w-md mx-auto flex gap-3">
            {step > 0 && (
              <button type="button" onClick={back} className="btn-secondary flex-shrink-0">
                Back
              </button>
            )}
            <button
              id={`onboard-next-step-${step}`}
              type="button"
              onClick={next}
              className="btn-primary flex-1 shadow-lg shadow-forest-500/20"
            >
              {step === steps.length - 2 ? 'Almost done!' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
