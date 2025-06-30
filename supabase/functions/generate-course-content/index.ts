import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// ¡YA NO SE IMPORTA NINGUNA LIBRERÍA DE PDF AQUÍ!

const GEMINI_MODEL = 'gemini-1.5-flash';

interface GenerateQuizPayload {
  mode: 'quiz';
  quizId: string;
  courseContent: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload: GenerateQuizPayload = await req.json(); // Simplificamos, solo esperamos quizzes
    if (payload.mode !== 'quiz') throw new Error("Modo no válido.");

    const API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!API_KEY) throw new Error("La clave de API de Gemini no está configurada.");

    if (!payload.courseContent) throw new Error("No se proporcionó contenido para generar el quiz.");

    const prompt = `
        Actúa como un evaluador experto para una plataforma de e-learning de maquinaria agrícola.
        Tu tarea es crear un quiz de 5 preguntas basado en el siguiente contenido de un módulo de capacitación.
        Contenido del Módulo:
        """
        ${payload.courseContent.substring(0, 30000)}
        """
        Basado en el contenido, genera 5 preguntas de opción múltiple. Cada pregunta debe tener 4 opciones, y solo una debe ser la correcta.
        Las preguntas deben ser claras, relevantes y cubrir los puntos más importantes del texto.
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
        ]`;

    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    
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
    const content = JSON.parse(jsonString);
    
    const questionsToSave = content.map((q: any, index: number) => ({
      ...q,
      question_type: 'single',
      order: index + 1,
    }));

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { error: rpcError } = await supabaseAdmin.rpc('update_quiz_questions', {
      quiz_id_in: payload.quizId,
      questions_in: questionsToSave,
    });

    if (rpcError) throw rpcError;
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    });
  }
});