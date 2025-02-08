import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Button, TextInput, View, Alert, Text, TouchableOpacity } from 'react-native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged } from "firebase/auth";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

// Initialize Firebase Auth
const auth = getAuth(app);

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter(); // Usa el hook de navegación

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to home screen
        router.push('/homeScreen');
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignUp = () => {
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
        const errorMessage = error.message;
        console.error('Error registering user:', errorCode, errorMessage);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
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
      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Registrarse" onPress={handleSignUp} />
      <TouchableOpacity onPress={() => router.push('/login')}>
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
  loginText: {
    marginTop: 16,
    color: 'blue',
    textDecorationLine: 'underline',
  },
});