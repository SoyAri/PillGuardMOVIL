// Importamos librerías para la navegación, notificaciones de Expo y hooks de React
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications'; // Gestión de notificaciones con Expo
import { useEffect } from 'react';
// Importamos las pantallas de la aplicación
import HomeScreen from './homeScreen';
import LoginScreen from './index';
import ResetPasswordScreen from './recoverPassword';
import RegisterScreen from './registro';
import SettingsScreen from './settingsScreen';

const Stack = createStackNavigator(); // Creamos el stack de navegación

export default function App() {
  useEffect(() => {
    // Configuramos el manejador de notificaciones de Expo
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        // Permite mostrar una alerta cuando llega una notificación
        shouldShowAlert: true,
        // Habilita el sonido de la notificación
        shouldPlaySound: true, // Asegúrate de que el sonido esté habilitado
        // Habilita la actualización de la insignia de la app
        shouldSetBadge: true, // Asegúrate de que la insignia esté habilitada
      }),
    });

    // Función para solicitar permisos de notificación al usuario
    const requestPermissions = async () => {
      // Solicita permisos y guarda el estado de la respuesta
      const { status } = await Notifications.requestPermissionsAsync();
      // Verifica si el permiso no fue concedido
      if (status !== 'granted') {
        // Muestra alerta al usuario indicando que se requieren permisos
        alert('Se requieren permisos para mostrar notificaciones.');
      }
    };

    // Se llama a la función para solicitar permisos al montar el componente
    requestPermissions();
  }, []); // Se ejecuta solo una vez al montar el componente

  // Renderiza el contenedor de navegación y define las rutas de la app
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Definición de cada pantalla y su componente correspondiente */}
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}