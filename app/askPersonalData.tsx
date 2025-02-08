import React, { useState } from 'react';
import { StyleSheet, Button, TextInput, View, Text, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { app } from '../firebaseConfig'; // Ruta corregida
import { useRouter } from 'expo-router'; // Importa el hook de navegación

// Initialize Firebase Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export default function AskPersonalDataScreen() {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Hombre');
  const [height, setHeight] = useState('');
  const router = useRouter(); // Usa el hook de navegación

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      try {
        await setDoc(doc(db, "usersData", userId), {
          name,
          lastname,
          age,
          gender,
          height,
        });
        Alert.alert('Datos guardados', 'Tus datos personales han sido guardados correctamente.');
        router.push('/homeScreen'); // Navega a la pantalla de inicio (home)
      } catch (error) {
        console.error('Error guardando datos personales:', error);
        Alert.alert('Error', 'Hubo un error guardando tus datos personales.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Datos Personales</Text>
      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Apellidos"
        value={lastname}
        onChangeText={setLastname}
        style={styles.input}
      />
      <TextInput
        placeholder="Edad"
        value={age}
        onChangeText={setAge}
        style={styles.input}
        keyboardType="numeric"
      />
      <Text>Género</Text>
      <Picker
        selectedValue={gender}
        style={styles.picker}
        onValueChange={(itemValue) => setGender(itemValue)}
      >
        <Picker.Item label="Hombre" value="Hombre" />
        <Picker.Item label="Mujer" value="Mujer" />
      </Picker>
      <TextInput
        placeholder="Estatura (cm)"
        value={height}
        onChangeText={setHeight}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="Guardar" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 12,
  },
});