import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Platform, StatusBar } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from '../firebaseConfig';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importa AsyncStorage

const db = getFirestore(app);
const auth = getAuth(app);

export default function ManagePillsScreen() {
  const [pills, setPills] = useState([]);
  const [originalPills, setOriginalPills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentPillIndex, setCurrentPillIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const router = useRouter();

  const colors = [
    { name: 'Amarillo', value: '#FFFF00' },
    { name: 'Rojo', value: '#FF0000' },
    { name: 'Verde', value: '#00FF00' },
    { name: 'Azul', value: '#0000FF' },
    { name: 'Rosado', value: '#ff00ef' },
    { name: 'Azul Cian', value: '#00FFFF' },
  ];

  useEffect(() => {
    const fetchPills = async () => {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        const user = JSON.parse(userSession);
        if (user && user.emailVerified) {
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
            setOriginalPills(JSON.parse(JSON.stringify(pillsData))); // Guardar una copia de los datos originales
          } else {
            console.warn("No se encontraron datos para el usuario.");
          }
        }
      }
    };

    fetchPills();
  }, []);

  const addPill = () => {
    const newOrder = pills.length > 0 ? Math.max(...pills.map(pill => pill.order)) + 1 : 1;
    const newPill = { id: null, name: '', time: new Date().getTime(), notes: '', startDate: new Date().getTime(), endDate: null, order: newOrder, color: '#FFFF00' };
    setPills([...pills, newPill]);
    setEditingIndex(pills.length); // Habilitar automáticamente los campos de la nueva pastilla
  };

  const handleInputChange = (index, field, value) => {
    const newPills = [...pills];
    newPills[index][field] = value;
    setPills(newPills);
  };

  const handleColorChange = (index, color) => {
    handleInputChange(index, 'color', color);
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
                const userSession = await AsyncStorage.getItem('userSession');
                if (userSession) {
                  const user = JSON.parse(userSession);
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

  const handleSavePill = async (index) => {
    const pill = pills[index];
    if (!pill.name || !pill.time) {
      setError('Por favor, llene todos los campos obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        const user = JSON.parse(userSession);
        const userId = user.uid;
        const userDocRef = doc(db, "usersData", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userName = `${userData.name}_${userData.paternalLastname}_${userData.maternalLastname}`;

          if (pill.id) {
            const pillDocRef = doc(db, "usersPills", userName, "pills", pill.id);
            await updateDoc(pillDocRef, {
              name: pill.name,
              time: pill.time,
              notes: pill.notes,
              startDate: pill.startDate,
              endDate: pill.endDate,
              order: pill.order,
              color: pill.color, // Guardar el color seleccionado
            });
          } else {
            const newPillRef = await addDoc(collection(db, "usersPills", userName, "pills"), {
              name: pill.name,
              time: pill.time,
              notes: pill.notes,
              startDate: pill.startDate,
              endDate: pill.endDate,
              timestamp: new Date().getTime(),
              order: pill.order,
              color: pill.color, // Guardar el color seleccionado
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
          Alert.alert('Éxito', 'La píldora se ha guardado correctamente.');
          setOriginalPills(JSON.parse(JSON.stringify(pills))); // Actualizar los datos originales
        } else {
          console.warn("No se encontraron datos para el usuario.");
        }
        setEditingIndex(null);
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

  const hasChanges = (index) => {
    const originalPill = originalPills[index];
    const currentPill = pills[index];
    return JSON.stringify(originalPill) !== JSON.stringify(currentPill);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestionar Pastillas</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {pills.map((pill, index) => (
          <View key={index} style={styles.pillContainer}>
            <Text style={styles.label}>Pastilla {index + 1}</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la pastilla"
              value={pill.name}
              onChangeText={(text) => handleInputChange(index, 'name', text)}
              editable={editingIndex === index}
            />
            <TextInput
              style={styles.input}
              placeholder="Notas"
              value={pill.notes}
              onChangeText={(text) => handleInputChange(index, 'notes', text)}
              editable={editingIndex === index}
            />
            <TouchableOpacity onPress={() => { setCurrentPillIndex(index); setShowEndDatePicker(true); }} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>
                {pill.endDate ? `Fecha de fin: ${new Date(pill.endDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Seleccionar fecha de fin'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.colorLabel}>Color asignado:</Text>
            <View style={styles.colorSelectorContainer}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.value },
                    pill.color === color.value && styles.selectedColorOption,
                  ]}
                  onPress={() => editingIndex === index && handleColorChange(index, color.value)}
                >
                  {pill.color === color.value && <View style={styles.innerCircle} />}
                </TouchableOpacity>
              ))}
            </View>
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
            {editingIndex === index ? (
              hasChanges(index) && (
                <TouchableOpacity onPress={() => handleSavePill(index)} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity onPress={() => setEditingIndex(index)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            )}
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
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addPillButton}
          onPress={addPill}
        >
          <Text style={styles.addPillButtonText}>Añadir otra pastilla</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/homeScreen')}
        >
          <Text style={styles.homeButtonText}>Regresar a inicio</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator size="large" color="#007AFF" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212c39',
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 16,
    paddingBottom: 0,
    marginTop: -50,
    backgroundColor: '#212c39',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
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
  colorLabel: {
    fontSize: 16,
    color: '#fff',
    marginTop: 10,
  },
  colorSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  colorOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderColor: '#000',
  },
  innerCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#000',
  },
  editButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#212c39',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  addPillButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  addPillButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  homeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  homeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});