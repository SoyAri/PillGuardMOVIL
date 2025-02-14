import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from '../firebaseConfig';
import { useRouter } from 'expo-router';

const db = getFirestore(app);
const auth = getAuth(app);

export default function ManagePillsScreen() {
  const [pills, setPills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentPillIndex, setCurrentPillIndex] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPills = async () => {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userDocRef = doc(db, "usersData", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userName = `${userData.name}_${userData.paternalLastname}_${userData.maternalLastname}`;
          const pillsRef = collection(db, "usersPills", userName, "pills");
          const querySnapshot = await getDocs(pillsRef);
          const pillsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          pillsData.sort((a, b) => a.order - b.order);
          setPills(pillsData);
        } else {
          console.warn("No se encontraron datos para el usuario.");
        }
      }
    };

    fetchPills();
  }, []);

  const addPill = () => {
    const newOrder = pills.length > 0 ? Math.max(...pills.map(pill => pill.order)) + 1 : 1;
    setPills([...pills, { id: null, name: '', time: new Date().getTime(), notes: '', startDate: new Date().getTime(), endDate: null, order: newOrder }]);
  };

  const handleInputChange = (index, field, value) => {
    const newPills = [...pills];
    newPills[index][field] = value;
    setPills(newPills);
  };

  const handleDeletePill = async (index) => {
    const pillToDelete = pills[index];
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro que quieres borrar ${pillToDelete.name}?`,
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: async () => {
            setDeletingIndex(index);
            try {
              if (pillToDelete.id) {
                const user = auth.currentUser;
                if (user) {
                  const userId = user.uid;
                  const userDocRef = doc(db, "usersData", userId);
                  const userDocSnap = await getDoc(userDocRef);

                  if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const userName = `${userData.name}_${userData.paternalLastname}_${userData.maternalLastname}`;
                    const pillDocRef = doc(db, "usersPills", userName, "pills", pillToDelete.id);
                    await deleteDoc(pillDocRef);
                  }
                }
              }
              const newPills = pills.filter((_, i) => i !== index);
              setPills(newPills);
              Alert.alert('Éxito', 'La píldora se ha eliminado correctamente.');
              router.replace('/homeScreen');
            } catch (error) {
              console.error("Error eliminando la píldora:", error);
            } finally {
              setDeletingIndex(null);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleSubmit = async () => {
    for (const pill of pills) {
      if (!pill.name || !pill.time) {
        setError('Por favor, llene todos los campos obligatorios.');
        return;
      }
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userDocRef = doc(db, "usersData", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userName = `${userData.name}_${userData.paternalLastname}_${userData.maternalLastname}`;

          for (const pill of pills) {
            if (pill.id) {
              const pillDocRef = doc(db, "usersPills", userName, "pills", pill.id);
              await updateDoc(pillDocRef, {
                name: pill.name,
                time: pill.time,
                notes: pill.notes,
                startDate: pill.startDate,
                endDate: pill.endDate,
                order: pill.order
              });
            } else {
              const newPillRef = await addDoc(collection(db, "usersPills", userName, "pills"), {
                name: pill.name,
                time: pill.time,
                notes: pill.notes,
                startDate: pill.startDate,
                endDate: pill.endDate,
                timestamp: new Date().getTime(),
                order: pill.order
              });

              if (pill.endDate) {
                const durationMs = pill.endDate - pill.startDate;
                setTimeout(async () => {
                  await deleteDoc(newPillRef);
                  setPills((prevPills) => prevPills.filter((p) => p.id !== newPillRef.id));
                  Alert.alert('Aviso', `Hoy terminaste con tu medicación de ${pill.name}.`);
                }, durationMs);
              }
            }
          }
          Alert.alert('Éxito', 'La(s) píldora(s) se han guardado correctamente.');
        } else {
          console.warn("No se encontraron datos para el usuario.");
        }
        router.replace('/homeScreen');
      }
    } catch (e) {
      console.error("Error adding/updating document: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEndDateSelect = (day) => {
    const [year, month, dayOfMonth] = day.dateString.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, dayOfMonth);
    handleInputChange(currentPillIndex, 'endDate', selectedDate.getTime());
    setShowEndDatePicker(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestionar Pastillas</Text>
      {pills.map((pill, index) => (
        <View key={index} style={styles.pillContainer}>
          <Text style={styles.label}>Pastilla {index + 1}</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de la pastilla"
            value={pill.name}
            onChangeText={(text) => handleInputChange(index, 'name', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Notas"
            value={pill.notes}
            onChangeText={(text) => handleInputChange(index, 'notes', text)}
          />
          <TouchableOpacity onPress={() => { setCurrentPillIndex(index); setShowEndDatePicker(true); }} style={styles.dateButton}>
            <Text style={styles.dateButtonText}>
              {pill.endDate ? `Fecha de fin: ${new Date(pill.endDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Seleccionar fecha de fin'}
            </Text>
          </TouchableOpacity>
          <Modal visible={showEndDatePicker} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
              <Calendar
                onDayPress={handleEndDateSelect}
                markedDates={{
                  [pills[currentPillIndex]?.endDate ? new Date(pills[currentPillIndex].endDate).toISOString().split('T')[0] : '']: {
                    selected: true,
                    marked: true,
                    selectedColor: '#00adf5'
                  }
                }}
              />
              <Button title="Cerrar" onPress={() => setShowEndDatePicker(false)} />
            </View>
          </Modal>
          {pill.id && (
            deletingIndex === index ? (
              <ActivityIndicator size="small" color="#ff4b4b" />
            ) : (
              <TouchableOpacity onPress={() => handleDeletePill(index)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      ))}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <Button title="Añadir otra pastilla" onPress={addPill} />
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <Button title="Guardar" onPress={handleSubmit} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#212c39',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
  },
  pillContainer: {
    width: '100%',
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#2a3b4c',
    borderRadius: 10,
  },
  label: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 8,
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
  dateButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  dateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff4b4b',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4b4b',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});