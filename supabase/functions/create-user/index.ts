// Ruta: supabase/functions/create-user/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Añadimos full_name al payload
interface UserPayload {
  email: string;
  password: string;
  sector_id: string;
  role_id: number;
  full_name: string; 
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, sector_id, role_id, full_name }: UserPayload = await req.json();
    if (!email || !password || !sector_id || !role_id || !full_name) {
      throw new Error("Faltan datos: se requiere email, contraseña, rol, sector y nombre completo.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, 
    });

    if (authError) throw new Error(`Error al crear el usuario: ${authError.message}`);
    
    const newUser = authData.user;
    if (!newUser) throw new Error("El usuario no se pudo crear correctamente.");

    // Ahora actualizamos el perfil con el nombre completo
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        sector_id: sector_id,
        role_id: role_id,
        full_name: full_name // Usamos el nombre que recibimos
      })
      .eq('id', newUser.id);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw new Error(`Error al actualizar el perfil: ${profileError.message}`);
    }

    return new Response(JSON.stringify({ message: "Usuario creado con éxito", userId: newUser.id }), {
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