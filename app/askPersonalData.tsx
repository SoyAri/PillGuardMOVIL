// Importación de librerías y componentes necesarios para la UI, Firebase y navegación
import AsyncStorage from '@react-native-async-storage/async-storage'; // Almacenamiento asíncrono
import { Picker } from '@react-native-picker/picker'; // Selector de listas
import { useRouter } from 'expo-router'; // Hook para la navegación entre pantallas
import { getAuth } from "firebase/auth"; // Autenticación de Firebase
import { doc, getFirestore, setDoc } from "firebase/firestore"; // Acceso y escritura en Firestore
import React, { useEffect, useState } from 'react'; // React e introducción a estados
import { ActivityIndicator, Alert, Image, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native'; // Componentes de React Native
import { app } from '../firebaseConfig'; // Configuración de Firebase

// Inicialización de Firebase Auth y Firestore
const auth = getAuth(app);
const db = getFirestore(app);

export default function AskPersonalDataScreen() {
  // Declaración de estados para guardar los datos del formulario y controlar la UI
  const [name, setName] = useState(''); // Nombre del usuario
  const [paternalLastname, setPaternalLastname] = useState(''); // Apellido paterno
  const [maternalLastname, setMaternalLastname] = useState(''); // Apellido materno
  const [age, setAge] = useState(''); // Edad del usuario
  const [gender, setGender] = useState('Hombre'); // Género (valor por defecto 'Hombre')
  const [height, setHeight] = useState(''); // Estatura en centímetros
  const [error, setError] = useState(''); // Mensaje de error del formulario
  const [loading, setLoading] = useState(false); // Control de animación de carga
  const router = useRouter(); // Hook de navegación
  const [tema, setTema] = useState("Temabase"); // Estado para el tema
  // NUEVOS estados para efectos visuales:
  const [isProtanopia, setIsProtanopia] = useState(false);
  const [isDeuteranopia, setIsDeuteranopia] = useState(false);
  const [isTritanopia, setIsTritanopia] = useState(false);
  const [isMonochromatic, setIsMonochromatic] = useState(false);
  const [isDaltonism, setIsDaltonism] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const temaGuardado = await AsyncStorage.getItem('tema');
      if (temaGuardado) setTema(temaGuardado);
    };
    loadTheme();
  }, []);

  // NUEVO useEffect para cargar efectos visuales desde AsyncStorage
  useEffect(() => {
    const loadVisualEffects = async () => {
      const protanopiaGuardado = await AsyncStorage.getItem('protanopia');
      if (protanopiaGuardado !== null) setIsProtanopia(protanopiaGuardado === 'true');
      const deuteranopiaGuardado = await AsyncStorage.getItem('deuteranopia');
      if (deuteranopiaGuardado !== null) setIsDeuteranopia(deuteranopiaGuardado === 'true');
      const tritanopiaGuardado = await AsyncStorage.getItem('tritanopia');
      if (tritanopiaGuardado !== null) setIsTritanopia(tritanopiaGuardado === 'true');
      const monochromaticGuardado = await AsyncStorage.getItem('monochromatic');
      if (monochromaticGuardado !== null) setIsMonochromatic(monochromaticGuardado === 'true');
      const daltonismGuardado = await AsyncStorage.getItem('daltonism');
      if (daltonismGuardado !== null) setIsDaltonism(daltonismGuardado === 'true');
    };
    loadVisualEffects();
  }, []);

  // Función para guardar los datos personales en Firestore
  const handleSave = async () => {
    // Verificar que ningún campo esté vacío
    if (!name || !paternalLastname || !maternalLastname || !age || !height) {
      setError('Por favor, llene todos los campos.');
      return;
    }

    setLoading(true); // Activar la animación de carga

    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      try {
        // Guardar los datos en la colección "usersData" usando el ID del usuario
        await setDoc(doc(db, "usersData", userId), {
          name,
          paternalLastname,
          maternalLastname,
          age,
          gender,
          height,
        });
        Alert.alert('Datos guardados', 'Tus datos personales han sido guardados correctamente.');
        router.push('/homeScreen'); // Navegar a la pantalla de inicio
      } catch (error) {
        console.error('Error guardando datos personales:', error);
        Alert.alert('Error', 'Hubo un error guardando tus datos personales.');
      } finally {
        setLoading(false); // Desactivar la animación de carga
      }
    }
  };

  // Función de validación para el nombre (solo letras y espacios)
  const validateName = (text: string) => {
    const nameRegex = /^[a-zA-Z\s]*$/;
    return nameRegex.test(text);
  };

  // Función de validación para la edad (solo dígitos)
  const validateAge = (text: string) => {
    const ageRegex = /^[0-9]*$/;
    return ageRegex.test(text);
  };

  // Función de validación para la estatura (solo dígitos)
  const validateHeight = (text: string) => {
    const heightRegex = /^[0-9]*$/;
    return heightRegex.test(text);
  };

  return (
    <SafeAreaView style={[
      styles.container,
      tema === 'claro' ? styles.claro : styles.base,
      isProtanopia ? styles.protanopia : null,
      isDeuteranopia ? styles.deuteranopia : null,
      isTritanopia ? styles.tritanopia : null,
      isMonochromatic ? styles.monochromatic : null,
      isDaltonism ? styles.daltonism : null,
    ]}>
      <StatusBar barStyle="light-content" /> {/* Define el estilo de la barra de estado */}
      <Image source={require('../assets/images/personaldataimg.png')} style={styles.image} /> {/* Imagen representativa */}
      <Text style={styles.title}>Datos Personales</Text> {/* Título de la pantalla */}

      {/* Input para ingresar el nombre */}
      <TextInput
        placeholder="Nombre"
        value={name}
        onChangeText={(text) => {
          if (validateName(text)) { // Verifica que el nombre sea válido
            setName(text);
          }
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />

      {/* Input para apellido paterno */}
      <TextInput
        placeholder="Apellido Paterno"
        value={paternalLastname}
        onChangeText={(text) => {
          if (validateName(text)) {
            setPaternalLastname(text);
          }
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />

      {/* Input para apellido materno */}
      <TextInput
        placeholder="Apellido Materno"
        value={maternalLastname}
        onChangeText={(text) => {
          if (validateName(text)) {
            setMaternalLastname(text);
          }
        }}
        style={styles.input}
        placeholderTextColor="#ccc"
      />

      {/* Input para ingresar la edad */}
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

      {/* Selector de género */}
      <Text style={styles.label}>Género</Text>
      <Picker
        selectedValue={gender}
        style={styles.picker}
        onValueChange={(itemValue) => setGender(itemValue)}
      >
        <Picker.Item label="Hombre" value="Hombre" />
        <Picker.Item label="Mujer" value="Mujer" />
      </Picker>

      {/* Input para ingresar la estatura */}
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

      {/* Mostrar mensaje de error si existe */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Mostrar indicador de carga o botón según corresponda */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" /> // Mostrando animación de carga
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Guardar</Text> {/* Botón para guardar datos */}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#212c39', // Fondo oscuro de la pantalla
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 16, // Espacio debajo de la imagen
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#fff', // Texto en blanco
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8, // Espacio inferior del label
  },
  input: {
    height: 40,
    borderColor: '#555', // Borde en gris oscuro
    borderWidth: 1,
    marginBottom: 12, // Espaciado entre inputs
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#333', // Fondo gris oscuro
    color: '#fff', // Texto en blanco
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 12,
    color: '#fff', // Texto en blanco del Picker
    backgroundColor: '#333', // Fondo gris oscuro del Picker
  },
  button: {
    backgroundColor: '#007AFF', // Color azul del botón
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff', // Texto en blanco
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff4b4b', // Color rojo para errores
    marginBottom: 16,
  },
  base: {
    backgroundColor: "#2a3b4c",
    // ...existing properties...
  },
  claro: {
    backgroundColor: "#FFFFFF",
    // ...existing properties...
  },
  // NUEVOS estilos para efectos visuales:
  protanopia: {
    filter: 'protanopia(100%)', // Simula efecto Protanopia
  },
  deuteranopia: {
    filter: 'deuteranopia(100%)', // Simula efecto Deuteranopia
  },
  tritanopia: {
    filter: 'tritanopia(100%)', // Simula efecto Tritanopia
  },
  monochromatic: {
    filter: 'grayscale(100%)', // Simula vista Monochromatic
  },
  daltonism: {
    filter: 'daltonism(100%)', // Simula efecto Daltonismo
  },
});