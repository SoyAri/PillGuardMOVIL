import React, { useState } from 'react';
import { StyleSheet, Button, TextInput, View, Text, Alert, Image, TouchableOpacity, StatusBar } from 'react-native';
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
  const [error, setError] = useState('');
  const router = useRouter(); // Usa el hook de navegación

  const handleSave = async () => {
    if (!name || !lastname || !age || !height) {
      setError('Por favor, llene todos los campos.');
      return;
    }

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

  const validateName = (text: string) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    return nameRegex.test(text);
  };

  const validateAge = (text: string) => {
    const ageRegex = /^[0-9]*$/;
    return ageRegex.test(text);
  };

  const validateHeight = (text: string) => {
    const heightRegex = /^[0-9]*$/;
    return heightRegex.test(text);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Image source={require('../assets/images/personaldataimg.png')} style={styles.image} />
      <Text style={styles.title}>Datos Personales</Text>
      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={(text) => {
          if (validateName(text)) {
            setName(text);
          }
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      <TextInput
        placeholder="Apellidos"
        value={lastname}
        onChangeText={(text) => {
          if (validateName(text)) {
            setLastname(text);
          }
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />
      <TextInput
        placeholder="Edad"
        value={age}
        onChangeText={(text) => {
          if (validateAge(text)) {
            setAge(text);
          }
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
        keyboardType="numeric"
      />
      <Text style={styles.label}>Género</Text>
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
        onChangeText={(text) => {
          if (validateHeight(text)) {
            setHeight(text);
          }
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
        keyboardType="numeric"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#212c39',
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff',
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: '#555', // Cambiar el color del borde a gris oscuro
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#333', // Cambiar el color de fondo a gris oscuro
    color: '#fff', // Cambiar el color del texto a blanco
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 12,
    color: '#fff', // Cambiar el color del texto a blanco
    backgroundColor: '#333', // Cambiar el color de fondo a gris oscuro
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4b4b',
    marginBottom: 16,
  },
});