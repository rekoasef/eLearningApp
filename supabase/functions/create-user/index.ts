// Ruta: supabase/functions/create-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface UserPayload {
  email: string;
  sector_id: string;
  role_id: number;
  full_name: string; 
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, sector_id, role_id, full_name }: UserPayload = await req.json();
    if (!email || !sector_id || !role_id || !full_name) {
      throw new Error("Faltan datos: se requiere email, rol, sector y nombre completo.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      { data: { full_name: full_name } }
    );
    
    if (inviteError) {
      if (inviteError.message.includes('User already registered')) {
         throw new Error('Un usuario con este correo electrónico ya existe.');
      }
      throw new Error(`Error al invitar al usuario: ${inviteError.message}`);
    }
    
    const newUser = data.user;
    if (!newUser) throw new Error("El usuario no se pudo crear correctamente.");

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        sector_id: sector_id,
        role_id: role_id,
        full_name: full_name
      })
      .eq('id', newUser.id);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw new Error(`Error al actualizar el perfil: ${profileError.message}`);
    }

    return new Response(JSON.stringify({ message: "Invitación enviada con éxito", userId: newUser.id }), {
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