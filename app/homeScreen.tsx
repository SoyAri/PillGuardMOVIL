import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, deleteDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming, withRepeat } from 'react-native-reanimated';
import { fetchAiComment } from '../chatgptconfig'; // Importar la función para obtener comentarios de la IA
import { app } from '../firebaseConfig';

// Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export default function HomeScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [nextMedication, setNextMedication] = useState(null);
  const [nextMedicationNotes, setNextMedicationNotes] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [aiComment, setAiComment] = useState('Aquí aparecerán comentarios y sugerencias generados por la IA.');
  const router = useRouter();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const gradientStartX = useSharedValue(0);
  const gradientEndX = useSharedValue(1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.exp) });
    translateY.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.exp) });
    gradientStartX.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, true);
    gradientEndX.value = withRepeat(withTiming(0, { duration: 3000, easing: Easing.linear }), -1, true);

    const fetchNewCommentOnMount = async () => {
      const comment = await fetchAiComment();
      setAiComment(comment);
      textOpacity.value = 0;
      textOpacity.value = withTiming(1, { duration: 2000, easing: Easing.out(Easing.exp) });
    };

    fetchNewCommentOnMount();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Usuario autenticado:", user.uid);
        try {
          const userDocRef = doc(db, "usersData", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setName(userData.name || "Usuario sin nombre");

            const userName = `${userData.name}_${userData.paternalLastname}_${userData.maternalLastname}`;
            const pillsRef = collection(db, "usersPills", userName, "pills");
            const q = query(pillsRef, orderBy("timestamp"), limit(1));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const nextPill = querySnapshot.docs[0].data();
              setNextMedication(nextPill.name);
              setNextMedicationNotes(nextPill.notes || null);
              setStartDate(nextPill.startDate);
              setEndDate(nextPill.endDate);

              // Verificar si la pastilla ha llegado a su fecha de finalización
              if (nextPill.endDate && new Date().getTime() >= nextPill.endDate) {
                await deleteDoc(querySnapshot.docs[0].ref);
                setNextMedication(null);
                setNextMedicationNotes(null);
                setStartDate(null);
                setEndDate(null);
                Alert.alert('Aviso', `Hoy terminaste con tu medicación de ${nextPill.name}.`);
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
      } else {
        console.warn("No hay usuario autenticado.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const getFormattedDate = (timestamp) => {
    const date = new Date(timestamp);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
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
          <Text style={styles.date}>{getFormattedDate(new Date().getTime())}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/settingsScreen')}>
          <Image source={require('../assets/images/settingsimg.png')} style={styles.settingsIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Calendar
          style={styles.calendar}
          markedDates={{
            '2024-12-29': {selected: true, marked: true, selectedColor: '#00adf5'},
          }}
        />

        {nextMedication && (
          <View style={styles.nextMedication}>
            <Text style={styles.nextMedicationText}>Próxima medicación: <Text style={{ fontWeight: 'bold' }}>{nextMedication}</Text></Text>
            {nextMedicationNotes && (
              <Text style={styles.nextMedicationNotes}>Notas: <Text style={{ fontWeight: 'bold' }}>{nextMedicationNotes}</Text></Text>
            )}
            {startDate && (
              <Text style={styles.nextMedicationNotes}>Fecha de inicio: <Text style={{ fontWeight: 'bold' }}>{getFormattedDate(startDate)}</Text></Text>
            )}
            {endDate && (
              <Text style={styles.nextMedicationNotes}>Fecha de fin: <Text style={{ fontWeight: 'bold' }}>{getFormattedDate(endDate)}</Text></Text>
            )}
          </View>
        )}

        <Text style={styles.extraText}>Última medicación: </Text>

        {/* Cajón para comentarios de la IA */}
        <Animated.View style={[styles.aiCommentContainer, animatedStyle]}>
          <LinearGradient
            colors={['#007AFF', '#40d72b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.aiHeader}>
              <Image source={require('../assets/images/bioai.png')} style={styles.bioAiImage} />
              <Text style={styles.aiCommentTitle}>Luna BOT</Text>
            </View>
            <Animated.Text style={[styles.aiCommentText, textAnimatedStyle]}>{aiComment}</Animated.Text>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Botón fijo para gestionar pastillas */}
      <View style={styles.fixedButtonContainer}>
        <Button title="Gestionar pastillas" onPress={() => router.push('/managePills')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#212c39',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
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
    color: '#fff',
  },
  date: {
    fontSize: 16,
    color: '#ccc',
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
  scrollView: {
    flex: 1,
  },
  calendar: {
    marginBottom: 20,
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
  extraText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 10,
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
  addButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
});