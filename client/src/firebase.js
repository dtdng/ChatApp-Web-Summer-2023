import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage, ref } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC2E2KY9Q3F4x9AuQv2uuaaGzlSHiCTa84",
  authDomain: "testing-ff165.firebaseapp.com",
  projectId: "testing-ff165",
  storageBucket: "testing-ff165.appspot.com",
  messagingSenderId: "982667609763",
  appId: "1:982667609763:web:3f95233835a6ae093fa116",
  measurementId: "G-6HZEJ0F30N",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const storage = getStorage();
export const db = getFirestore();
export const auth = getAuth();
