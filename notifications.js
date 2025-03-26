import * as Notifications from 'expo-notifications';

export const requestNotificationPermissions = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  console.log('Notification permission status:', status);
  if (status !== 'granted') {
    alert('Se requieren permisos de notificación para esta aplicación.');
  }
};

// Removed scheduleNotification function
