// Componente principal de la pantalla de inicio. Administra el estado, carga datos de usuario y pastillas,
// controla animaciones, notificaciones y renderiza las principales áreas de la UI.
import AsyncStorage from "@react-native-async-storage/async-storage"; // Importa AsyncStorage para almacenamiento local
import { LinearGradient } from "expo-linear-gradient"; // Exporta el gradiente lineal para efectos visuales
import * as Notifications from 'expo-notifications'; // Maneja notificaciones
import { useFocusEffect, useRouter } from "expo-router"; // Maneja navegación y efectos al enfocar la pantalla
import { getAuth } from "firebase/auth"; // Gestor de autenticación de Firebase
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore"; // Funciones para manipular Firestore
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Calendar } from "react-native-calendars"; // Componente calendario para selección de fechas
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated"; // Manejo de animaciones
import { fetchAiComment } from "../assistantconfig"; // Función para obtener comentarios generados por IA
import { app } from "../firebaseConfig"; // Inicialización de Firebase
import { scheduleNotification } from "../notificationUtils"; // Función para programar notificaciones

// Inicialización de autenticación y base de datos
const auth = getAuth(app);
const db = getFirestore(app);

// Función para obtener y definir el tema almacenado en AsyncStorage
const fetchTheme = async (setTema) => {
  const selectedTheme = await AsyncStorage.getItem('tema'); 
  setTema(selectedTheme || "Temabase");
};

