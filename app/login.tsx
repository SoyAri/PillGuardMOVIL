import React, { useState, useEffect } from 'react';
import { StyleSheet, Button, TextInput, View, Text, Alert, TouchableOpacity } from 'react-native';
import { getAuth, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

// Initialize Firebase Auth
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Usa el hook de navegación

  // Efecto para detectar si el usuario ya está autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario autenticado, verifica si tiene datos personales
        const userId = user.uid;
        const docRef = doc(db, "usersData", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Usuario tiene datos personales, redirige a HomeScreen
          router.push('/homeScreen');
        } else {
          // Usuario no tiene datos personales, redirige a askPersonalData
          router.push('/askPersonalData');
        }
      }
    });

    // Limpia el observador cuando el componente se desmonta
    return () => unsubscribe();
  }, [router]);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        // Signed in
        const user = userCredential.user;
        const userId = user.uid;

        if (user.emailVerified) {
          // Check if user has personal data
          const docRef = doc(db, "usersData", userId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            // User has personal data, navigate to home screen
            Alert.alert('Inicio de sesión correcto', `Bienvenido, ${user.email}`);
            router.push('/homeScreen'); // Navega a la pantalla de inicio (home)
          } else {
            // User does not have personal data, navigate to askpersonaldata screen
            Alert.alert('Datos personales no encontrados', 'Por favor, completa tus datos personales.');
            router.push('/askPersonalData'); // Navega a la pantalla de datos personales
          }
        } else {
          Alert.alert(
            'Verificación pendiente',
            'Tu correo electrónico no ha sido verificado. ¿Quieres que te enviemos otro correo de verificación?',
            [
              {
                text: 'Cancelar',
                style: 'cancel',
              },
              {
                text: 'Enviar',
                onPress: () => {
                  sendEmailVerification(user)
                    .then(() => {
                      Alert.alert('Correo de verificación enviado', 'Por favor, revisa tu correo para verificar tu cuenta.');
                    })
                    .catch((error) => {
                      console.error('Error enviando correo de verificación:', error);
                    });
                },
              },
            ]
          );
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error iniciando sesión:', errorCode, errorMessage);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Login" onPress={handleLogin} />
      <TouchableOpacity onPress={() => router.push('/')}> {/* redirige a pantalla de registro */}
        <Text>¿No tienes una cuenta? Regístrate</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
});