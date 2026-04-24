import { createContext, useContext, useState, useEffect } from 'react'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const AuthContext = createContext(null)

const STORAGE_KEY = 'cropngo_user'
const ONBOARDED_KEY = 'cropngo_onboarded'

const PHONE_REGEX = /^\+?6?01[0-9]{8,9}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [isOnboarded, setIsOnboarded] = useState(() => {
    const lsVal = localStorage.getItem(ONBOARDED_KEY) === 'true'
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY)
      const parsed = storedUser ? JSON.parse(storedUser) : null
      return lsVal || (parsed && (parsed.isOnboarded === true || !!(parsed.role && parsed.location)))
    } catch {
      return lsVal
    }
  })

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const register = async (userData) => {
    const { username, emailOrPhone, password } = userData

    // 1. Validate Format of Email/Phone
    const isEmail = EMAIL_REGEX.test(emailOrPhone)
    const isPhone = PHONE_REGEX.test(emailOrPhone)
    if (!isEmail && !isPhone) {
      throw new Error("Invalid contact format. Use +601X... or a valid Gmail.")
    }

    // 2. Reject if username IS a phone or gmail, OR fully numeric
    const isNumeric = /^\d+$/.test(username)
    if (EMAIL_REGEX.test(username) || PHONE_REGEX.test(username) || isNumeric) {
      throw new Error("Username cannot be an email, phone number, or numeric only.")
    }

    // 3 & 4. Check if Username and Email/Phone are taken (Parallel)
    const docRef = doc(db, 'users', username)
    const qByEmail = query(collection(db, 'users'), where('email', '==', emailOrPhone))
    
    const [ds, qSnap] = await Promise.all([
      getDoc(docRef),
      getDocs(qByEmail)
    ])

    if (ds.exists()) {
      throw new Error("Username already taken.")
    }
    if (!qSnap.empty) {
      throw new Error("This contact is already registered.")
    }

    // 5. Hash Password
    const encoder = new TextEncoder()
    const dataBuf = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuf)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const newUser = {
      username: username,
      email: emailOrPhone,
      phone: isPhone ? emailOrPhone : '', // populate correctly
      password: hashedPassword,
      role: userData.role || null,
      web_search: true,
      createdAt: new Date().toISOString(),
      avatar: null,
      bio: '',
      location: '',
      socials: { linkedin: '', facebook: '', whatsapp: '', twitter: '' },
      crops: [],
      toolsProvided: [],
      isOnboarded: false,
    }

    await setDoc(docRef, newUser)
    setUser(newUser)
    // Mark as NOT onboarded — will go through onboarding ONCE
    setIsOnboarded(false)
    localStorage.setItem(ONBOARDED_KEY, 'false')
    return newUser
  }

  const login = async (credentials) => {
    const { usernameOrContact, password } = credentials
    
    const isEmail = EMAIL_REGEX.test(usernameOrContact)
    const isPhone = PHONE_REGEX.test(usernameOrContact)
    
    let userDoc = null
    
    if (isEmail || isPhone) {
      const q = query(collection(db, 'users'), where('email', '==', usernameOrContact))
      const qs = await getDocs(q)
      if (qs.empty) throw new Error("Account not found.")
      userDoc = qs.docs[0].data()
    } else {
      const dr = doc(db, 'users', usernameOrContact)
      const ds = await getDoc(dr)
      if (!ds.exists()) throw new Error("Username not found.")
      userDoc = ds.data()
    }

    const encoder = new TextEncoder()
    const dataBuf = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuf)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (userDoc.password !== hashedPassword && userDoc.password !== password) {
      throw new Error("Incorrect password.")
    }

    // Existing users: check if they've completed onboarding before
    const userOnboarded = userDoc.isOnboarded === true || !!(userDoc.role && userDoc.location)
    
    setUser(userDoc)
    setIsOnboarded(userOnboarded)
    localStorage.setItem(ONBOARDED_KEY, userOnboarded ? 'true' : 'false')
    return userDoc
  }

  const logout = () => {
    // Clear all user-specific caches before wiping user state
    if (user?.username) {
      const username = user.username
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith(`cropngo_chat_history_${username}`) ||
          key.startsWith(`cropngo_farmer_cache_${username}`) ||
          key.startsWith(`cropngo_vendor_cache_${username}`) ||
          key.startsWith(`cropngo_supplier_cache_${username}`) ||
          key.startsWith(`cropngo_events_cache_${username}`)
        )) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    }
    // Also clear global event caches that may linger
    localStorage.removeItem('cropngo_events_cache')
    setUser(null)
    setIsOnboarded(false)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ONBOARDED_KEY)
  }

  const updateUser = async (updates) => {
    if (!user || !user.username) return
    const dr = doc(db, 'users', user.username)
    
    // Start updating user doc immediately
    const userUpdatePromise = updateDoc(dr, updates)
    
    // Global sync: update all user's listings if profile info changed
    const syncFields = ['username', 'role', 'latitude', 'longitude']
    const hasSyncFields = Object.keys(updates).some(k => syncFields.includes(k))
    
    if (hasSyncFields) {
      const q = query(collection(db, 'listings'), where('sellerId', '==', user.username))
      const qs = await getDocs(q)
      
      if (!qs.empty) {
        const batchPromises = qs.docs.map(d => {
          const listingUpdates = {}
          if (updates.username) listingUpdates.sellerName = updates.username
          if (updates.role) listingUpdates.sellerRole = updates.role
          if (updates.latitude !== undefined) listingUpdates.latitude = updates.latitude
          if (updates.longitude !== undefined) listingUpdates.longitude = updates.longitude
          return updateDoc(d.ref, listingUpdates)
        })
        await Promise.all([...batchPromises, userUpdatePromise])
      } else {
        await userUpdatePromise
      }
    } else {
      await userUpdatePromise
    }

    setUser(prev => {
      const updated = { ...prev, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const completeOnboarding = async (onboardingData) => {
    await updateUser({ ...onboardingData, isOnboarded: true })
    setIsOnboarded(true)
    localStorage.setItem(ONBOARDED_KEY, 'true')
  }

  return (
    <AuthContext.Provider value={{ user, isOnboarded, register, login, logout, updateUser, completeOnboarding }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
