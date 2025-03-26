// Importa hooks y componentes necesarios para la navegación y la UI
import { useRouter } from 'expo-router'; // Hook de navegación de Expo
import React from 'react'; // Importa React
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // Importa componentes de React Native

// Componente funcional que muestra los términos y condiciones
export default function TermsAndConditions() {
  // Inicializa el hook de navegación
  const router = useRouter();

  return (
    // Envuelve el contenido para respetar las áreas seguras del dispositivo
    <SafeAreaView style={styles.safeArea}>
      {/* Configura la barra de estado para que el contenido sea claro */}
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Contenedor desplazable para visualizar el contenido largo de los términos */}
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {/* Título principal de la pantalla */}
          <Text style={styles.title}>Términos y Condiciones</Text>
          
          {/* Sección 1: Introducción */}
          <Text style={styles.text}>
            1. INTRODUCCIÓN
          </Text>
          <Text style={styles.text}>
            Bienvenido a PillGuardAPP (en adelante, "la Aplicación"), una plataforma diseñada para ayudar a los usuarios a gestionar su medicación mediante un sistema de pastillero inteligente con tecnología IoT. El uso de la Aplicación está sujeto a los presentes Términos y Condiciones de Uso (en adelante, "Términos"). Al descargar, instalar o utilizar la Aplicación, usted acepta estar legalmente vinculado a estos Términos.
          </Text>

          {/* Sección 2: Uso de la Aplicación */}
          <Text style={styles.text}>
            2. USO DE LA APLICACIÓN
          </Text>
          <Text style={styles.text}>
            La Aplicación tiene como propósito facilitar la gestión de la medicación del usuario a través de recordatorios y un sistema IoT para la dispensación de pastillas. Sin embargo, la Aplicación no sustituye la consulta médica, ni garantiza la correcta administración de la medicación. El usuario debe continuar con sus controles médicos y seguir las indicaciones de los profesionales de la salud.
          </Text>

          {/* Sección 3: Limitación de Responsabilidad */}
          <Text style={styles.text}>
            3. LIMITACIÓN DE RESPONSABILIDAD
          </Text>
          <Text style={styles.text}>
            La Aplicación y el sistema IoT se proporcionan "tal cual" y "según disponibilidad". Si bien se busca ofrecer un servicio confiable, no se puede garantizar su funcionamiento ininterrumpido o libre de errores.
          </Text>
          <Text style={styles.text}>
            No garantizamos la precisión de las notificaciones, la disponibilidad de la plataforma o la ausencia de interrupciones en el servicio.
          </Text>
          <Text style={styles.text}>
            La Aplicación no tiene control sobre problemas derivados de fallos en la red, errores de hardware, actualizaciones de software, configuraciones incorrectas del usuario o factores externos que puedan afectar su desempeño.
          </Text>
          <Text style={styles.text}>
            En caso de fallos en la conectividad, interrupciones del servicio, errores en la aplicación o en el dispositivo IoT, pueden presentarse omisiones en la administración de la medicación, lo que podría afectar el tratamiento del usuario.
          </Text>
          <Text style={styles.text}>
            El usuario es el único responsable de supervisar la correcta administración de su medicación y de verificar su cumplimiento.
          </Text>
          <Text style={styles.text}>
            La compatibilidad de la Aplicación con todos los dispositivos móviles o sistemas operativos puede variar, y no garantizamos que funcione en todos los entornos o con todas las versiones de software.
          </Text>
          <Text style={styles.text}>
            No somos responsables por daños directos, indirectos, incidentales, consecuentes o de cualquier otro tipo que resulten del uso o imposibilidad de uso de la Aplicación o del sistema IoT.
          </Text>
          <Text style={styles.text}>
            La Aplicación no está diseñada para situaciones de emergencia ni para la administración crítica de medicamentos que requieran supervisión médica constante.
          </Text>

          {/* Sección 4: Obligaciones del Usuario */}
          <Text style={styles.text}>
            4. OBLIGACIONES DEL USUARIO
          </Text>
          <Text style={styles.text}>
            El usuario se compromete a:
          </Text>
          <Text style={styles.text}>
            - Utilizar la Aplicación de manera responsable y conforme a la legislación vigente.
          </Text>
          <Text style={styles.text}>
            - No depender exclusivamente de la Aplicación para la gestión de su medicación y mantener otros métodos alternativos de control.
          </Text>
          <Text style={styles.text}>
            - Verificar manualmente la administración de sus medicamentos y consultar a un profesional de la salud en caso de dudas o discrepancias en los recordatorios.
          </Text>
          <Text style={styles.text}>
            - No utilizar la Aplicación para propósitos ilegales, fraudulentos o que puedan afectar su correcto funcionamiento.
          </Text>
          <Text style={styles.text}>
            - Mantener sus credenciales de acceso seguras y no compartirlas con terceros.
          </Text>
          <Text style={styles.text}>
            - Asegurar que su dispositivo móvil y el sistema IoT estén correctamente configurados y operativos.
          </Text>

          {/* Sección 5: Privacidad y Protección de Datos */}
          <Text style={styles.text}>
            5. PRIVACIDAD Y PROTECCIÓN DE DATOS
          </Text>
          <Text style={styles.text}>
            La Aplicación recopila y procesa información personal de conformidad con nuestra Política de Privacidad. Al utilizar la Aplicación, usted acepta el tratamiento de sus datos según lo descrito en dicha política. No nos hacemos responsables por accesos no autorizados a su cuenta debido a negligencia en la protección de sus credenciales.
          </Text>

          {/* Sección 6: Modificaciones y Terminación */}
          <Text style={styles.text}>
            6. MODIFICACIONES Y TERMINACIÓN
          </Text>
          <Text style={styles.text}>
            Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones entrarán en vigor desde su publicación en la Aplicación. Asimismo, nos reservamos el derecho de suspender o interrumpir el servicio sin previo aviso, ya sea por mantenimiento, actualizaciones o cualquier otra circunstancia que lo requiera.
          </Text>

          {/* Sección 7: Legislación Aplicable y Jurisdicción */}
          <Text style={styles.text}>
            7. LEGISLACIÓN APLICABLE Y JURISDICCIÓN
          </Text>
          <Text style={styles.text}>
            Estos Términos se rigen por las leyes del [país correspondiente]. Cualquier disputa derivada de estos Términos será sometida a la jurisdicción de los tribunales competentes de [ciudad/país].
          </Text>

          {/* Sección 8: Contacto */}
          <Text style={styles.text}>
            8. CONTACTO
          </Text>
          <Text style={styles.text}>
            Si tiene preguntas o inquietudes sobre estos Términos, puede contactarnos a través de biotechnica@support.com.
          </Text>
        </ScrollView>
        {/* Botón para regresar a la pantalla anterior */}
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Regresar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Define los estilos utilizados en el componente
const styles = StyleSheet.create({
  safeArea: {
    // Garantiza que el contenido se ajuste a las áreas seguras del dispositivo
    flex: 1,
    backgroundColor: '#212c39',
  },
  container: {
    // Contenedor principal con padding y fondo configurado
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#212c39',
    // Ajusta la parte superior en Android para evitar superposición con la StatusBar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 16,
  },
  scrollViewContent: {
    // Agrega espacio al final del contenido desplazable
    paddingBottom: 20,
  },
  title: {
    // Estilo para el título principal
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#fff',
  },
  text: {
    // Estilo para los textos de cada sección
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  button: {
    // Estilo para el botón de regreso
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    // Estilo del texto dentro del botón
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});