// Ruta: supabase/functions/generate-certificate/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1';
import { corsHeaders } from '../_shared/cors.ts';

interface CertificatePayload {
  userId: string;
  courseId: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Función iniciada.");
    const { userId, courseId }: CertificatePayload = await req.json();
    if (!userId || !courseId) throw new Error("Faltan userId o courseId.");
    console.log(`Payload recibido: userId=${userId}, courseId=${courseId}`);

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    console.log("Cliente de Supabase Admin creado.");

    const { data: profileData, error: profileError } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single();
    if (profileError) throw new Error(`Error buscando perfil: ${profileError.message}`);
    console.log("Perfil encontrado:", profileData);
    
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
    const userName = profileData?.full_name || authUser?.email || 'Usuario';
    
    const { data: courseData, error: courseError } = await supabaseAdmin.from('courses').select('title').eq('id', courseId).single();
    if (courseError) throw new Error(`Error buscando curso: ${courseError.message}`);
    console.log("Curso encontrado:", courseData);
    
    const courseTitle = courseData.title;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const date = new Date().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    
    page.drawText('Certificado de Aprobación', { x: 50, y: page.getHeight() - 100, size: 40, font, color: rgb(0.98, 0.27, 0) });
    page.drawText(`Este certificado se otorga a:`, { x: 50, y: page.getHeight() - 200, size: 20, font });
    page.drawText(userName, { x: 50, y: page.getHeight() - 250, size: 32, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Por haber completado y aprobado el curso:`, { x: 50, y: page.getHeight() - 350, size: 20, font });
    page.drawText(courseTitle, { x: 50, y: page.getHeight() - 400, size: 28, font, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(`Emitido el ${date}`, { x: 50, y: 50, size: 16, font });
    
    const pdfBytes = await pdfDoc.save();
    const filePath = `certificates/${userId}/${courseId}-${Date.now()}.pdf`;
    console.log(`Subiendo PDF a: ${filePath}`);

    const { error: uploadError } = await supabaseAdmin.storage.from('certificates').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Error al subir a Storage: ${uploadError.message}`);

    const { data: urlData } = supabaseAdmin.storage.from('certificates').getPublicUrl(filePath);
    
    const { error: dbError } = await supabaseAdmin.from('certificates').upsert({
      user_id: userId,
      course_id: courseId,
      pdf_url: urlData.publicUrl,
    }, { onConflict: 'user_id, course_id' });

    if (dbError) throw new Error(`Error al guardar en DB: ${dbError.message}`);
    console.log("Certificado guardado con éxito.");

    return new Response(JSON.stringify({ pdf_url: urlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error fatal en la Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});