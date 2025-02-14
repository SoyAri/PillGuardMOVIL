import { useRouter } from 'expo-router';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, deleteDoc } from "firebase/firestore";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
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
  const router = useRouter();

  useEffect(() => {
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
      <View style={styles.addButtonContainer}>
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
  addButtonContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});