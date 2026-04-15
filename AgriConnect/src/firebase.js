import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCk7oSY4WIBTLQT5YimxOojju1qs-2y2_g",
  authDomain: "agriconnect-1654b.firebaseapp.com",
  projectId: "agriconnect-1654b",
  storageBucket: "agriconnect-1654b.firebasestorage.app",
  messagingSenderId: "483622559669",
  appId: "1:483622559669:web:ba1f38fbeba5367ef143fc",
  measurementId: "G-F3R2XYRG1M"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const storage = getStorage(app);

