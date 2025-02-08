import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Button } from 'react-native';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

// Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Usa el hook de navegación

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Usuario autenticado:", user.uid); // Verifica si el UID se obtiene correctamente
        try {
          const docRef = doc(db, "usersData", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log("Datos del usuario:", userData); // Verifica los datos obtenidos
            setName(userData.name || "Usuario sin nombre");
          } else {
            console.warn("No se encontraron datos para el usuario.");
          }
        } catch (error) {
          console.error("Error obteniendo los datos del usuario:", error);
        }
      } else {
        console.warn("No hay usuario autenticado.");
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Limpieza al desmontar
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido, {name}!</Text>
      <Button title="Configuración" onPress={() => router.push('/settingsScreen')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
});