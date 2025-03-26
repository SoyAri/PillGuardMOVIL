// Componente ResetPasswordScreen: Pantalla para restablecer la contraseña mediante correo electrónico.
import { useRouter } from 'expo-router'; // Importa el hook para navegación
import { getAuth, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth"; // Importa funciones de Firebase Auth
import React, { useEffect, useState } from 'react'; // Importa React y hooks
import { Alert, Image, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'; // Importa componentes nativos
import { app } from '../firebaseConfig'; // Importa la configuración de Firebase

// Inicializa la autenticación de Firebase
const auth = getAuth(app);

export default function ResetPasswordScreen() {
  // Define estados para almacenar el correo y cualquier mensaje de error
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  // Inicializa el hook de navegación para redirecciones de pantalla
  const router = useRouter(); 

  // useEffect: Observa el estado de autenticación y redirige si el usuario ya está autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Redirige a la pantalla principal si el usuario está autenticado
        router.replace('/homeScreen');
      }
    });

    // Limpia el observador al desmontar el componente
    return () => unsubscribe();
  }, [router]);

  // Maneja el proceso de restablecimiento de la contraseña
  const handleResetPassword = () => {
    setError(''); // Limpia mensajes de error anteriores

    if (!email) {
      // Valida que el campo de correo no esté vacío
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    // Envía el correo de restablecimiento utilizando Firebase Auth
    sendPasswordResetEmail(auth, email)
      .then(() => {
        // Notifica con alerta que el correo fue enviado y redirige a inicio
        Alert.alert('Correo enviado', 'Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña.');
        router.replace('/');
      })
      .catch((error) => {
        // Maneja errores específicos y muestra un mensaje acorde
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
        // Muestra alerta del error y registra el error en consola
        Alert.alert('Error', errorMessage);
        console.error('Error enviando correo de restablecimiento:', errorCode, error.message);
      });
  };

  // Retorno del componente que renderiza la interfaz de usuario
  return (
    <View style={styles.container}>
      {/* Configura la barra de estado con estilo claro */}
      <StatusBar barStyle="light-content" />
      {/* Muestra una imagen representativa para el restablecimiento de contraseña */}
      <Image source={require('../assets/images/recoverpswdimg.png')} style={styles.image} />
      {/* Muestra el título de la pantalla */}
      <Text style={styles.title}>Restablecer Contraseña</Text>
      {/* Campo de entrada para el correo electrónico */}
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={(text) => {
          setEmail(text); // Actualiza el estado con el texto ingresado
          setError(''); // Reinicia el mensaje de error
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      {/* Muestra el mensaje de error si existe */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {/* Botón que ejecuta el proceso de reseteo al presionarlo */}
      <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
        <Text style={styles.buttonText}>Enviar Correo de Restablecimiento</Text>
      </TouchableOpacity>
    </View>
  );
}

// Definición de estilos para la interfaz del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Centra verticalmente el contenido
    alignItems: 'center', // Centra horizontalmente el contenido
    padding: 16,
    paddingTop: 10, // Agrega margen superior para el contenido
    backgroundColor: '#212c39', // Color de fondo principal
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 8, // Espacio inferior para separar la imagen del contenido siguiente
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24, // Espacio inferior para separar el título del resto
    color: '#fff', // Color blanco para el título
  },
  input: {
    height: 40,
    borderColor: '#555', // Color gris oscuro para el borde
    borderWidth: 1,
    marginBottom: 12, // Espacio inferior entre el campo y otros elementos
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#333', // Color de fondo del campo de texto
    color: '#fff', // Color del texto ingresado
  },
  errorText: {
    color: '#ff4b4b', // Color rojo para errores
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF', // Color del botón
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10, // Espacio superior para separar el botón del campo de texto
    width: '100%',
    alignItems: 'center', // Centra el texto dentro del botón
  },
  buttonText: {
    color: '#fff', // Color blanco para el texto del botón
    fontSize: 16,
    fontWeight: 'bold',
  },
});