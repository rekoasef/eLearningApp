// supabase/functions/update-finished-courses/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log("Iniciando la función de actualización de cursos...");

Deno.serve(async (_req) => {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Encontrar los cursos que han finalizado hoy
    const now = new Date().toISOString();
    const { data: finishedCourses, error: coursesError } = await supabaseAdmin
      .from('courses')
      .select('id')
      .neq('end_date', null)
      .lt('end_date', now);

    if (coursesError) throw coursesError;
    if (!finishedCourses || finishedCourses.length === 0) {
      console.log("No hay cursos finalizados para procesar.");
      return new Response("OK", { headers: { "Content-Type": "application/json" } });
    }

    const courseIds = finishedCourses.map(c => c.id);
    console.log(`Cursos finalizados encontrados: ${courseIds.length}`);

    // 2. Actualizar el progreso de los usuarios para esos cursos
    // Cambiamos el estado a 'failed' solo si está 'in_progress'
    const { data, error: updateError } = await supabaseAdmin
      .from('course_progress')
      .update({ status: 'failed', updated_at: now })
      .in('course_id', courseIds)
      .eq('status', 'in_progress');

    if (updateError) throw updateError;
    
    console.log("Progreso de cursos finalizados actualizado con éxito.", data);
    return new Response(JSON.stringify({ success: true, message: "Cursos actualizados." }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error en la función programada:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});