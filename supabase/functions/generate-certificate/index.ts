// Ruta: supabase/functions/generate-certificate/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'https://esm.sh/pdf-lib@1';
import { corsHeaders } from '../_shared/cors.ts';

interface CertificatePayload {
  userId: string;
  courseId: string;
}

// --- URL DE TU PLANTILLA ---
// PEGA AQUÍ LA URL PÚBLICA QUE COPIASTE DE SUPABASE STORAGE
const BACKGROUND_IMAGE_URL = 'https://sjiylmcirkaxipdkpaar.supabase.co/storage/v1/object/public/certificate-assets//certificate-template.png'; 
// Ejemplo: 'https://<tu-proyecto-id>.supabase.co/storage/v1/object/public/certificate-assets/certificate-template.png'


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, courseId }: CertificatePayload = await req.json();
    if (!userId || !courseId) throw new Error("Faltan userId o courseId.");

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // --- Obtener datos (en paralelo para más eficiencia) ---
    const [
      { data: profileData, error: profileError },
      { data: courseData, error: courseError },
      { data: imageBytes, error: imageError }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single(),
      supabaseAdmin.from('courses').select('title').eq('id', courseId).single(),
      fetch(BACKGROUND_IMAGE_URL).then(res => res.arrayBuffer()).then(data => ({ data, error: null })).catch(err => ({ data: null, error: err }))
    ]);
    
    if (profileError) throw new Error(`Error buscando perfil: ${profileError.message}`);
    if (courseError) throw new Error(`Error buscando curso: ${courseError.message}`);
    if (imageError || !imageBytes) throw new Error(`Error cargando la imagen de fondo: ${imageError?.message}`);

    const userName = profileData?.full_name?.toUpperCase() || 'NOMBRE DE USUARIO';
    const courseTitle = courseData.title;
    const completionDate = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

    // --- Crear el PDF ---
    const pdfDoc = await PDFDocument.create();
    const backgroundImage = await pdfDoc.embedPng(imageBytes);

    // Añadimos la página con el tamaño de la imagen de fondo para que coincida perfectamente
    const page = pdfDoc.addPage([backgroundImage.width, backgroundImage.height]);
    
    page.drawImage(backgroundImage, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
    });

    // Incrustamos las fuentes estándar (no necesitamos subir archivos de fuente)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // --- Escribir el texto sobre la plantilla ---
    // Las coordenadas (x, y) están ajustadas para este diseño.
    
    // Nombre del Usuario (grande y centrado)
    const userNameWidth = helveticaBoldFont.widthOfTextAtSize(userName, 55);
    page.drawText(userName, {
        x: page.getWidth() / 2 - userNameWidth / 2,
        y: 420,
        font: helveticaBoldFont,
        size: 55,
        color: rgb(0.1, 0.1, 0.1), // Un gris oscuro, no negro puro
    });

    // Texto "ha completado satisfactoriamente la capacitación de:"
     page.drawText('ha completado satisfactoriamente la capacitación de:', {
        x: page.getWidth() / 2 - helveticaFont.widthOfTextAtSize('ha completado satisfactoriamente la capacitación de:', 20) / 2,
        y: 380,
        font: helveticaFont,
        size: 20,
        color: rgb(0.3, 0.3, 0.3),
    });

    // Título del Curso (centrado)
    const courseTitleWidth = helveticaBoldFont.widthOfTextAtSize(courseTitle, 35);
    page.drawText(courseTitle, {
        x: page.getWidth() / 2 - courseTitleWidth / 2,
        y: 320,
        font: helveticaBoldFont,
        size: 35,
        color: rgb(0.99, 0.27, 0.0), // Naranja de Crucianelli: #FF4500
    });

    // Fecha de finalización (abajo a la izquierda)
    page.drawText(`Finalizado el ${completionDate}`, {
        x: 130,
        y: 195,
        font: helveticaFont,
        size: 16,
        color: rgb(0.2, 0.2, 0.2),
    });


    // --- Guardar y subir el nuevo PDF ---
    const pdfBytes = await pdfDoc.save();
    const filePath = `certificates/${userId}/${courseId}-${Date.now()}.pdf`;

    const { error: uploadError } = await supabaseAdmin.storage.from('certificates').upload(filePath, pdfBytes, { contentType: 'application/pdf', upsert: true });
    if (uploadError) throw new Error(`Error al subir a Storage: ${uploadError.message}`);

    const { data: urlData } = supabaseAdmin.storage.from('certificates').getPublicUrl(filePath);
    
    const { error: dbError } = await supabaseAdmin.from('certificates').upsert({
      user_id: userId,
      course_id: courseId,
      pdf_url: urlData.publicUrl,
      completed_at: new Date().toISOString()
    }, { onConflict: 'user_id, course_id' });

    if (dbError) throw new Error(`Error al guardar en DB: ${dbError.message}`);

    return new Response(JSON.stringify({ pdf_url: urlData.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});