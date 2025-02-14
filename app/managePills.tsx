import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc, deleteDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

const db = getFirestore(app);
const auth = getAuth(app);

export default function ManagePillsScreen() {
  const [pills, setPills] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Estado para la animación de carga
  const [deletingIndex, setDeletingIndex] = useState(null); // Estado para la animación de eliminación
  const router = useRouter(); // Usa el hook de navegación

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
          pillsData.sort((a, b) => a.order - b.order); // Ordenar por el campo 'order'
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
    setPills([...pills, { id: null, name: '', interval: '', notes: '', order: newOrder }]);
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
            setDeletingIndex(index); // Mostrar animación de eliminación
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
              router.replace('/homeScreen'); // Navega a la pantalla de inicio (home)
            } catch (error) {
              console.error("Error eliminando la píldora:", error);
            } finally {
              setDeletingIndex(null); // Ocultar animación de eliminación
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleSubmit = async () => {
    // Verificar que todos los campos estén llenos
    for (const pill of pills) {
      if (!pill.name || !pill.interval) {
        setError('Por favor, llene todos los campos.');
        return;
      }
    }

    setLoading(true); // Mostrar animación de carga

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
              // Update existing pill
              const pillDocRef = doc(db, "usersPills", userName, "pills", pill.id);
              await updateDoc(pillDocRef, {
                name: pill.name,
                interval: pill.interval,
                notes: pill.notes,
                order: pill.order
              });
            } else {
              // Add new pill
              await addDoc(collection(db, "usersPills", userName, "pills"), {
                name: pill.name,
                interval: pill.interval,
                notes: pill.notes,
                timestamp: new Date().getTime(), // Añadir timestamp para la próxima medicación
                order: pill.order
              });
            }
          }
          Alert.alert('Éxito', 'La(s) píldora(s) se han guardado correctamente.');
        } else {
          console.warn("No se encontraron datos para el usuario.");
        }
        router.replace('/homeScreen'); // Navega a la pantalla de inicio (home)
      }
    } catch (e) {
      console.error("Error adding/updating document: ", e);
    } finally {
      setLoading(false); // Ocultar animación de carga
    }
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
          <Picker
            selectedValue={pill.interval}
            style={styles.input}
            onValueChange={(itemValue) => handleInputChange(index, 'interval', itemValue)}
          >
            <Picker.Item label="Cada 4 horas" value="4 horas" />
            <Picker.Item label="Cada 6 horas" value="6 horas" />
            <Picker.Item label="Cada 8 horas" value="8 horas" />
            <Picker.Item label="Cada 12 horas" value="12 horas" />
            <Picker.Item label="Cada 24 horas" value="24 horas" />
          </Picker>
          <TextInput
            style={styles.input}
            placeholder="Notas"
            value={pill.notes}
            onChangeText={(text) => handleInputChange(index, 'notes', text)}
          />
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
});