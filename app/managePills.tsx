// Archivo que administra la pantalla y lógica de gestión de pastillas.
// Incluye manejo de AsyncStorage, operaciones con Firebase y UI para edición, guardado y eliminación de pastillas.

import AsyncStorage from '@react-native-async-storage/async-storage'; // Manejo de almacenamiento local
import { useRouter } from 'expo-router'; // Navegación entre pantallas
import { getAuth } from "firebase/auth"; // Autenticación Firebase
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, updateDoc } from "firebase/firestore"; // Operaciones con Firestore
import React, { useEffect, useState } from 'react'; // Manejo de estado y efectos de React
import { ActivityIndicator, Alert, Button, Modal, Platform, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars'; // Calendario para selección de fecha
import { app } from '../firebaseConfig'; // Configuración Firebase

const db = getFirestore(app);
const auth = getAuth(app);

// Función para guardar el arreglo de pastillas en AsyncStorage
const savePillsToStorage = async (pills) => {
  try {
    // Convierte a JSON y salva en almacenamiento local
    await AsyncStorage.setItem('pills', JSON.stringify(pills));
  } catch (error) {
    console.error('Error saving pills to storage:', error);
  }
};

// Función para cargar pastillas desde AsyncStorage
const loadPillsFromStorage = async () => {
  try {
    const pillsData = await AsyncStorage.getItem('pills');
    if (pillsData) {
      setPills(JSON.parse(pillsData));
      console.log("DEBUG: Pastillas cargadas del almacenamiento:", JSON.parse(pillsData));
    }
  } catch (error) {
    console.error('Error loading pills from storage:', error);
  }
};

export default function ManagePillsScreen() {
  // Estados para manejo de pastillas, edición, errores y temas
  const [pills, setPills] = useState<Array<{
    id: string | null;
    name: string;
    time: number;
    notes: string;
    intervalHours: string;
    intervalMinutes: string;
    startDate: number;
    endDate: number | null;
    order: number;
    color: string;
    notificationsEnabled: boolean;
  }>>([]);
  const [originalPills, setOriginalPills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [currentPillIndex, setCurrentPillIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [tema, setTema] = useState("Temabase"); // Almacena el tema actual de la UI
  const [pendingTheme, setPendingTheme] = useState("Temabase");
  // Nuevos estados para efectos visuales
  const [isProtanopia, setIsProtanopia] = useState(false);
  const [isDeuteranopia, setIsDeuteranopia] = useState(false);
  const [isTritanopia, setIsTritanopia] = useState(false);
  const [isMonochromatic, setIsMonochromatic] = useState(false);
  const [isDaltonism, setIsDaltonism] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false); // Controla visualización del selector de hora
  const [selectedTime, setSelectedTime] = useState(new Date()); // Hora seleccionada para edición
  const router = useRouter(); // Para redirección entre pantallas

  // Array de colores disponibles para las pastillas
  const colors = [
    { name: 'Amarillo', value: '#FFFF00' },
    { name: 'Rojo', value: '#FF0000' },
    { name: 'Verde', value: '#00FF00' },
    { name: 'Azul', value: '#0000FF' },
    { name: 'Rosado', value: '#ff00ef' },
    { name: 'Azul Cian', value: '#00FFFF' },
  ];

  // useEffect para cargar el tema y pastillas desde AsyncStorage al montar la pantalla
  useEffect(() => {
    // Cargar tema desde AsyncStorage
    const LoadTheme = async () => {
      const temaGuardado = await AsyncStorage.getItem('tema');
      if (temaGuardado) {
        setTema(temaGuardado);
      }
    };
    LoadTheme();
    
    // Cargar las pastillas desde almacenamiento local
    loadPillsFromStorage();
  }, []);

  // Nuevo useEffect para cargar efectos visuales
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

  // useEffect para consultar las pastillas desde Firebase y actualizarlas localmente
  useEffect(() => {
    const fetchPills = async () => {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        const user = JSON.parse(userSession);
        if (user && user.emailVerified) {
          // Consultar las pastillas usando uid para mayor consistencia
          const userKey = user.uid;
          const pillsRef = collection(db, "usersPills", userKey, "pills");
          const querySnapshot = await getDocs(pillsRef);
          const pillsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          pillsData.sort((a, b) => a.order - b.order);
          setPills(pillsData);
          // Almacenar las pastillas obtenidas en AsyncStorage
          await AsyncStorage.setItem('pills', JSON.stringify(pillsData));
          console.log("DEBUG: Pastillas consultadas y guardadas:", pillsData);
        }
      }
    };
    fetchPills();
  }, []);

  // useEffect para solicitar permisos de notificación según la plataforma
  useEffect(() => {
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

    requestNotificationPermissions();
  }, []);

  // useEffect para eliminar automáticamente las pastillas cuya fecha de fin haya expirado
  useEffect(() => {
    const intervalId = setInterval(async () => {
      const now = new Date().getTime();
      const expiredPills = pills.filter(pill => pill.endDate && now >= pill.endDate);
      for (const pill of expiredPills) {
        if (pill.id) {
          try {
            const userSession = await AsyncStorage.getItem('userSession');
            if (userSession) {
              const user = JSON.parse(userSession);
              const pillDocRef = doc(db, "usersPills", user.uid, "pills", pill.id);
              await deleteDoc(pillDocRef);
            }
          } catch (error) {
            console.error("Error deleting expired pill from Firebase:", error);
          }
        }
      }
      if(expiredPills.length > 0) {
        setPills(prevPills => prevPills.filter(pill => !(pill.endDate && now >= pill.endDate)));
        Alert.alert("Aviso", "Se eliminaron pastillas cuya fecha de fin ha expirado");
      }
    }, 60000); // Verificación cada minuto
  
    return () => clearInterval(intervalId);
  }, [pills]);

  // Función para añadir una nueva pastilla con valores predeterminados
  const addPill = () => {
    // Asigna un orden basado en la cantidad actual de pastillas
    const newOrder = pills.length > 0 ? Math.max(...pills.map(pill => pill.order)) + 1 : 1;
    const newPill = { 
      id: null, 
      name: '', 
      time: new Date().getTime(), 
      notes: '', 
      intervalHours: '', 
      intervalMinutes: '', 
      startDate: new Date().getTime(), 
      endDate: null, 
      order: newOrder, 
      color: '#FFFF00', 
      notificationsEnabled: true // Notificaciones activadas por defecto
    };
    setPills([...pills, newPill]);
    // Activa la edición automática para la nueva pastilla
    setEditingIndex(pills.length);
  };

  // Función para actualizar el valor de un campo en una pastilla
  const handleInputChange = (index, field, value) => {
    const newPills = [...pills];
    newPills[index][field] = value;
    setPills(newPills);
  };

  // Función para cambiar el color de una pastilla
  const handleColorChange = (index, color) => {
    handleInputChange(index, 'color', color);
  };

  // Función que gestiona la eliminación de una pastilla, incluyendo notificaciones
  const handleDeletePill = async (index) => {
    const pillToDelete = pills[index];
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro que quieres borrar ${pillToDelete.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: async () => {
            setDeletingIndex(index);
            try {
              if (pillToDelete.id) {
                const userSession = await AsyncStorage.getItem('userSession');
                if (userSession) {
                  const user = JSON.parse(userSession);
                  const userKey = user.uid;
                  const pillDocRef = doc(db, "usersPills", userKey, "pills", pillToDelete.id);
                  await deleteDoc(pillDocRef);
                }
              }
              // Cancelar notificaciones programadas relacionadas con esta pastilla
              const scheduled = await Notifications.getAllScheduledNotificationsAsync();
              for (const notif of scheduled) {
                if (notif.content?.data?.pillId === pillToDelete.id) {
                  await Notifications.cancelScheduledNotificationAsync(notif.identifier);
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

  // Función para guardar (crear o actualizar) una pastilla en Firebase y AsyncStorage
  const handleSavePill = async (index) => {
    const pill = pills[index];
    // Validación de campos obligatorios
    if (!pill.name || !pill.time || (!pill.intervalHours && !pill.intervalMinutes)) {
      setError('Por favor, llene todos los campos obligatorios.');
      return;
    }

    setLoading(true);

    try {
      const userSession = await AsyncStorage.getItem('userSession');
      if (userSession) {
        const user = JSON.parse(userSession);
        const userKey = user.uid; // Usa uid directamente

        if (pill.id) {
          // Actualización de pastilla existente en Firebase
          const pillDocRef = doc(db, "usersPills", userKey, "pills", pill.id);
          await updateDoc(pillDocRef, {
            name: pill.name,
            time: pill.time,
            notes: pill.notes,
            intervalHours: pill.intervalHours,
            intervalMinutes: pill.intervalMinutes,
            startDate: pill.startDate,
            endDate: pill.endDate,
            order: pill.order,
            color: pill.color,
            notificationsEnabled: pill.notificationsEnabled,
          });
        } else {
          // Creación de una nueva pastilla en Firebase
          const newPillRef = await addDoc(collection(db, "usersPills", userKey, "pills"), {
            name: pill.name,
            time: pill.time,
            notes: pill.notes,
            intervalHours: pill.intervalHours,
            intervalMinutes: pill.intervalMinutes,
            startDate: pill.startDate,
            endDate: pill.endDate,
            timestamp: new Date().getTime(),
            order: pill.order,
            color: pill.color,
            notificationsEnabled: pill.notificationsEnabled,
          });

          if (pill.endDate) {
            // Programación de eliminación cuando expire la fecha de fin
            const durationMs = pill.endDate - pill.startDate;
            setTimeout(async () => {
              await deleteDoc(newPillRef);
              setPills((prevPills) => prevPills.filter((p) => p.id !== newPillRef.id));
              Alert.alert('Aviso', `Hoy terminaste con tu medicación de ${pill.name}.`);
            }, durationMs);
          }
        }
        Alert.alert('Éxito', 'La píldora se ha guardado correctamente.');
        // Actualiza la copia original para detectar cambios futuros
        setOriginalPills(JSON.parse(JSON.stringify(pills)));
        await savePillsToStorage(pills);
      }
      setEditingIndex(null);
    } catch (e) {
      console.error("Error adding/updating document: ", e);
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la selección de fecha de fin con el calendario
  const handleEndDateSelect = (day) => {
    const [year, month, dayOfMonth] = day.dateString.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, dayOfMonth);
    const currentDate = new Date();

    if (selectedDate < currentDate) {
      Alert.alert('Fecha inválida', 'La fecha de fin no puede ser anterior a la fecha actual.');
      return;
    }

    handleInputChange(currentPillIndex, 'endDate', selectedDate.getTime());
    setShowEndDatePicker(false);
  };

  // Función para comparar la pastilla actual con su copia original y detectar cambios
  const hasChanges = (index) => {
    const originalPill = originalPills[index];
    const currentPill = pills[index];
    return JSON.stringify(originalPill) !== JSON.stringify(currentPill);
  };

  // Función para actualizar la hora seleccionada y ajustar campos relacionados
  const handleTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowTimePicker(Platform.OS === 'ios');
    setSelectedTime(currentDate);

    const hours = currentDate.getHours().toString().padStart(2, '0');
    const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    handleInputChange(currentPillIndex, 'intervalHours', hours);
    handleInputChange(currentPillIndex, 'intervalMinutes', minutes);
    // Actualiza el campo de tiempo con la hora seleccionada
    handleInputChange(currentPillIndex, 'time', currentDate.getTime());
  };

  // Modificar el toggle de notificaciones para actualizar solo el estado local
  const handleNotificationToggle = (index, value) => {
    const newPills = [...pills];
    newPills[index].notificationsEnabled = value;
    setPills(newPills);
    // No se actualiza inmediatamente en Firebase; se guardará cuando se confirme la edición
  };

  return (
    <View style={[
      styles.container,
      tema === 'claro' ? styles.claro : styles.base,
      isProtanopia ? styles.protanopia : null,
      isDeuteranopia ? styles.deuteranopia : null,
      isTritanopia ? styles.tritanopia : null,
      isMonochromatic ? styles.monochromatic : null,
      isDaltonism ? styles.daltonism : null,
    ]}>
      {/* Cabecera de la pantalla */}
      <View style={styles.header}>
        <Text style={[styles.title, tema === 'claro' ? styles.textColorBlack : {}]}>Gestionar Pastillas</Text>
      </View>
      {/* Contenedor principal con Scroll para listados dinámicos */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Mapea cada pastilla y muestra su información y campos de edición */}
        {pills.map((pill, index) => (
          <View key={index} style={[styles.pillContainer, tema === 'claro' ? styles.claro : styles.base]}>
            {/* Muestra número e identificador de la pastilla */}
            <Text style={[styles.label, tema === 'claro' ? styles.textColorBlack : {}]}>Pastilla {index + 1}</Text>
            {/* Campo de texto para el nombre de la pastilla */}
            <TextInput
              style={[styles.input, tema === 'claro' ? styles.inputclaro : {}]}
              placeholder="Nombre de la pastilla"
              placeholderTextColor={ tema === 'claro' ? '#333' : '#fff' }
              value={pill.name}
              onChangeText={(text) => handleInputChange(index, 'name', text)}
              editable={editingIndex === index}
            />
            {/* Campo para notas adicionales */}
            <TextInput
              style={[styles.input, tema === 'claro' ? styles.inputclaro : {}]}
              placeholder="Notas"
              placeholderTextColor={ tema === 'claro' ? '#333' : '#fff' }
              value={pill.notes}
              onChangeText={(text) => handleInputChange(index, 'notes', text)}
              editable={editingIndex === index}
            />
            {/* Campo para el intervalo en horas */}
            <TextInput
              style={[styles.input, tema === 'claro' ? styles.inputclaro : {}]}
              placeholder="Intervalo de horas"
              placeholderTextColor={ tema === 'claro' ? '#333' : '#fff' }
              value={pill.intervalHours}
              onChangeText={(text) => handleInputChange(index, 'intervalHours', text)}
              editable={editingIndex === index}
              keyboardType="numeric"
            />
            {/* Campo para el intervalo en minutos */}
            <TextInput
              style={[styles.input, tema === 'claro' ? styles.inputclaro : {}]}
              placeholder="Intervalo de minutos"
              placeholderTextColor={ tema === 'claro' ? '#333' : '#fff' }
              value={pill.intervalMinutes}
              onChangeText={(text) => handleInputChange(index, 'intervalMinutes', text)}
              editable={editingIndex === index}
              keyboardType="numeric"
            />
            {/* Botón para seleccionar la fecha de fin a través del calendario */}
            <TouchableOpacity onPress={() => { setCurrentPillIndex(index); setShowEndDatePicker(true); }} style={styles.dateButton}>
              <Text style={styles.dateButtonText}>
                {pill.endDate ? `Fecha de fin: ${new Date(pill.endDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Seleccionar fecha de fin'}
              </Text>
            </TouchableOpacity>
            {/* Selector de color asignado a la pastilla */}
            <Text style={[styles.colorLabel, tema === 'claro' ? styles.textColorBlack : {}]}>Color asignado:</Text>
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
            {/* Modal para mostrar el calendario de selección de fecha */}
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
            {/* Sección para activar o desactivar las notificaciones de la pastilla */}
            <View style={styles.notificationSwitchContainer}>
              <Text style={[styles.notificationSwitchLabel, tema === 'claro' ? styles.textColorBlack : {}]}>
                Recibir notificaciones:
              </Text>
              <Switch
                value={pill.notificationsEnabled}
                onValueChange={(value) => handleNotificationToggle(index, value)}
                disabled={editingIndex !== index}
                thumbColor={pill.notificationsEnabled ? (tema === 'claro' ? "#4CAF50" : "#81b0ff") : "#f4f3f4"}
                trackColor={{ false: "#767577", true: (tema === 'claro' ? "#A5D6A7" : "#1E88E5") }}
              />
            </View>
            {/* Botones de edición, guardado o eliminación según el estado de la pastilla */}
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
      {/* Barra de navegación inferior */}
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 16,
    paddingBottom: 0,
    marginTop: -50,
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
    marginBottom: 8,
    color: '#fff',
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
  inputclaro: {
    height: 40,
    borderColor: '#555',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#d6d6d6',
    color: '#333',
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
    marginTop: 10,
    color: '#fff',
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
  notificationSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  notificationSwitchLabel: {
    fontSize: 16,
    marginRight: 10,
    color: '#fff',
  },
  protanopia: {
    filter: 'protanopia(100%)', // Simula efecto de Protanopia
  },
  deuteranopia: {
    filter: 'deuteranopia(100%)', // Simula efecto de Deuteranopia
  },
  tritanopia: {
    filter: 'tritanopia(100%)', // Simula efecto de Tritanopia
  },
  monochromatic: {
    filter: 'grayscale(100%)', // Simula vista Monochromatic
  },
  daltonism: {
    filter: 'daltonism(100%)', // Simula efecto Daltonism
  },
});
