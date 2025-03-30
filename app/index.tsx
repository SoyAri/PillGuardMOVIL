import AsyncStorage from '@react-native-async-storage/async-storage';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as TaskManager from 'expo-task-manager';
import { getAuth, onAuthStateChanged, sendEmailVerification, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, BackHandler, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { app } from '../firebaseConfig';

// Paso 1: Definir el manejador de notificaciones que fija la forma en como se muestran en la app
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // Se mostrará alerta en la notificación
    shouldPlaySound: true,   // Se reproducirá sonido en la notificación
    shouldSetBadge: false,   // No se actualizará el badge de la app
  }),
});

// Inicialización de Firebase (autenticación y conexión a Firestore)
const auth = getAuth(app);
const db = getFirestore(app);

export default function LoginScreen() {
  // Estados para almacenar valores de email, contraseña, errores, carga, tema y notificaciones.
  const [email, setEmail] = useState(''); // Valor del correo electrónico
  const [error, setError] = useState(''); // Mensaje de error a mostrar
  const [password, setPassword] = useState(''); // Valor de la contraseña
  const [loading, setLoading] = useState(false); // Indicador de carga al iniciar sesión
  const [tema, setTema] = useState("Temabase"); // Estado de tema (por defecto "Temabase")
  const [notificationsEnabled, setNotificationsEnabled] = useState(false); // Estado para notificaciones habilitadas
  const router = useRouter(); // Hook para navegación entre pantallas

  // NUEVOS estados para efectos visuales:
  const [isProtanopia, setIsProtanopia] = useState(false);
  const [isDeuteranopia, setIsDeuteranopia] = useState(false);
  const [isTritanopia, setIsTritanopia] = useState(false);
  const [isMonochromatic, setIsMonochromatic] = useState(false);
  const [isDaltonism, setIsDaltonism] = useState(false);

  // useEffect para cargar configuraciones: tema y estado de las notificaciones desde AsyncStorage
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Recupera el tema guardado y el estado de notificaciones desde el almacenamiento
        const temaGuardado = await AsyncStorage.getItem('tema');
        const notificationsStatus = await AsyncStorage.getItem('notificationsEnabled');
        if (temaGuardado) setTema(temaGuardado);
        if (notificationsStatus) setNotificationsEnabled(JSON.parse(notificationsStatus));
      } catch (error) {
        console.error("Error cargando configuraciones:", error);
      }
    };
    loadConfig();
  }, []);

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

  // useEffect: Configurar y activar notificaciones si el usuario ha habilitado la opción
  useEffect(() => {
    // Paso 2: Si las notificaciones están habilitadas en la configuración del usuario
    const enableNotifications = async () => {
      try {
        if (notificationsEnabled) {
          // Paso 3: Solicitar permisos de notificaciones
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'No se pueden enviar notificaciones sin permisos.');
            return;
          }
          // Paso 4: Obtener el token push para las notificaciones
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
          // Almacenar el token en la base de datos del usuario dentro del área de authentication
          if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            const userRef = doc(db, "usersData", userId);
            await updateDoc(userRef, { notificationToken: token });
            console.log('Notification token stored in DB for user:', token);
          } else {
            console.warn("No authenticated user to store notification token");
          }
        }
      } catch (error) {
        console.error("Error configurando notificaciones:", error);
      }
    };
    enableNotifications();
  }, [notificationsEnabled]);

  // useEffect: Solicitar permisos adicionales de notificaciones para Android y iOS (redundante, pero refuerza la solicitud)
  useEffect(() => {
    // Paso 5: Pedir permisos de notificaciones explícitamente según la plataforma
    const requestNotificationPermissions = async () => {
      if (Platform.OS === 'android') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No se pueden enviar notificaciones sin permisos.');
        }
      } else if (Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No se pueden enviar notificaciones sin permisos.');
        }
      }
    };

    // Paso 6: Ejecutar la petición de permisos
    requestNotificationPermissions();
  }, []);

  // useEffect para verificar y restaurar la sesión del usuario ya sea del AsyncStorage o de Firebase Auth
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        // Intenta recuperar una sesión guardada del usuario
        const userSession = await AsyncStorage.getItem('userSession');
        if (userSession) {
          const parsedUser = JSON.parse(userSession);
          console.log('Sesión encontrada:', parsedUser);

          if (parsedUser.emailVerified) {
            // Verifica si existen datos adicionales del usuario en Firestore
            const userId = parsedUser.uid;
            const docRef = doc(db, "usersData", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              // Si existen, navega a la pantalla principal
              router.replace('/homeScreen');
            } else {
              // Si faltan datos, navega a la pantalla para solicitar información personal
              router.replace('/askPersonalData');
            }
            return;
          }
        }

        // Si no hay sesión almacenada, se subscribe a los cambios de estado de Firebase Auth
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user && user.emailVerified) {
            console.log('Usuario autenticado desde Firebase:', user);
            const userSession = {
              uid: user.uid,
              email: user.email,
              emailVerified: user.emailVerified
            };
            await AsyncStorage.setItem('userSession', JSON.stringify(userSession));
            
            const docRef = doc(db, "usersData", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
              router.replace('/homeScreen');
            } else {
              router.replace('/askPersonalData');
            }
          }
        });

        return () => unsubscribe(); // Limpia el listener al desmontar el componente
      } catch (error) {
        console.error('Error verificando la sesión del usuario:', error);
      }
    };

    checkUserSession();
  }, [router]);

  // useEffect para deshabilitar el botón físico de regresar en dispositivos Android y evitar volver a la pantalla de login
  useEffect(() => {
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  // Función para manejar el inicio de sesión del usuario, validando entradas y navegando según el resultado
  const handleLogin = async () => {
    setLoading(true);
    try {
      // Validación de que los campos email y contraseña estén completos
      if (!email || !password) {
        Alert.alert('Error', 'Por favor, completa todos los campos.');
        return;
      }

      // Realiza la autenticación mediante Firebase usando email y contraseña
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (user.emailVerified) {
        // Obtiene datos adicionales del usuario de Firestore si existen
        const docRef = doc(db, "usersData", user.uid);
        const docSnap = await getDoc(docRef);
        const sessionUser = docSnap.exists()
          ? { uid: user.uid, email: user.email, emailVerified: user.emailVerified, name: docSnap.data().name || "" }
          : { uid: user.uid, email: user.email, emailVerified: user.emailVerified };

        await AsyncStorage.setItem('userSession', JSON.stringify(sessionUser));
        // Navega a la pantalla correcta en función de la existencia de datos adicionales
        docSnap.exists() ? router.replace('/homeScreen') : router.replace('/askPersonalData');
      } else {
        // Si el correo no está verificado, muestra un mensaje y ofrece enviar el correo de verificación
        Alert.alert(
          'Verificación pendiente',
          'Tu correo electrónico no ha sido verificado. ¿Quieres que enviemos un correo de verificación?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Enviar', onPress: () => sendEmailVerification(user) }
          ]
        );
      }
    } catch (error) {
      // Manejo de errores de autenticación con mensajes específicos para cada código de error
      const errorCode = (error as any).code;
      let errorMessage = 'Correo o contraseña incorrectos.';
      if (errorCode === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta.';
      if (errorCode === 'auth/user-not-found') errorMessage = 'No se encontró ninguna cuenta con esas credenciales.';
      Alert.alert('Error', errorMessage);
      console.error("Error en login:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función que activa la accesibilidad TalkBack, solicitando al usuario abrir la configuración de accesibilidad si no está activada
  const handleTalkbackActivation = () => {
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (!enabled) {
        Alert.alert(
          'Activar TalkBack',
          'TalkBack no está activado. Por favor, abre el apartado de accesibilidad.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir configuración',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Alert.alert('Opción no disponible', 'No se puede abrir en iOS.');
                } else {
                  IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.ACCESSIBILITY_SETTINGS);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('TalkBack ya está activado.');
      }
    });
  };

  // Función para cerrar sesión: cierra sesión en Firebase y limpia los datos almacenados localmente
  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem('userSession');
      await AsyncStorage.removeItem('notificationToken');
      await TaskManager.unregisterAllTasksAsync(); // Cancela todas las tareas en segundo plano
      await AsyncStorage.setItem('notificationsEnabled', 'false'); // Deshabilita notificaciones al cerrar sesión
      router.replace('/');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    // Contenedor principal con estilos condicionados según el tema (claro o base)
    <SafeAreaView style={[
      styles.container,
      tema === "claro" ? styles.claro : styles.base,
      isProtanopia ? styles.protanopia : null,
      isDeuteranopia ? styles.deuteranopia : null,
      isTritanopia ? styles.tritanopia : null,
      isMonochromatic ? styles.monochromatic : null,
      isDaltonism ? styles.daltonism : null,
    ]}>
      {/* Sección superior: Botón para activar TalkBack y explicación */}
      <View style={styles.talkbackContainer}>
        <TouchableOpacity style={styles.talkbackButton} onPress={handleTalkbackActivation}>
          <Image source={require('../assets/images/settingsimg.png')} style={styles.settingsIcon} />
        </TouchableOpacity>
        <Text style={styles.talkbackText}>Activar TalkBack</Text>
      </View>
      <StatusBar barStyle="light-content" />
      <Image source={require('../assets/images/splash.png')} style={styles.logo} />
      <Text style={[styles.title, tema === "claro" ? styles.textColorBlack : {}]}>Iniciar Sesión</Text>
      {/* Campo de entrada para el correo electrónico */}
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError('');
        }}
        style={[styles.input, tema === "claro" ? styles.inputClaro : styles.input]}
        placeholderTextColor="#ccc"
      />
      {/* Campo de entrada para la contraseña */}
      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
        }}
        secureTextEntry
        style={[styles.input, tema === "claro" ? styles.inputClaro : styles.input]}
        placeholderTextColor="#ccc"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {loading ? (
        // Indicador visual mientras se procesa la solicitud de inicio de sesión
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      )}
      {/* Enlaces para registrarse o recuperar contraseña */}
      <TouchableOpacity onPress={() => router.push('/registro')}>
        <Text style={styles.loginText}>¿No tienes una cuenta? Regístrate</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/recoverPassword')}>
        <Text style={styles.loginText}>¿Olvidaste tu contraseña? Restablécela</Text>
      </TouchableOpacity>
      {/* Sección que pregunta si desea recibir notificaciones, en caso de no estar habilitadas */}
      {!notificationsEnabled && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationText}>¿Deseas recibir notificaciones?</Text>
          <TouchableOpacity
            style={[
              styles.notificationButton,
              notificationsEnabled ? styles.notificationButtonEnabled : styles.notificationButtonDisabled
            ]}
            onPress={() => setNotificationsEnabled(true)}
          >
            <Text style={styles.notificationButtonText}>{notificationsEnabled ? 'Sí' : 'No'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// Estilos para los componentes de la pantalla de inicio de sesión
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
  inputClaro: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
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
  base: {
    backgroundColor: "#2a3b4c",
  },
  claro: {
    backgroundColor: "#FFFFFF",
  },
  textColorBlack: {
    color: '#000',
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  notificationText: {
    color: '#fff',
    marginRight: 8,
  },
  notificationButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  notificationButtonEnabled: {
    backgroundColor: '#4CAF50',
  },
  notificationButtonDisabled: {
    backgroundColor: '#FF0000',
  },
  notificationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  talkbackContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    alignItems: 'center',
    zIndex: 100,
  },
  talkbackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  talkbackText: {
    marginTop: 4,
    fontSize: 12,
    color: '#fff',
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
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
