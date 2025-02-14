import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getAuth, signOut } from 'firebase/auth';
import React, { useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { app } from '../firebaseConfig';

// Initialize Firebase Auth
const auth = getAuth(app);

export default function SettingsScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProtanopia, setIsProtanopia] = useState(false);
  const [isDeuteranopia, setIsDeuteranopia] = useState(false);
  const [isTritanopia, setIsTritanopia] = useState(false);
  const [isMonochromatic, setIsMonochromatic] = useState(false);
  const [isDaltonism, setIsDaltonism] = useState(false);
  const router = useRouter();

  const toggleSwitch = (setter) => (value) => setter(value);

  const applySettings = async () => {
    try {
      await AsyncStorage.multiSet([
        ['isDarkMode', JSON.stringify(isDarkMode)],
        ['isProtanopia', JSON.stringify(isProtanopia)],
        ['isDeuteranopia', JSON.stringify(isDeuteranopia)],
        ['isTritanopia', JSON.stringify(isTritanopia)],
        ['isMonochromatic', JSON.stringify(isMonochromatic)],
        ['isDaltonism', JSON.stringify(isDaltonism)],
      ]);
      router.push('/homeScreen');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al aplicar las configuraciones. Por favor, inténtalo de nuevo.');
      console.error('Error aplicando configuraciones:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.setItem('isLoggedIn', 'false');
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al cerrar la sesión. Por favor, inténtalo de nuevo.');
      console.error('Error cerrando sesión:', error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Configuraciones de Accesibilidad</Text>
      
      <View style={styles.settingsContainer}>
        <View style={styles.setting}>
          <Text style={styles.settingText}>Modo Oscuro</Text>
          <Switch
            onValueChange={toggleSwitch(setIsDarkMode)}
            value={isDarkMode}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingText}>Protanopia</Text>
          <Switch
            onValueChange={toggleSwitch(setIsProtanopia)}
            value={isProtanopia}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingText}>Deuteranopia</Text>
          <Switch
            onValueChange={toggleSwitch(setIsDeuteranopia)}
            value={isDeuteranopia}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingText}>Tritanopia</Text>
          <Switch
            onValueChange={toggleSwitch(setIsTritanopia)}
            value={isTritanopia}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingText}>Monocromático</Text>
          <Switch
            onValueChange={toggleSwitch(setIsMonochromatic)}
            value={isMonochromatic}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingText}>Daltonismo</Text>
          <Switch
            onValueChange={toggleSwitch(setIsDaltonism)}
            value={isDaltonism}
          />
        </View>
      </View>

      <Button title="Aplicar Configuraciones" onPress={applySettings} />

      {/* Botón de cierre de sesión */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
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
  settingsContainer: {
    width: '100%',
    backgroundColor: '#2a3b4c',
    borderRadius: 10,
    padding: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#212c39',
  },
  settingText: {
    fontSize: 18,
    color: '#fff',
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});