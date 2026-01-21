import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Humein database chahiye isliye ye line zaroori hai

const firebaseConfig = {
  apiKey: "AIzaSyBkYvK6l1OoqhA0ECCXMZcRfAcZvHroFXg",
  authDomain: "locker-project-5ab26.firebaseapp.com",
  projectId: "locker-project-5ab26",
  storageBucket: "locker-project-5ab26.firebasestorage.app",
  messagingSenderId: "590887245647",
  appId: "1:590887245647:web:3e75d8254368abaed7973a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Database ko export kar rahe hain taaki App.jsx mein use kar sakein
export const db = getFirestore(app);