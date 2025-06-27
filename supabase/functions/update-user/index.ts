// Ruta: supabase/functions/update-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UserUpdatePayload {
  user_id_to_update: string;
  full_name: string;
  role_id: number;
  sector_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id_to_update, full_name, role_id, sector_id }: UserUpdatePayload = await req.json();
    if (!user_id_to_update || !full_name || !role_id || !sector_id) {
      throw new Error("Faltan datos para la actualización.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: full_name,
        role_id: role_id,
        sector_id: sector_id,
      })
      .eq('id', user_id_to_update);

    if (profileError) {
      throw new Error(`Error al actualizar el perfil: ${profileError.message}`);
    }

    return new Response(JSON.stringify({ message: "Usuario actualizado con éxito" }), {
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