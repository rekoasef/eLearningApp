import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_MODEL = 'gemini-1.5-flash';

interface Payload {
  courseTitle: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { courseTitle }: Payload = await req.json();
    if (!courseTitle) {
      throw new Error("El título del curso es obligatorio para generar el examen.");
    }

    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) {
      throw new Error("La clave de API de Gemini no está configurada.");
    }

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    
    const prompt = `
      Actúa como un experto en evaluación de conocimientos para maquinaria agrícola de la empresa Crucianelli.
      Tu tarea es crear un examen final completo de 10 preguntas para un curso de capacitación interna.

      Título del Curso: "${courseTitle}"

      Basado en el título, genera un examen final de 10 preguntas de opción múltiple. Cada pregunta debe tener 4 opciones, y solo una debe ser la correcta.
      Las preguntas deben cubrir un rango amplio de temas que razonablemente estarían en un curso con ese título, desde conceptos básicos hasta escenarios más complejos.

      Devuelve la respuesta EXCLUSIVamente en formato JSON, siguiendo esta estructura de array de objetos:
      [
        {
          "question_text": "Texto de la pregunta 1",
          "options": [
            { "option_text": "Texto de la opción A", "is_correct": false },
            { "option_text": "Texto de la opción B", "is_correct": true },
            { "option_text": "Texto de la opción C", "is_correct": false },
            { "option_text": "Texto de la opción D", "is_correct": false }
          ]
        }
      ]
    `;

    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        throw new Error(`Error en la API de IA: ${geminiResponse.status} ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    if (!geminiData.candidates || !geminiData.candidates[0].content.parts[0].text) {
        throw new Error("La respuesta de la API de IA no tuvo el formato esperado.");
    }

    const jsonString = geminiData.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim();
    const questions = JSON.parse(jsonString);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    });
  }
});