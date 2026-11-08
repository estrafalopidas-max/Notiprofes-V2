/**
 * Utilidades para formateo seguro de texto enriquecido en NotiProfes Digital.
 * Soporta sintaxis ligera e intuitiva:
 * - **negrita**
 * - *cursiva*
 * - __subrayado__
 * - ==resaltado amarillo==
 * - [azul:texto en azul institucional]
 * - [magenta:texto en magenta institucional]
 * - [verde:texto en esmeralda]
 * - [texto del enlace](https://url...)
 * - Listas con viñetas (• o - al inicio de línea)
 */

export function escaparHtmlBasico(texto: string): string {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Convierte sintaxis de formato ligero a HTML seguro y estilizado para vista web y boletín público.
 * Previene inyección XSS escapando primero cualquier etiqueta HTML cruda.
 */
export function formatearTextoAHtmlSeguro(texto: string): string {
  if (!texto) return '';

  // 1. Permitir algunas etiquetas seguras existentes convirtiéndolas temporalmente a marcadores canónicos
  const normalizado = String(texto)
    .replace(/<\s*(b|strong)\s*>(.*?)<\s*\/\s*(b|strong)\s*>/gis, '**$2**')
    .replace(/<\s*(i|em)\s*>(.*?)<\s*\/\s*(i|em)\s*>/gis, '*$2*')
    .replace(/<\s*u\s*>(.*?)<\s*\/\s*u\s*>/gis, '__$1__')
    .replace(/<\s*mark\s*>(.*?)<\s*\/\s*mark\s*>/gis, '==$1==');

  // 2. Escapar todo HTML restante para neutralizar cualquier script o etiqueta insegura
  let html = escaparHtmlBasico(normalizado);

  // 3. Reemplazar enlaces seguros [etiqueta](https://...)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#007DC5;text-decoration:underline;font-weight:700;">$1</a>'
  );

  // 4. Colores institucionales [azul:...], [magenta:...], [verde:...]
  html = html.replace(
    /\[azul:([\s\S]*?)\]/g,
    '<span style="color:#007DC5;font-weight:700;">$1</span>'
  );
  html = html.replace(
    /\[magenta:([\s\S]*?)\]/g,
    '<span style="color:#ED145B;font-weight:700;">$1</span>'
  );
  html = html.replace(
    /\[verde:([\s\S]*?)\]/g,
    '<span style="color:#047857;font-weight:700;">$1</span>'
  );

  // 5. Resaltado ==texto==
  html = html.replace(
    /==([\s\S]+?)==/g,
    '<mark style="background-color:#FEF08A;color:#0F172A;padding:0 4px;border-radius:3px;font-weight:600;">$1</mark>'
  );

  // 6. Subrayado __texto__
  html = html.replace(
    /__([\s\S]+?)__/g,
    '<u style="text-decoration:underline;text-underline-offset:2px;">$1</u>'
  );

  // 7. Negrita **texto**
  html = html.replace(
    /\*\*([\s\S]+?)\*\*/g,
    '<strong style="font-weight:800;">$1</strong>'
  );

  // 8. Cursiva *texto* (evitando colisión con viñetas sueltas)
  html = html.replace(
    /(^|[^*])\*([^*\n]+?)\*(?!\*)/g,
    '$1<em style="font-style:italic;">$2</em>'
  );

  // 9. Saltos de línea
  html = html.replace(/\r?\n/g, '<br />');

  return html;
}

/**
 * Elimina las marcas de formato y devuelve texto plano limpio (ideal para PDF con jsPDF y buscadores).
 */
export function limpiarFormatoTextoPlano(texto: string): string {
  if (!texto) return '';

  return String(texto)
    .replace(/<\s*(b|strong|i|em|u|mark)\s*>(.*?)<\s*\/\s*\1\s*>/gis, '$2')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '$1 ($2)')
    .replace(/\[(azul|magenta|verde):([\s\S]*?)\]/g, '$2')
    .replace(/==([\s\S]+?)==/g, '$1')
    .replace(/__([\s\S]+?)__/g, '$1')
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1$2');
}

/**
 * Verifica si una cadena contiene marcadores de formato enriquecido.
 */
export function tieneFormatoEnriquecido(texto: string): boolean {
  if (!texto) return false;
  return /(\*\*[\s\S]+?\*\*|__[\s\S]+?__|==[\s\S]+?==|\[(azul|magenta|verde):[\s\S]+?\]|\[[^\]]+\]\(https?:\/\/|(?:^|[^*])\*[^*\n]+?\*)/m.test(
    texto
  );
}
