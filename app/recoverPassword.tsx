import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, View, Text, Alert, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native';
import { getAuth, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

// Initialize Firebase Auth
const auth = getAuth(app);

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado para la animación de carga
  const router = useRouter(); // Usa el hook de navegación

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Si el usuario ya está autenticado, redirigir a la pantalla de inicio
        router.replace('/homeScreen');
      }
    });

    // Limpia el observador cuando el componente se desmonta
    return () => unsubscribe();
  }, [router]);

  const handleResetPassword = () => {
    setError(''); // Limpiar el mensaje de error al intentar restablecer la contraseña

    if (!email) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setLoading(true); // Mostrar animación de carga

    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Correo enviado', 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.');
        router.replace('/'); // Redirige a la pantalla de inicio de sesión
      })
      .catch((error) => {
        const errorCode = error.code;
        let errorMessage = '';
        switch (errorCode) {
          case 'auth/user-not-found':
            errorMessage = 'No se encontró ninguna cuenta con ese correo electrónico.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Correo electrónico inválido.';
            break;
          default:
            errorMessage = 'Error al enviar el correo de restablecimiento. Por favor, inténtalo de nuevo.';
            break;
        }
        Alert.alert('Error', errorMessage);
        console.error('Error enviando correo de restablecimiento:', errorCode, error.message);
      })
      .finally(() => {
        setLoading(false); // Ocultar animación de carga
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={require('../assets/images/recoverpswdimg.png')} style={styles.image} />
      <Text style={styles.title}>Restablecer Contraseña</Text>
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
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>Enviar Correo de Restablecimiento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingTop: 10, // Añadir margen superior para subir el contenido
    backgroundColor: '#212c39',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 8, // Reducir el margen inferior para subir el contenido
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
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
    color: '#ff4b4b',
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
});