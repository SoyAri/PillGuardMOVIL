import { useRouter } from "expo-router";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  deleteDoc,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from "react-native-reanimated";
import { fetchAiComment } from "../chatgptconfig"; // Importar la función para obtener comentarios de la IA
import { app } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Importar AsyncStorage

// Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export default function HomeScreen() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [pills, setPills] = useState([]);
  const [aiComment, setAiComment] = useState(
    "Aquí aparecerán comentarios y sugerencias generados por la IA."
  );
  const router = useRouter();
  const today = new Date();
  const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Elimina la diferencia horaria
  const formattedDate = localDate.toISOString().split('T')[0];

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const gradientStartX = useSharedValue(0);
  const gradientEndX = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
    translateY.value = withTiming(0, {
      duration: 1000,
      easing: Easing.out(Easing.exp),
    });
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

    const checkUserSession = async () => {
      const userSession = await AsyncStorage.getItem("userSession");
      if (userSession) {
        const user = JSON.parse(userSession);
        if (user && user.emailVerified) {
          // Usuario autenticado y correo verificado, cargar datos del usuario
          try {
            const userDocRef = doc(db, "usersData", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setName(userData.name || "Usuario sin nombre");

              const userName = `${userData.name}_${userData.paternalLastname}_${userData.maternalLastname}`;
              const pillsRef = collection(db, "usersPills", userName, "pills");
              const q = query(pillsRef, orderBy("timestamp"));
              const querySnapshot = await getDocs(q);

              if (!querySnapshot.empty) {
                const pillsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPills(pillsData);

                // Verificar si alguna pastilla ha llegado a su fecha de finalización
                const now = new Date().getTime();
                for (const pill of pillsData) {
                  if (pill.endDate && now >= pill.endDate) {
                    await deleteDoc(doc(db, "usersPills", userName, "pills", pill.id));
                    setPills(prevPills => prevPills.filter(p => p.id !== pill.id));
                    Alert.alert(
                      "Aviso",
                      `Hoy terminaste con tu medicación de ${pill.name}.`
                    );
                  }
                }
              } else {
                console.warn("No se encontraron pastillas.");
              }
            } else {
              console.warn("No se encontraron datos para el usuario.");
            }
          } catch (error) {
            console.error("Error obteniendo los datos del usuario:", error);
          }
        }
      } else {
        console.warn("No hay usuario autenticado.");
      }
      setLoading(false);
    };

    checkUserSession();

    return () => unsubscribe();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

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

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  const gradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      start: { x: gradientStartX.value, y: 0 },
      end: { x: gradientEndX.value, y: 1 },
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{`${getGreeting()}, ${name}!`}</Text>
          <Text style={styles.date}>
            {getFormattedDate(new Date().getTime())}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push("/settingsScreen")}
        >
          <Image
            source={require("../assets/images/settingsimg.png")}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Calendar
          style={[styles.calendar, { backgroundColor: '#2a3b4c' }]} // Fondo del calendario
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
          markedDates={{
            [formattedDate]: { selected: true, marked: true, selectedColor: '#007AFF' },
          }}
        />

        {pills.map((pill, index) => (
          <View key={index} style={styles.pillContainer}>
            <View style={[styles.colorBar, { backgroundColor: pill.color }]} />
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
            </View>
          </View>
        ))}

        <Text style={styles.extraText}>Última medicación: </Text>

        {/* Cajón para comentarios de la IA */}
        <Animated.View style={[styles.aiCommentContainer, animatedStyle]}>
          <LinearGradient
            colors={["#007AFF", "#40d72b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.aiHeader}>
              <Image
                source={require("../assets/images/bioai.png")}
                style={styles.bioAiImage}
              />
              <Text style={styles.aiCommentTitle}>Luna BOT</Text>
            </View>
            <Animated.Text style={[styles.aiCommentText, textAnimatedStyle]}>
              {aiComment}
            </Animated.Text>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Botón fijo para gestionar pastillas */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={styles.managePillsButton}
          onPress={() => router.push("/managePills")}
        >
          <Text style={styles.managePillsButtonText}>Gestionar pastillas</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#212c39",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  date: {
    fontSize: 16,
    color: "#ccc",
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsIcon: {
    width: 24,
    height: 24,
    tintColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100, // Añadir espacio inferior para evitar que el contenido quede detrás del botón
  },
  calendar: {
    marginBottom: 20,
    borderRadius: 10,
    backgroundColor: "#2a3b4c",
  },
  pillContainer: {
    flexDirection: 'row',
    marginTop: 20,
    padding: 10,
    backgroundColor: "#2a3b4c",
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
    fontSize: 18,
    color: "#fff",
  },
  pillNotes: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 5,
  },
  pillDate: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 5,
  },
  extraText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 10,
  },
  aiCommentContainer: {
    marginTop: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  gradient: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  bioAiImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  aiCommentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 10,
  },
  aiCommentText: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
    flexWrap: "wrap",
  },
  addButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  fixedButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  managePillsButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  managePillsButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
});