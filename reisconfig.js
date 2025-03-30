import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuración de la API de OpenAI
const openai = new OpenAI({
  apiKey: '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', 
});

const fetchAiComment = async () => {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        { role: "user", content: "Genera un mensaje motivador o un dato curioso acerca de la medicina. Mantén las respuestas variadas, sin estructuras repetitivas, y evita frases genéricas como 'claro, aquí tienes un mensaje motivador'. Usa un tono cálido y natural. El mensaje debe ser muy breve y directo." }
      ]
    });
    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error fetching suggestion from OpenAI:", error);
    return "Error fetching suggestion from OpenAI.";
  }
};

const getCachedAiComment = async () => {
  try {
    const cachedComment = await AsyncStorage.getItem('aiComment');
    const lastFetchTime = await AsyncStorage.getItem('lastFetchTime');
    const currentTime = new Date().getTime();

    // Si hay un comentario en caché y fue actualizado hace menos de 6 horas, devolver el comentario en caché
    if (cachedComment && lastFetchTime && currentTime - parseInt(lastFetchTime) < 6 * 60 * 60 * 1000) {
      return cachedComment;
    }

    // Si no hay comentario en caché o ha pasado más de 6 horas, obtener un nuevo comentario de la API
    const newComment = await fetchAiComment();
    await AsyncStorage.setItem('aiComment', newComment);
    await AsyncStorage.setItem('lastFetchTime', currentTime.toString());
    return newComment;
  } catch (error) {
    console.error("Error getting cached AI comment:", error);
    return "Error getting cached AI comment.";
  }
};  

export { fetchAiComment, getCachedAiComment };