import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { Image, Platform } from 'react-native';

const db = getFirestore(); // Asegúrate de que db esté inicializado
// Resolver la URI de la imagen de splash
const splashImageUri = Image.resolveAssetSource(require('./assets/images/splash.png')).uri;

export const scheduleNotification = async (pill) => {
  // Convertir el intervalo a milisegundos
  const intervalMs = (parseInt(pill.intervalHours) * 60 * 60 * 1000) + (parseInt(pill.intervalMinutes) * 60 * 1000);
  try {
    // Verificar permisos de notificación
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permisos no concedidos para notificaciones.');
      return;
    }
    // Obtener o solicitar el token
    let token = await AsyncStorage.getItem('notificationToken');
    if (!token) {
      const expoTokenResponse = await Notifications.getExpoPushTokenAsync();
      if (!expoTokenResponse.data) {
        console.error('No se pudo obtener el token de notificaciones.');
        return;
      }
      token = expoTokenResponse.data;
      await AsyncStorage.setItem('notificationToken', token);
    }
    // Vincular el token con el usuario en Firebase
    const userSessionStr = await AsyncStorage.getItem('userSession');
    if (userSessionStr) {
      const userSession = JSON.parse(userSessionStr);
      if (userSession?.uid) {
        const userRef = doc(db, "usersData", userSession.uid);
        await updateDoc(userRef, { notificationToken: token });
        console.log('Token vinculado al usuario:', token);
      }
    }
    // Configurar canal para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    // Para evitar triggers muy cortos, usamos al menos 60 segundos
    const triggerSeconds = Math.max(intervalMs / 1000, 60);
    // Programar la notificación
    await Notifications.scheduleNotificationAsync({
      content: {
        // Cambiado: se actualiza el content para incluir "image"
        title: "PillGuard: Es hora de tomar tu pastilla",
        body: pill.name,
        sound: true,
        vibrate: [0, 250, 250, 250],
        channelId: 'default',
        attachments: [{
          url: splashImageUri,
          identifier: null,
          type: null
        }],
        image: splashImageUri, // nueva propiedad para Android
        data: { pillId: pill.id },
      },
      trigger: {
        seconds: triggerSeconds,
        repeats: true,
      },
    });
    console.log('Notificación programada para la pastilla:', pill.name);
  } catch (e) {
    alert('La notificación no se pudo programar, revisa que el tiempo asignado sea válido.');
    console.error('Error al programar la notificación:', e);
  }
};
