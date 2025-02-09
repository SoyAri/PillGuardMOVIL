import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Text, Alert, TouchableOpacity, Image, BackHandler, StatusBar } from 'react-native';
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
  const [error, setError] = useState('');
  const router = useRouter(); // Usa el hook de navegación

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
          router.replace('/homeScreen');
        } else {
          // Usuario no tiene datos personales, redirige a askPersonalData
          router.replace('/askPersonalData');
        }
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
            Alert.alert('Inicio de sesión correcto', `Bienvenido, ${user.email}`);
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
    width: 200, // Aumentar el tamaño del logo
    height: 200, // Aumentar el tamaño del logo
    marginBottom: 16, // Reducir el margen inferior para subir el contenido
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
    borderColor: '#555', // Cambiar el color del borde a gris oscuro
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#333', // Cambiar el color de fondo a gris oscuro
    color: '#fff', // Cambiar el color del texto a blanco
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