// Importaciones y configuración de Firebase, navegación y React Native
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; // Hook para la navegación entre pantallas
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, sendEmailVerification, signOut } from "firebase/auth";
import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { app } from '../firebaseConfig'; // Configuración de Firebase

// Inicialización de Firebase Auth
const auth = getAuth(app);

export default function RegisterScreen() {
  // Estados para almacenar correo, contraseña, confirmación de contraseña y mensajes de error
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter(); // Hook para cambiar de pantallas
  const [tema, setTema] = useState("Temabase");
  // NUEVOS estados para efectos visuales:
  const [isProtanopia, setIsProtanopia] = useState(false);
  const [isDeuteranopia, setIsDeuteranopia] = useState(false);
  const [isTritanopia, setIsTritanopia] = useState(false);
  const [isMonochromatic, setIsMonochromatic] = useState(false);
  const [isDaltonism, setIsDaltonism] = useState(false);

  // Efecto para escuchar los cambios en el estado de autenticación de Firebase
  useEffect(() => {
    // Si el usuario está autenticado y su correo fue verificado, redirige a la pantalla principal
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        router.replace('/homeScreen'); // Redirección
      }
    });
    // Limpieza del efecto al desmontar el componente
    return () => unsubscribe();
  }, [router]);

  // Efecto para deshabilitar el botón físico "atrás" en Android y evitar regresar a la pantalla de registro
  useEffect(() => {
    const backAction = () => {
      return true; // Impide la acción de retroceso
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove(); // Limpieza del listener
  }, []);

  // Cargar tema desde AsyncStorage
  useEffect(() => {
    const loadTheme = async () => {
      const temaGuardado = await AsyncStorage.getItem('tema');
      if (temaGuardado) setTema(temaGuardado);
    };
    loadTheme();
  }, []);

  // NUEVO useEffect para cargar efectos visuales desde AsyncStorage
  useEffect(() => {
    const loadVisualEffects = async () => {
      const protanopiaGuardado = await AsyncStorage.getItem('protanopia');
      if (protanopiaGuardado !== null) setIsProtanopia(protanopiaGuardado === 'true');
      const deuteranopiaGuardado = await AsyncStorage.getItem('deuteranopia');
      if (deuteranopiaGuardado !== null) setIsDeuteranopia(deuteranopiaGuardado === 'true');
      const tritanopiaGuardado = await AsyncStorage.getItem('tritanopia');
      if (tritanopiaGuardado !== null) setIsTritanopia(tritanopiaGuardado === 'true');
      const monochromaticGuardado = await AsyncStorage.getItem('monochromatic');
      if (monochromaticGuardado !== null) setIsMonochromatic(monochromaticGuardado === 'true');
      const daltonismGuardado = await AsyncStorage.getItem('daltonism');
      if (daltonismGuardado !== null) setIsDaltonism(daltonismGuardado === 'true');
    };
    loadVisualEffects();
  }, []);

  // Función para validar el formato del correo mediante una expresión regular
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión para correo válido
    return emailRegex.test(email);
  };

  // Función que gestiona el registro del usuario
  const handleSignUp = () => {
    setError(''); // Reinicia el mensaje de error

    // Validación de campos vacíos
    if (!email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    // Validación del formato de correo
    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    // Validación de que las contraseñas coincidan
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    // Se intenta crear el usuario con el correo y contraseña proporcionados
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Registro exitoso del usuario
        const user = userCredential.user;
        console.log('User registered:', user);

        // Se envía el correo de verificación
        sendEmailVerification(user)
          .then(() => {
            console.log('Verification email sent.');
            Alert.alert('Correo de verificación enviado', 'Por favor, revisa tu correo para verificar tu cuenta.');
            // Se cierra la sesión para evitar acceso sin verificación y se redirige a la pantalla de inicio de sesión
            signOut(auth)
              .then(() => {
                console.log('User signed out to prevent access until email is verified.');
                router.replace('/');
              })
              .catch((error) => {
                console.error('Error signing out user:', error);
              });
          })
          .catch((error) => {
            console.error('Error sending verification email:', error);
          });
      })
      .catch((error) => {
        // Manejo de errores durante el proceso de registro
        const errorCode = error.code;
        let errorMessage = '';
        switch (errorCode) {
          case 'auth/email-already-in-use':
            errorMessage = 'El correo electrónico ya está en uso.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Correo electrónico inválido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es demasiado débil.';
            break;
          default:
            errorMessage = 'Error al registrarse. Por favor, inténtalo de nuevo.';
            break;
        }
        Alert.alert('Error', errorMessage);
        console.error('Error registrando usuario:', errorCode, error.message);
      });
  };

  // Renderizado de la interfaz de registro
  return (
    <SafeAreaView style={[
      styles.container,
      tema === 'claro' ? styles.claro : styles.base,
      isProtanopia ? styles.protanopia : null,
      isDeuteranopia ? styles.deuteranopia : null,
      isTritanopia ? styles.tritanopia : null,
      isMonochromatic ? styles.monochromatic : null,
      isDaltonism ? styles.daltonism : null,
    ]}>
      <StatusBar barStyle="light-content" /> {/* Estado de la barra superior */}
      <Image source={require('../assets/images/registerimg.png')} style={styles.image} /> {/* Imagen ilustrativa */}
      <Text style={styles.title}>Registro</Text> {/* Título de la pantalla */}
      <TextInput
        placeholder="Correo" // Entrada para el correo electrónico
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(''); // Reinicia el error al cambiar el texto
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      <TextInput
        placeholder="Contraseña" // Entrada para la contraseña
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
        }}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      <TextInput
        placeholder="Confirma tu contraseña" // Entrada para confirmar contraseña
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setError('');
        }}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null} {/* Muestra errores si existen */}
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Registrarse</Text> {/* Botón para ejecutar registro */}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta? Inicia sesión</Text> {/* Enlace a la pantalla de inicio de sesión */}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Definición de estilos para la interfaz
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#212c39', // Fondo oscuro
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 16, // Espacio debajo de la imagen
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16, // Espacio debajo del título
    color: '#fff', // Texto en blanco
  },
  input: {
    height: 40,
    borderColor: '#555', // Borde gris oscuro
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#333', // Fondo oscuro para los campos
    color: '#fff', // Texto en blanco
  },
  errorText: {
    color: '#ff4b4b', // Texto en rojo para errores
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF', // Botón azul
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff', // Texto del botón en blanco
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginText: {
    marginTop: 16,
    color: '#007AFF', // Enlace en azul
    textDecorationLine: 'underline',
  },
  base: {
    backgroundColor: '#2a3b4c',
  },
  claro: {
    backgroundColor: '#FFFFFF',
  },
  // NUEVOS estilos para efectos visuales:
  protanopia: {
    filter: 'protanopia(100%)', // Simula efecto Protanopia
  },
  deuteranopia: {
    filter: 'deuteranopia(100%)', // Simula efecto Deuteranopia
  },
  tritanopia: {
    filter: 'tritanopia(100%)', // Simula efecto Tritanopia
  },
  monochromatic: {
    filter: 'grayscale(100%)', // Simula vista Monochromatic
  },
  daltonism: {
    filter: 'daltonism(100%)', // Simula efecto Daltonismo
  },
});