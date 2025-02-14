import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; // Importa el hook de navegación
import { getAuth, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { app } from '../firebaseConfig';

// Initialize Firebase Auth
const auth = getAuth(app);
const db = getFirestore(app);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter(); // Usa el hook de navegación

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('isLoggedIn');
        if (value === 'true') {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('Error leyendo el estado de inicio de sesión', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  // Efecto para detectar si el usuario ya está autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        // Usuario autenticado y correo verificado, verifica si tiene datos personales
        const userId = user.uid;
        const docRef = doc(db, "usersData", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          // Usuario tiene datos personales, redirige a HomeScreen
          await AsyncStorage.setItem('isLoggedIn', 'true');
          router.replace('/homeScreen'); // Cambio realizado aquí
        } else {
          // Usuario no tiene datos personales, redirige a askPersonalData
          await AsyncStorage.setItem('isLoggedIn', 'false');
          router.replace('/askPersonalData'); // Cambio realizado aquí
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    // Limpia el observador cuando el componente se desmonta
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      // Evitar que el usuario regrese a la pantalla de inicio de sesión
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isLoggedIn) {
        router.replace('/homeScreen'); 
      } else {
   // Si no detecta nada no se realizara nada para seguir en el index
      }
    }
  }, [isLoading, isLoggedIn, router]);

  const handleLogin = () => {
    setError(''); // Limpiar el mensaje de error al intentar iniciar sesión nuevamente

    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

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
            await AsyncStorage.setItem('isLoggedIn', 'true');
            router.replace('/homeScreen'); // Navega a la pantalla de inicio (home)
          } else {
            // User does not have personal data, navigate to askpersonaldata screen
            router.replace('/askPersonalData'); // Navega a la pantalla de datos personales
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
        let errorMessage = '';
        switch (errorCode) {
          case 'auth/wrong-password':
            errorMessage = 'Correo o contraseña incorrectos.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No se encontró ninguna cuenta con esas credenciales.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Correo o contraseña incorrectos.';
            break;
          default:
            errorMessage = 'Correo o contraseña incorrectos.';
            break;
        }
        Alert.alert('Error', errorMessage);
        console.error('Error iniciando sesión:', errorCode, error.message);
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={require('../assets/images/splash.png')} style={styles.logo} />
      <Text style={styles.title}>Iniciar Sesión</Text>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(''); // Limpiar el mensaje de error al cambiar el texto
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError(''); // Limpiar el mensaje de error al cambiar el texto
        }}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/registro')}> {/* redirige a pantalla de registro */}
        <Text style={styles.loginText}>¿No tienes una cuenta? Regístrate</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/recoverPassword')}> {/* redirige a pantalla de restablecimiento de contraseña */}
        <Text style={styles.loginText}>¿Olvidaste tu contraseña? Restablécela</Text>
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
    backgroundColor: '#212c39',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
  },
  errorText: {
    color: '#ff4b4b',
    marginBottom: 12,
  },
  input: {
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#333',
    color: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 16,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
