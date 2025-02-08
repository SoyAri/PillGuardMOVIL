//esto falla no se porque pero falla
import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, Button } from 'react-native';

export default function SettingsScreen({ navigation }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProtanopia, setIsProtanopia] = useState(false);
  const [isDeuteranopia, setIsDeuteranopia] = useState(false);
  const [isTritanopia, setIsTritanopia] = useState(false);
  const [isMonochromatic, setIsMonochromatic] = useState(false);
  const [isDaltonism, setIsDaltonism] = useState(false);

  const toggleSwitch = (setter) => (value) => setter(value);

  const applySettings = () => {
    navigation.navigate('Home', {
      isDarkMode,
      isProtanopia,
      isDeuteranopia,
      isTritanopia,
      isMonochromatic,
      isDaltonism,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Configuraciones de Accesibilidad</Text>
      
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

      <Button title="Aplicar Configuraciones" onPress={applySettings} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  settingText: {
    fontSize: 18,
  },
});