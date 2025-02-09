import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getFirestore, collection, getDocs, updateDoc, doc, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

const db = getFirestore(app);
const auth = getAuth(app);

export default function ManagePillsScreen() {
  const [pills, setPills] = useState([]);
  const router = useRouter(); // Usa el hook de navegación

  useEffect(() => {
    const fetchPills = async () => {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const pillsRef = collection(db, "usersPills", userId, "pills");
        const querySnapshot = await getDocs(pillsRef);
        const pillsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPills(pillsData);
      }
    };

    fetchPills();
  }, []);

  const addPill = () => {
    setPills([...pills, { id: null, name: '', interval: '', notes: '' }]);
  };

  const handleInputChange = (index, field, value) => {
    const newPills = [...pills];
    newPills[index][field] = value;
    setPills(newPills);
  };

  const handleSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        for (const pill of pills) {
          if (pill.id) {
            // Update existing pill
            const pillDocRef = doc(db, "usersPills", userId, "pills", pill.id);
            await updateDoc(pillDocRef, {
              name: pill.name,
              interval: pill.interval,
              notes: pill.notes,
            });
          } else {
            // Add new pill
            await addDoc(collection(db, "usersPills", userId, "pills"), {
              name: pill.name,
              interval: pill.interval,
              notes: pill.notes,
              timestamp: new Date().getTime() // Añadir timestamp para la próxima medicación
            });
          }
        }
        router.replace('/homeScreen'); // Navega a la pantalla de inicio (home)
      }
    } catch (e) {
      console.error("Error adding/updating document: ", e);
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
        </View>
      ))}
      <Button title="Añadir otra pastilla" onPress={addPill} />
      <Button title="Guardar" onPress={handleSubmit} />
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
});