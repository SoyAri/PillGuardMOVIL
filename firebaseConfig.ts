// Importar Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDWE1XAcCeKIcfzWdQeocO2KDKsoRT4jro",
  authDomain: "pillguardmovil.firebaseapp.com",
  projectId: "pillguardmovil",
  storageBucket: "pillguardmovil.firebasestorage.app",
  messagingSenderId: "884955747419",
  appId: "1:884955747419:web:9e39efa4302dfaa463db7e"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Auth
const auth = getAuth(app);

// Inicializar Firestore
const db = getFirestore(app);

export { app, auth, db };