// Importa elementos de react-navigation, Expo y otros módulos necesarios para la navegación y animaciones
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

// Importa un hook personalizado para determinar el esquema de color (oscuro o claro)
import { useColorScheme } from '@/hooks/useColorScheme';

// Previene que la pantalla de carga se oculte automáticamente antes de que se carguen todos los assets.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Obtiene el esquema de color actual (dark o light)
  const colorScheme = useColorScheme();

  // Carga la fuente personalizada "SpaceMono" para uso en la aplicación
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // useEffect para ocultar la pantalla de carga una vez que la fuente se haya cargado
  useEffect(() => {
    if (loaded) {
      // Oculta la pantalla de carga cuando los assets están listos
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Si la fuente aún no se ha cargado, no se renderiza nada
  if (!loaded) {
    return null;
  }

  // Renderiza la aplicación usando el ThemeProvider para aplicar el tema según el esquema de color
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      { /* Define la pila de navegación con cada pantalla */ }
      <Stack>
        {/* Pantalla de registro sin barra de encabezado */}
        <Stack.Screen name="registro" options={{ headerShown: false }} />
        {/* Pantalla principal (index) sin barra de encabezado */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Pantalla para solicitar datos personales sin barra de encabezado */}
        <Stack.Screen name="askPersonalData" options={{ headerShown: false }} />
        {/* Pantalla principal de la app (homeScreen) sin barra de encabezado */}
        <Stack.Screen name="homeScreen" options={{ headerShown: false }} />
        {/* Pantalla para recuperar la contraseña con barra de encabezado */}
        <Stack.Screen name="recoverPassword" options={{ headerShown: true }} />
        {/* Pantalla de términos y condiciones sin barra de encabezado */}
        <Stack.Screen name="termsAndConditions" options={{ headerShown: false }} />
        {/* Pantalla para gestionar medicinas sin barra de encabezado */}
        <Stack.Screen name="managePills" options={{ headerShown: false }} />
        {/* Pantalla de error para rutas no encontradas */}
        <Stack.Screen name="+not-found" />
      </Stack>
      { /* Ajusta la barra de estado para adaptarse al tema actual */ }
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}