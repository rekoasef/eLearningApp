// Ruta: supabase/functions/delete-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id_to_delete } = await req.json();
    
    if (!user_id_to_delete) {
      return new Response(
        JSON.stringify({ error: "No se proporcionó el ID del usuario a eliminar." }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id_to_delete);

    if (deleteError) {
      // Si Supabase da un error, lo registramos y lo devolvemos
      console.error('Error desde Supabase Auth:', deleteError.message);
      return new Response(
        JSON.stringify({ error: `Error de Supabase: ${deleteError.message}` }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ message: "Usuario eliminado con éxito" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Si hay un error general (ej: JSON mal formado), también lo capturamos
    console.error('Error en la función:', error.message);
    return new Response(
      JSON.stringify({ error: `Error inesperado en la función: ${error.message}` }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});