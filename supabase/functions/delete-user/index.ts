// Ruta: supabase/functions/delete-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UserDeletePayload {
  user_id_to_delete: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id_to_delete }: UserDeletePayload = await req.json();
    if (!user_id_to_delete) {
      throw new Error("Se requiere el ID del usuario a eliminar.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Usamos el cliente de administración para eliminar al usuario.
    // Supabase se encarga automáticamente de borrar el perfil asociado
    // gracias al trigger que configuramos al inicio.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id_to_delete);

    if (deleteError) {
      throw new Error(`Error al eliminar el usuario: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ message: "Usuario eliminado con éxito" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});