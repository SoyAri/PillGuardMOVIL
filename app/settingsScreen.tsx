// Importamos módulos esenciales para el funcionamiento de la aplicación:
// - AsyncStorage: para manejar el almacenamiento local.
// - IntentLauncher: para abrir configuraciones del sistema.
// - useRouter: hook para la navegación.
// - Firebase auth: para la autenticación y cierre de sesión.
// - React y componentes de React Native.
import AsyncStorage from '@react-native-async-storage/async-storage'; // Manejo de almacenamiento local
import * as IntentLauncher from 'expo-intent-launcher'; // Lanzador de intenciones para configuraciones del sistema
import { useRouter } from 'expo-router'; // Hook para navegación con Expo Router
import { getAuth, signOut } from "firebase/auth"; // Funciones de autenticación (signOut)
import React, { useEffect, useState } from 'react'; // React y hooks para manejar estado y efectos
import { AccessibilityInfo, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'; // Componentes e interfaces de React Native

// Componente principal que representa la pantalla de Configuraciones de Accesibilidad
export default function SettingsScreen({ navigation }) {
  // Estados para manejar configuración de temas y accesibilidad:
  const [isDarkMode, setIsDarkMode] = useState(false); // Almacena si el modo claro está activado ("claro")
  const [isProtanopia, setIsProtanopia] = useState(false); // Indica si se aplica el efecto Protanopia
  const [isDeuteranopia, setIsDeuteranopia] = useState(false); // Configuración para Deuteranopia
  const [isTritanopia, setIsTritanopia] = useState(false); // Configuración para Tritanopia
  const [isMonochromatic, setIsMonochromatic] = useState(false); // Configuración para vista monocromática
  const [isDaltonism, setIsDaltonism] = useState(false); // Configuración para daltonismo en general
  const [isTalkbackEnabled, setIsTalkbackEnabled] = useState(false); // Estado para activar TalkBack
  const [tema, setTema] = useState<string>("Temabase"); // Tema actual de la aplicación
  const [pendingTheme, setPendingTheme] = useState<string>("Temabase"); // Tema pendiente de aplicar
  const router = useRouter(); // Hook de navegación
  const auth = getAuth(); // Instancia de autenticación de Firebase

  // Función helper para actualizar el estado de un Switch
  const toggleSwitch = (setter) => (value) => setter(value); // Recibe un setter y retorna una función que actualiza el valor

  // Función que aplica las configuraciones seleccionadas y navega a la pantalla Home
  const applySettings = async () => {
    await mantenerTema(pendingTheme); // Guarda el tema pendiente en AsyncStorage
    await AsyncStorage.setItem('protanopia', isProtanopia.toString()); // Se guarda el efecto de protanopia
    await AsyncStorage.setItem('deuteranopia', isDeuteranopia.toString()); // Guarda el estado de deuteranopia
    await AsyncStorage.setItem('tritanopia', isTritanopia.toString()); // Guarda estado de Tritanopia
    await AsyncStorage.setItem('monochromatic', isMonochromatic.toString()); // Guarda estado Monochromatic
    await AsyncStorage.setItem('daltonism', isDaltonism.toString()); // Guarda estado de Daltonism
    setTema(pendingTheme); // Actualiza el tema actual
    setIsDarkMode(pendingTheme === "claro"); // Activa el switch del modo claro si el tema es "claro"
    // Navega a la pantalla Home pasando los parámetros de configuración seleccionados
    navigation.navigate('Home', {
      isDarkMode,
      isProtanopia,
      isDeuteranopia, // Se pasa el estado de deuteranopia
      isTritanopia, // Se pasa el estado de Tritanopia
      isMonochromatic,
      isDaltonism, // Se pasa el estado de Daltonism
    });
  };

  // Función para cerrar sesión: elimina la sesión local y cierra sesión en Firebase
  const closeSettings = async () => {
    try {
      await AsyncStorage.removeItem('userSession'); // Elimina la sesión guardada localmente
      await AsyncStorage.removeItem('notificationToken');
      await AsyncStorage.setItem('notificationsEnabled', 'false'); // Deshabilita notificaciones al cerrar sesión
      await signOut(auth); // Cierra la sesión utilizando Firebase
      router.replace('/'); // Redirige a la pantalla de inicio de sesión
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      Alert.alert('Error', 'Hubo un problema cerrando sesión. Por favor, intenta de nuevo.');
    }
  };

  // useEffect: Carga el tema guardado en AsyncStorage al iniciar el componente
  useEffect(() => {
    const cargarConfiguraciones = async () => {
      const temaGuardado = await AsyncStorage.getItem('tema'); // Recupera el tema almacenado
      if (temaGuardado) {
        setTema(temaGuardado); // Establece el tema actual
        setPendingTheme(temaGuardado); // Usa el tema guardado como tema pendiente
        setIsDarkMode(temaGuardado === "claro"); // Activa el modo claro si corresponde
      }
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
    cargarConfiguraciones(); // Ejecuta la función al montar el componente
  }, []);

  // Función para guardar el tema de la aplicación en AsyncStorage
  const mantenerTema = async (temaNuevo: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem('tema', temaNuevo); // Almacena el nuevo tema
      return temaNuevo === "claro"; // Retorna true si el tema es "claro"
    } catch (error) {
      console.error("Ha surgido un error:", error);
      return false;
    }
  };

  // Función que maneja la activación de TalkBack: comprueba si el lector de pantalla está activo
  const handleTalkbackActivation = () => {
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => { // Verifica si TalkBack ya está activo
      if (!enabled) {
        Alert.alert(
          'Activar TalkBack',
          'TalkBack no está activado. Por favor, abre el apartado de accesibilidad.',
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => setIsTalkbackEnabled(false) },
            {
              text: 'Abrir configuración',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Alert.alert('Opción no disponible', 'No se puede abrir en iOS.');
                  setIsTalkbackEnabled(false);
                } else {
                  // Abre la configuración de accesibilidad en Android
                  IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.ACCESSIBILITY_SETTINGS);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('TalkBack ya está activado.');
      }
    });
  };

  // Renderizado del componente
  return (
    // ScrollView contenedor raíz para permitir desplazamiento en dispositivos con pantallas pequeñas
    <ScrollView 
      style={[
        isProtanopia ? styles.protanopia : null,
        isDeuteranopia ? styles.deuteranopia : null,
        isTritanopia ? styles.tritanopia : null, // Aplica efecto Tritanopia según el switch
        isMonochromatic ? styles.monochromatic : null, // Aplica efecto Monochromatic según el switch
        isDaltonism ? styles.daltonism : null, // Aplica efecto Daltonism según el switch
        { flex: 1 }
      ]} // Se aplican los efectos según los switches
      contentContainerStyle={[styles.container, pendingTheme === "claro" ? styles.claro : styles.base]} // Establece estilos basados en el tema actual
    >
      {/* Título de la pantalla */}
      <Text style={[styles.title, pendingTheme === "claro" ? {} : styles.textColorWhite]}>
        Configuraciones de Accesibilidad
      </Text>
      
      {/* Contenedor principal de opciones de configuración */}
      <View style={[styles.settingsContainer, pendingTheme === "claro" ? styles.Scrollviewcolor : styles.base]}>
        {/* Configuración: Modo Claro */}
        <View style={styles.setting}>
          <Text style={[styles.settingText, pendingTheme === "claro" ? styles.textColorBlack : styles.textColorWhite]}>
            Modo Claro
          </Text>
          {/* Paleta de colores para previsualizar el tema */}
          <View style={[
            styles.themePreview,
            pendingTheme === "claro" ? styles.claroPreview : styles.basePreview
          ]} />
          <Switch
            onValueChange={(value) => {
              const newTheme = value ? "claro" : "Temabase";
              setPendingTheme(newTheme); // Actualiza el tema pendiente basado en el switch
              setIsDarkMode(value); // Actualiza si se activa el modo claro
            }}
            value={isDarkMode}
          />
        </View>

        {/* Configuración: Protanopia */}
        <View style={styles.setting}>
          <Text style={[styles.settingText, pendingTheme === "claro" ? styles.textColorBlack : styles.textColorWhite]}>
            Protanopia
          </Text>
          <View style={[
            styles.themePreview,
            isProtanopia ? styles.protanopiaPreview : styles.noEffectPreview
          ]} />
          <Switch
            onValueChange={(value) => {
              if (value) {
                if (isDeuteranopia || isTritanopia || isMonochromatic || isDaltonism) {
                  Alert.alert("Error", "Otro efecto ya está activado");
                } else {
                  setIsProtanopia(true);
                }
              } else {
                setIsProtanopia(false);
              }
            }}
            value={isProtanopia}
          />
        </View>

        {/* Configuración: Deuteranopia */}
        <View style={styles.setting}>
          <Text style={[styles.settingText, pendingTheme === "claro" ? styles.textColorBlack : styles.textColorWhite]}>
            Deuteranopia
          </Text>
          <View style={[
            styles.themePreview,
            isDeuteranopia ? styles.deuteranopiaPreview : styles.noEffectPreview
          ]} />
          <Switch
            onValueChange={(value) => {
              if (value) {
                if (isProtanopia || isTritanopia || isMonochromatic || isDaltonism) {
                  Alert.alert("Error", "Otro efecto ya está activado");
                } else {
                  setIsDeuteranopia(true);
                }
              } else {
                setIsDeuteranopia(false);
              }
            }}
            value={isDeuteranopia}
          />
        </View>

        {/* Configuración: Tritanopia */}
        <View style={styles.setting}>
          <Text style={[styles.settingText, pendingTheme === "claro" ? styles.textColorBlack : styles.textColorWhite]}>
            Tritanopia
          </Text>
          <View style={[
            styles.themePreview,
            isTritanopia ? styles.tritanopiaPreview : styles.noEffectPreview
          ]} />
          <Switch
            onValueChange={(value) => {
              if (value) {
                if (isProtanopia || isDeuteranopia || isMonochromatic || isDaltonism) {
                  Alert.alert("Error", "Otro efecto ya está activado");
                } else {
                  setIsTritanopia(true);
                }
              } else {
                setIsTritanopia(false);
              }
            }}
            value={isTritanopia}
          />
        </View>

        {/* Configuración: Monocromático */}
        <View style={styles.setting}>
          <Text style={[styles.settingText, pendingTheme === "claro" ? styles.textColorBlack : styles.textColorWhite]}>
            Monocromático
          </Text>
          <View style={[
            styles.themePreview,
            isMonochromatic ? styles.monochromaticPreview : styles.noEffectPreview
          ]} />
          <Switch
            onValueChange={(value) => {
              if (value) {
                if (isProtanopia || isDeuteranopia || isTritanopia || isDaltonism) {
                  Alert.alert("Error", "Otro efecto ya está activado");
                } else {
                  setIsMonochromatic(true);
                }
              } else {
                setIsMonochromatic(false);
              }
            }}
            value={isMonochromatic}
          />
        </View>

        {/* Configuración: Daltonismo */}
        <View style={styles.setting}>
          <Text style={[styles.settingText, pendingTheme === "claro" ? styles.textColorBlack : styles.textColorWhite]}>
            Daltonismo
          </Text>
          <View style={[
            styles.themePreview,
            isDaltonism ? styles.daltonismPreview : styles.noEffectPreview
          ]} />
          <Switch
            onValueChange={(value) => {
              if (value) {
                if (isProtanopia || isDeuteranopia || isTritanopia || isMonochromatic) {
                  Alert.alert("Error", "Otro efecto ya está activado");
                } else {
                  setIsDaltonism(true);
                }
              } else {
                setIsDaltonism(false);
              }
            }}
            value={isDaltonism}
          />
        </View>

        {/* Configuración: Activación de TalkBack */}
        <View style={styles.setting}>
          <Text style={[styles.settingText, pendingTheme === "claro" ? styles.textColorBlack : styles.textColorWhite]}>
            Activar TalkBack
          </Text>
          <Switch
            onValueChange={(value) => {
              setIsTalkbackEnabled(value); // Cambia el estado de TalkBack
              if (value) handleTalkbackActivation(); // Llama a la función para activar TalkBack
            }}
            value={isTalkbackEnabled}
          />
        </View>
      </View>

      {/* Botón para aplicar las configuraciones seleccionadas */}
      <TouchableOpacity style={styles.applyButton} onPress={applySettings}>
        <Text style={styles.applyButtonText}>Aplicar Configuraciones</Text>
      </TouchableOpacity>
      
      {/* Botón para cerrar sesión */}
      <TouchableOpacity style={styles.closeButton} onPress={closeSettings}>
        <Text style={styles.closeButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Definición de estilos para los componentes de la pantalla
const styles = StyleSheet.create({
  container: {
    flexGrow: 1, // Permite que el contenedor crezca y se pueda hacer scroll
    justifyContent: 'center', // Centra verticalmente el contenido
    alignItems: 'center', // Centra horizontalmente el contenido
    padding: 16, // Espaciado interno
    backgroundColor: '#212c39', // Fondo base para modo oscuro
  },
  closeButton: {
    justifyContent: 'center', // Centrado del texto en el botón
    backgroundColor: '#ff4b4b', // Color de fondo rojo para botón de cerrar sesión
    borderRadius: 25, // Bordes redondeados
    paddingVertical: 10, // Espaciado vertical interno
    paddingHorizontal: 20, // Espaciado horizontal interno
    marginVertical: 10, // Margen vertical entre botones
  },
  claro: {
    backgroundColor: "#FFFFFF", // Fondo para modo claro
  },
  Scrollviewcolor: {
    backgroundColor: "#b6c2d5", // Fondo para tarjeta de configuraciones en modo claro
  },
  closeButtonText: {
    color: '#fff', // Texto blanco para botón de cerrar sesión
    fontSize: 16, // Tamaño de fuente
    fontWeight: 'bold', // Texto en negrita
  },
  title: {
    fontSize: 28, // Tamaño del título principal
    fontWeight: '600', // Peso de la fuente del título
    marginBottom: 24, // Espaciado inferior del título
  },
  settingsContainer: {
    width: '100%', // Ocupa el ancho completo del contenedor
    borderRadius: 10, // Bordes redondeados de la tarjeta de opciones
    padding: 16, // Espaciado interno de la tarjeta
    backgroundColor: '#fff', // Fondo blanco para destacar las opciones
    shadowColor: "#000", // Color de la sombra para dar efecto de elevación
    shadowOffset: { width: 0, height: 2 }, // Desplazamiento de la sombra
    shadowOpacity: 0.3, // Opacidad de la sombra
    shadowRadius: 4, // Radio de la difuminación de la sombra
    elevation: 5, // Elevación en Android para sombra
    marginVertical: 12, // Espaciado vertical alrededor de la tarjeta
  },
  setting: {
    flexDirection: 'row', // Organiza cada opción en una fila
    justifyContent: 'space-between', // Distribuye espacio entre texto y switch
    alignItems: 'center', // Alinea verticalmente los elementos
    paddingVertical: 12, // Espaciado vertical en cada opción
    borderBottomWidth: 1, // Línea divisoria inferior para separar opciones
    borderBottomColor: '#ccc', // Color de la línea divisoria
  },
  settingText: {
    fontSize: 18, // Tamaño de fuente para el texto de la opción
  },
  applyButton: {
    backgroundColor: '#007AFF', // Color azul para el botón de aplicar configuraciones
    paddingVertical: 14, // Espaciado vertical interno
    paddingHorizontal: 40, // Espaciado horizontal interno
    borderRadius: 25, // Bordes redondeados del botón
    marginVertical: 20, // Margen vertical alrededor del botón
  },
  applyButtonText: {
    color: '#fff', // Texto blanco para el botón de aplicar
    fontSize: 18, // Tamaño de fuente
    fontWeight: 'bold', // Texto en negrita
  },
  textColorBlack: {
    color: '#000', // Texto en negro para modo claro
  },
  textColorWhite: {
    color: '#fff', // Texto en blanco para modo oscuro
  },
  base: {
    backgroundColor: "#2a3b4c", // Fondo alternativo para modo oscuro
  },
  protanopia: {
    filter: 'protanopia(100%)', // Efecto visual para simular Protanopia
  },
  deuteranopia: {
    filter: 'deuteranopia(100%)', // Efecto visual para simular Deuteranopia
  },
  tritanopia: {
    filter: 'tritanopia(100%)', // Efecto visual para simular Tritanopia
  },
  monochromatic: {
    filter: 'grayscale(100%)', // Efecto visual para vista Monochromatic
  },
  daltonism: {
    filter: 'daltonism(100%)', // Efecto visual para simular Daltonismo
  },
  themePreview: {
    width: 40,
    height: 20,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  claroPreview: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  basePreview: {
    backgroundColor: "#212c39",
    borderWidth: 1,
    borderColor: "#000",
  },
  protanopiaPreview: {
    backgroundColor: "#ff0000", // Color de previsualización para Protanopia
  },
  deuteranopiaPreview: {
    backgroundColor: "#00ff00", // Color de previsualización para Deuteranopia
  },
  tritanopiaPreview: {
    backgroundColor: "#0000ff", // Color de previsualización para Tritanopia
  },
  monochromaticPreview: {
    backgroundColor: "#808080", // Color de previsualización para Monocromático
  },
  daltonismPreview: {
    backgroundColor: "#ffff00", // Color de previsualización para Daltonismo
  },
  noEffectPreview: {
    backgroundColor: "#ccc", // Color de previsualización para sin efecto
  },
});