// Función para calcular el tiempo restante para la siguiente dosis de pastilla
const getRemainingTime = (pill) => {
  const now = new Date().getTime();
  const intervalMs = (parseInt(pill.intervalHours) * 60 * 60 * 1000) + (parseInt(pill.intervalMinutes) * 60 * 1000);
  let nextDoseTime = pill.time;

  while (nextDoseTime < now) {
    nextDoseTime += intervalMs;
  }

  const remainingTimeMs = nextDoseTime - now;
  const hours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours} horas y ${minutes} minutos`;
};

export default function HomeScreen() {
  // Estados para datos del usuario, pastillas, tema, comentario de la IA y control de UI
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [pills, setPills] = useState([]);
  const [tema, setTema] = useState("Temabase");
  const [aiComment, setAiComment] = useState(
    "Aquí aparecerán comentarios y sugerencias generados por la IA."
  );
  const router = useRouter();
  const nextMedication = ""; // Variable para la próxima medicación
  const nextMedicationNotes = ""; // Notas de la próxima medicación
  const startDate = ""; // Fecha de inicio de la medicación
  const endDate = ""; // Fecha de fin de la medicación
  const today = new Date();
  const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Elimina la diferencia horaria
  const formattedDate = localDate.toISOString().split('T')[0];

  // Variables de animación
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const gradientStartX = useSharedValue(0);
  const gradientEndX = useSharedValue(1);
  const textOpacity = useSharedValue(0);
  const markedDates = {
    [formattedDate]: { selected: true, marked: true, selectedColor: '#007AFF' },
  };

  // Estado para la pastilla seleccionada y notificaciones in-app
  const [selectedPill, setSelectedPill] = useState(null); // State for selected pill
  const [notificationVisible, setNotificationVisible] = useState(false); // State for notification visibility
  const [inAppNotification, setInAppNotification] = useState(null);

  // Marcado de fechas en el calendario según la fecha final de cada pastilla
  pills.forEach(pill => {
    if (pill.endDate) {
      const endDate = new Date(pill.endDate).toISOString().split('T')[0];
      markedDates[endDate] = { marked: true, dotColor: pill.color };
    }
  });

  // NUEVOS estados para efectos visuales:
  const [isProtanopia, setIsProtanopia] = useState(false);
  const [isDeuteranopia, setIsDeuteranopia] = useState(false);
  const [isTritanopia, setIsTritanopia] = useState(false);
  const [isMonochromatic, setIsMonochromatic] = useState(false);
  const [isDaltonism, setIsDaltonism] = useState(false);

  // NUEVO useEffect para cargar efectos visuales desde AsyncStorage
  useEffect(() => {
    const loadVisualEffects = async () => {
      const protanopiaGuardado = await AsyncStorage.getItem('protanopia');
      if (protanopiaGuardado !== null) {
        setIsProtanopia(protanopiaGuardado === 'true');
      }
      const deuteranopiaGuardado = await AsyncStorage.getItem('deuteranopia');
      if (deuteranopiaGuardado !== null) {
        setIsDeuteranopia(deuteranopiaGuardado === 'true');
      }
      const tritanopiaGuardado = await AsyncStorage.getItem('tritanopia');
      if (tritanopiaGuardado !== null) {
        setIsTritanopia(tritanopiaGuardado === 'true');
      }
      const monochromaticGuardado = await AsyncStorage.getItem('monochromatic');
      if (monochromaticGuardado !== null) {
        setIsMonochromatic(monochromaticGuardado === 'true');
      }
      const daltonismGuardado = await AsyncStorage.getItem('daltonism');
      if (daltonismGuardado !== null) {
        setIsDaltonism(daltonismGuardado === 'true');
      }
    };
    loadVisualEffects();
  }, []);

  // useEffect para animaciones y carga inicial del comentario de la IA
  useEffect(() => {
    // Anima opacidad y posición de entrada de la vista
    opacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
    translateY.value = withTiming(0, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
    // Anima gradiente de forma repetitiva
    gradientStartX.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      true
    );
    gradientEndX.value = withRepeat(
      withTiming(0, { duration: 3000, easing: Easing.linear }),
      -1,
      true
    );

    // Solicita un nuevo comentario a la IA al montar el componente
    const fetchNewCommentOnMount = async () => {
      const comment = await fetchAiComment();
      setAiComment(comment);
      textOpacity.value = 0;
      textOpacity.value = withTiming(1, {
        duration: 2000,
        easing: Easing.out(Easing.exp),
      });
    };

    fetchNewCommentOnMount();

    return () => {
      // Limpieza de efectos secundarios si es necesario
    };
  }, []);

  // useEffect para solicitar permisos de notificaciones según el sistema operativo
  useEffect(() => {
    const requestNotificationPermissions = async () => {
      if (Platform.OS === 'android') {
        // Solicita permisos para Android
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso denegado', 'No se pueden enviar notificaciones sin permisos.');
        }
      } else if (Platform.OS === 'ios') {
        // Solicita permisos para iOS
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

    requestNotificationPermissions();
  }, []);

  // useEffect para escuchar notificaciones en primer plano y actualizar el estado inAppNotification
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      // Actualizar estado con el contenido de la notificación
      setInAppNotification(notification.request.content);
      // Desaparecer en 5 segundos
      setTimeout(() => setInAppNotification(null), 5000);
    });
    return () => subscription.remove();
  }, []);

  // Función para cargar datos del usuario usando AsyncStorage y Firebase
  const loadUserData = async () => {
    try {
      const sessionStr = await AsyncStorage.getItem("userSession");
      console.log("DEBUG: AsyncStorage userSession:", sessionStr);
      if (!sessionStr) {
        console.warn("No hay sesión almacenada. Redirigiendo a registro...");
        return router.replace('/registro');
      }
      const sessionUser = JSON.parse(sessionStr);
      console.log("DEBUG: Session user:", sessionUser);
      if (!(sessionUser && sessionUser.uid && sessionUser.emailVerified)) {
        console.warn("Sesión inválida. Redirigiendo a registro...");
        return router.replace('/registro');
      }
      const userDocRef = doc(db, "usersData", sessionUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      console.log("DEBUG: Firebase doc exists:", userDocSnap.exists());
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log("DEBUG: Firebase userData:", userData);
        // Si no se obtiene 'name' desde Firebase, usar displayName de la sesión
        setName(userData.name ? userData.name : (sessionUser.displayName || "Usuario sin nombre"));
      } else {
        console.warn("No se encontró documento en Firebase, usando displayName de la sesión.");
        setName(sessionUser.displayName || "Usuario sin nombre");
      }
    } catch (error) {
      console.error("ERROR: Cargando datos del usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar los datos de las pastillas del usuario desde Firestore
  const loadPills = async (setPills) => {
    try {
      const userSession = await AsyncStorage.getItem("userSession");
      console.log("Loading pills, userSession:", userSession);
      if (!userSession) return;
      const sessionUser = JSON.parse(userSession);
      if (!(sessionUser && sessionUser.uid)) return;
      const pillsRef = collection(db, "usersPills", sessionUser.uid, "pills");
      const querySnapshot = await getDocs(pillsRef);
      const pillsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPills(pillsData);
      console.log("Loaded pills:", pillsData);
    } catch (error) {
      console.error("Error loading pills:", error);
    }
  };

  // useFocusEffect para recargar datos cada vez que la pantalla se active
  useFocusEffect(
    React.useCallback(() => {
      fetchTheme(setTema); // Obtiene y aplica el tema al instante
      loadUserData();
      loadPills(setPills);
    }, [router])
  );

  // Función para obtener un saludo adecuado según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  // Función para formatear fechas con formato largo en Español
  const getFormattedDate = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  // Animación general para contenedores
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  // Animación para el gradiente
  const gradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      start: { x: gradientStartX.value, y: 0 },
      end: { x: gradientEndX.value, y: 1 },
    };
  });

  // Animación para el texto del comentario de la IA
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  // Función que se ejecuta al presionar una pastilla y muestra notificación in-app
  const handlePillPress = (pill) => {
    setSelectedPill(pill);
    setNotificationVisible(true);
    setTimeout(() => {
      setNotificationVisible(false);
    }, 5000); // Hide notification after 5 seconds
  };

  // useEffect para programar notificaciones de pastillas cada minuto
  useEffect(() => {
    const checkPillNotifications = async () => {
      const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (JSON.parse(notificationsEnabled)) {
        pills.forEach(pill => {
          if (pill.notificationsEnabled) {
            const remainingTime = getRemainingTime(pill);
            if (remainingTime === "0 horas y 0 minutos") {
              scheduleNotification(pill);
            }
          }
        });
      }
    };

    const intervalId = setInterval(checkPillNotifications, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [pills]);

  // Renderizado condicional: muestra ActivityIndicator mientras se cargan los datos
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Renderizado principal de la pantalla de inicio
  return (
    <SafeAreaView
      style={[
        styles.container,
        tema === 'claro' ? styles.claro : styles.base,
        isProtanopia ? styles.protanopia : null,
        isDeuteranopia ? styles.deuteranopia : null,
        isTritanopia ? styles.tritanopia : null,
        isMonochromatic ? styles.monochromatic : null,
        isDaltonism ? styles.daltonism : null,
      ]}
    >
      <StatusBar barStyle="light-content" />
      {/* Banner de notificación in-app en el header */}
      {inAppNotification && (
        <View style={styles.inAppBanner}>
          <Text style={styles.bannerTitle}>{inAppNotification.title}</Text>
          <Text style={styles.bannerBody}>{inAppNotification.body}</Text>
        </View>
      )}
      {/* Encabezado con saludo, fecha y botón para acceder a configuraciones */}
      <View style={styles.header}>
        <View>
          <Text
            style={[
              styles.greeting,
              tema === 'claro' ? styles.textColorBlack : {},
            ]}
          >
            {`${getGreeting()}, ${name}!`}
          </Text>
          <Text
            style={[
              styles.date,
              tema === 'claro' ? styles.textColorBlack : {},
            ]}
          >
            {getFormattedDate(new Date().getTime())}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/settingsScreen')}
        >
          <Image
            source={require('../assets/images/settingsimg.png')}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>
      </View>

      {/* ScrollView que contiene el calendario, listado de pastillas, comentarios de la IA, y notificaciones */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollViewContent,
          tema === 'claro' ? styles.claro : styles.base,
        ]}
      >
        {/* Calendario con fechas marcadas */}
        <Calendar
          style={[styles.calendar, { backgroundColor: '#2a3b4c' }]} // Fondo del calendario
          // Configuración del tema del calendario
          theme={{
            calendarBackground: '#2a3b4c', // Fondo del calendario
            textSectionTitleColor: '#b6c1cd', // Color del título de la sección de texto
            textSectionTitleDisabledColor: '#d9e1e8', // Color del título de la sección de texto deshabilitado
            selectedDayBackgroundColor: '#007AFF', // Fondo del día seleccionado
            selectedDayTextColor: '#ffffff', // Color del texto del día seleccionado
            todayTextColor: '#00adf5', // Color del texto del día de hoy
            dayTextColor: '#ffffff', // Color del texto del día
            textDisabledColor: '#555', // Color del texto deshabilitado
            dotColor: '#00adf5', // Color del punto
            selectedDotColor: '#ffffff', // Color del punto seleccionado
            arrowColor: '#00adf5', // Color de las flechas
            disabledArrowColor: '#d9e1e8', // Color de las flechas deshabilitadas
            monthTextColor: '#b6c1cd', // Color del texto del mes
            indicatorColor: '#00adf5', // Color del indicador
            textDayFontFamily: 'monospace', // Familia de fuentes del texto del día
            textMonthFontFamily: 'monospace', // Familia de fuentes del texto del mes
            textDayHeaderFontFamily: 'monospace', // Familia de fuentes del texto del encabezado del día
            textDayFontWeight: '300', // Peso de la fuente del texto del día
            textMonthFontWeight: 'bold', // Peso de la fuente del texto del mes
            textDayHeaderFontWeight: '300', // Peso de la fuente del texto del encabezado del día
            textDayFontSize: 16, // Tamaño de la fuente del texto del día
            textMonthFontSize: 16, // Tamaño de la fuente del texto del mes
            textDayHeaderFontSize: 16 // Tamaño de la fuente del texto del encabezado del día
          }}
          markedDates={markedDates}
        />

        {/* Listado de pastillas registradas */}
        {pills.map((pill, index) => (
          <TouchableOpacity key={index} style={styles.pillContainer} onPress={() => handlePillPress(pill)}>
            <View
              style={[styles.colorBar, { backgroundColor: pill.color }]}
            />
            <View style={styles.pillContent}>
              <Text style={styles.pillName}>{pill.name}</Text>
              {pill.notes && (
                <Text style={styles.pillNotes}>Notas: {pill.notes}</Text>
              )}
              <Text style={styles.pillDate}>
                Fecha de inicio: {getFormattedDate(pill.startDate)}
              </Text>
              {pill.endDate && (
                <Text style={styles.pillDate}>
                  Fecha de fin: {getFormattedDate(pill.endDate)}
                </Text>
              )}
              <Text style={styles.pillInterval}>
                Intervalo de horas: {pill.intervalHours}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Sección de la próxima medicación (se muestra si nextMedication tiene valor) */}
        {nextMedication && (
          <View
            style={[
              styles.nextMedication,
              tema === 'claro' ? styles.claro : styles.base,
            ]}
          >
            <Text
              style={[
                styles.nextMedicationText,
                tema === 'claro' ? styles.textColorBlack : {},
              ]}
            >
              Próxima medicación:{' '}
              <Text style={{ fontWeight: 'bold' }}>{nextMedication}</Text>
            </Text>
            {nextMedicationNotes && (
              <Text
                style={[
                  styles.nextMedicationNotes,
                  tema === 'claro' ? styles.textColorBlack : {},
                ]}
              >
                Notas:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {nextMedicationNotes}
                </Text>
              </Text>
            )}
            {startDate && (
              <Text
                style={[
                  styles.nextMedicationNotes,
                  tema === 'claro' ? styles.textColorBlack : {},
                ]}
              >
                Fecha de inicio:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {getFormattedDate(startDate)}
                </Text>
              </Text>
            )}
            {endDate && (
              <Text
                style={[
                  styles.nextMedicationNotes,
                  tema === 'claro' ? styles.textColorBlack : {},
                ]}
              >
                Fecha de fin:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {getFormattedDate(endDate)}
                </Text>
              </Text>
            )}
          </View>
        )}

        {/* Área del comentario generado por la IA con animación y gradiente */}
        <Animated.View
          style={[styles.aiCommentContainer, animatedStyle]}
        >
          <LinearGradient
            colors={['#007AFF', '#00adf5']}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.aiHeader}>
              <Image
                source={require('../assets/images/bioai.png')}
                style={styles.bioAiImage}
              />
              <Text
                style={[
                  styles.aiCommentTitle,
                  tema === 'claro' ? styles.textColorBlack : {},
                ]}
              >
                Comentario de Rei´s IA
              </Text>
            </View>
            <Animated.Text
              style={[
                styles.aiCommentText,
                textAnimatedStyle,
                tema === 'claro' ? styles.textColorBlack : {},
              ]}
            >
              {aiComment}
            </Animated.Text>
          </LinearGradient>
        </Animated.View>

        {/* Notificación in-app con información de la pastilla seleccionada */}
        {notificationVisible && (
          <View style={[
            styles.notificationContainer,
            tema === 'claro' ? styles.notificationContainerClaro : styles.notificationContainerDark
          ]}>
            {/* Mostrar solo nombre, nota y tiempo restante */}
            <Text style={[styles.notificationTitle, tema === 'claro' && styles.notificationTitleClaro]}>
              {selectedPill?.name}
            </Text>
            <Text style={[styles.notificationText, tema === 'claro' && styles.notificationTextClaro]}>
              Notas: {selectedPill?.notes}
            </Text>
            <Text style={[styles.notificationText, tema === 'claro' && styles.notificationTextClaro]}>
              Tiempo restante: {getRemainingTime(selectedPill)}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Botón fijo para gestionar pastillas */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.managePillsButton}
          onPress={() => router.push('/managePills')}
        >
          <Text style={styles.managePillsButtonText}>
            Gestionar pastillas
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Definición de estilos para la pantalla
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
  },
  claro: {
    backgroundColor: '#FFFFFF',
  },
  base: {
    backgroundColor: '#212c39',
  },
  textColorBlack: {
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff', // Este color es para el tema oscuro
  },
  date: {
    fontSize: 16,
    color: '#ccc', // Este color es para el tema oscuro
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2a3b4c',
    borderRadius: 10,
  },
  colorBar: {
    width: 5,
    borderRadius: 5,
  },
  pillContent: {
    marginLeft: 10,
    flex: 1,
  },
  pillName: {
    // Se aumenta fontSize de 20 a 22
    fontSize: 22,
    color: '#fff',
  },
  pillNotes: {
    // Se aumenta fontSize de 18 a 20
    fontSize: 20,
    color: '#ccc',
    marginTop: 5,
  },
  pillDate: {
    // Se aumenta fontSize de 18 a 20
    fontSize: 20,
    color: '#ccc',
    marginTop: 5,
  },
  pillInterval: {
    // Se aumenta fontSize de 18 a 20
    fontSize: 20,
    color: '#ccc',
    marginTop: 5,
  },
  nextMedication: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#2a3b4c',
    borderRadius: 10,
  },
  nextMedicationText: {
    fontSize: 18,
    color: '#fff',
  },
  nextMedicationNotes: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 5,
  },
  aiCommentContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gradient: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bioAiImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  aiCommentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  aiCommentText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
    flexWrap: 'wrap',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  managePillsButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  managePillsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  notificationContainer: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    right: '10%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    // Se eliminan los valores fijos de background/color para definirlos dinámicamente.
  },
  notificationContainerClaro: {
    backgroundColor: '#E0F7FA', // Paleta para modo claro
    borderColor: '#000',
    borderWidth: 2,
  },
  notificationContainerDark: {
    backgroundColor: '#37474F', // Paleta para modo oscuro
    borderColor: '#000',
    borderWidth: 2,
  },
  notificationTitle: {
    // Se aumenta fontSize de 18 a 20
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  notificationText: {
    // Se aumenta fontSize de 16 a 18
    fontSize: 18,
    color: '#fff',
  },
  inAppBanner: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 5 : 5,
    left: 0,
    right: 0,
    backgroundColor: '#007AFF',
    padding: 10,
    zIndex: 100,
    alignItems: 'center',
  },
  bannerTitle: {
    fontWeight: 'bold',
    color: '#fff',
  },
  bannerBody: {
    color: '#fff',
  },
  notificationTitleClaro: {
    color: '#000',
  },
  notificationTextClaro: {
    color: '#000',
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
