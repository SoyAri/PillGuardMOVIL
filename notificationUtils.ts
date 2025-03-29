import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const scheduleNotification = async (pill) => {
  // Paso 1: Convertir el intervalo de horas y minutos a milisegundos
  const intervalMs = (parseInt(pill.intervalHours) * 60 * 60 * 1000) + (parseInt(pill.intervalMinutes) * 60 * 1000);
  try {
    // Paso 2: Obtener el token de notificaciones desde AsyncStorage
    const token = await AsyncStorage.getItem('notificationToken');
    if (!token) {
      console.error('No notification token found');
      return;
    }
    // Paso 3: Si estamos en Android, configurar el canal de notificaciones
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    // Paso 4: Programar la notificación con contenido y trigger
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Es hora de tomar tu pastilla", // Mensaje de alerta
        body: pill.name, // Nombre de la pastilla como cuerpo
        sound: true,
        vibrate: [0, 250, 250, 250],
        channelId: 'default',
      },
      trigger: {
        // Convertir milisegundos a segundos: se repetirá el trigger
        seconds: intervalMs / 1000,
        repeats: true,
      },
    });
    console.log('Notification scheduled for pill:', pill.name);
    // Paso 5: Fin del proceso de programación de notificación
  } catch (e) {
    alert('The notification failed to schedule, make sure the time is valid');
    console.error('Error scheduling notification:', e);
  }
};
