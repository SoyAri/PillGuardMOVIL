import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View, Alert, Text, TouchableOpacity, BackHandler, Image, StatusBar } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

// Initialize Firebase Auth
const auth = getAuth(app);

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter(); // Usa el hook de navegación

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        // User is signed in and email is verified, redirect to home screen
        router.replace('/homeScreen');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const backAction = () => {
      // Evitar que el usuario regrese a la pantalla de registro
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = () => {
    setError(''); // Limpiar el mensaje de error al intentar registrarse nuevamente

    if (!email || !password || !confirmPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor, ingresa un correo electrónico válido.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in 
        const user = userCredential.user;
        console.log('User registered:', user);

        // Send verification email
        sendEmailVerification(user)
          .then(() => {
            console.log('Verification email sent.');
            Alert.alert('Correo de verificación enviado', 'Por favor, revisa tu correo para verificar tu cuenta.');
            // Sign out the user to prevent access until email is verified
            signOut(auth).then(() => {
              console.log('User signed out to prevent access until email is verified.');
              router.replace('/'); // Redirige a la pantalla de inicio de sesión
            }).catch((error) => {
              console.error('Error signing out user:', error);
            });
          })
          .catch((error) => {
            console.error('Error sending verification email:', error);
          });
      })
      .catch((error) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={require('../assets/images/registerimg.png')} style={styles.image} />
      <Text style={styles.title}>Registro</Text>
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
      <TextInput
        placeholder="Confirma tu contraseña"
        value={confirmPassword}
        onChangeText={(text) => {
          setConfirmPassword(text);
          setError(''); // Limpiar el mensaje de error al cambiar el texto
        }}
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Registrarse</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={styles.loginText}>¿Ya tienes una cuenta? Inicia sesión</Text>
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
  image: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16, // Reducir el margen inferior para subir el contenido
    color: '#fff',
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
  errorText: {
    color: 'red',
    marginBottom: 12,
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