/**
 * Utilidades para formateo seguro de texto enriquecido en NotiProfes Digital.
 * Permite edición 100% visual (WYSIWYG) sin mostrar códigos ni símbolos extraños al usuario,
 * manteniendo compatibilidad con almacenamiento en texto ligero, HTML público y exportación PDF.
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
 * Normaliza marcadores duplicados o anidados accidentalmente (ej: ****, ____, ====,
 * o colores anidados como [azul:[magenta:texto]]) para que nunca queden símbolos visibles.
 */
export function normalizarMarcadoresFormato(texto: string): string {
  if (!texto) return '';
  let limpio = String(texto);

  // Colapsar múltiples colores anidados conservando el color más interno elegido por el usuario
  let prev = '';
  while (prev !== limpio) {
    prev = limpio;
    limpio = limpio.replace(
      /\[(azul|magenta|verde):\s*\[(azul|magenta|verde):([\s\S]*?)\]\s*\]/g,
      '[$2:$3]'
    );
  }

  // Reducir repeticiones excesivas de asteriscos, guiones bajos o signos igual
  limpio = limpio
    .replace(/\*{4,}/g, '**')
    .replace(/_{3,}/g, '__')
    .replace(/={3,}/g, '==');

  // Eliminar marcadores vacíos sin contenido
  limpio = limpio
    .replace(/\*\*\s*\*\*/g, '')
    .replace(/__\s*__/g, '')
    .replace(/==\s*==/g, '')
    .replace(/\[(azul|magenta|verde):\s*\]/g, '');

  return limpio;
}

/**
 * Convierte sintaxis de formato ligero a HTML seguro y estilizado para el editor visual WYSIWYG,
 * la vista React del boletín y el HTML público descargable.
 * Previene inyección XSS escapando primero cualquier etiqueta HTML cruda.
 */
export function formatearTextoAHtmlSeguro(texto: string): string {
  if (!texto) return '';

  // 1. Permitir etiquetas seguras existentes convirtiéndolas temporalmente a marcadores canónicos
  const preNormalizado = String(texto)
    .replace(/<\s*(b|strong)\b[^>]*>(.*?)<\s*\/\s*(b|strong)\s*>/gis, '**$2**')
    .replace(/<\s*(i|em)\b[^>]*>(.*?)<\s*\/\s*(i|em)\s*>/gis, '*$2*')
    .replace(/<\s*u\b[^>]*>(.*?)<\s*\/\s*u\s*>/gis, '__$1__')
    .replace(/<\s*mark\b[^>]*>(.*?)<\s*\/\s*mark\s*>/gis, '==$1==');

  const normalizado = normalizarMarcadoresFormato(preNormalizado);

  // 2. Escapar todo HTML restante para neutralizar cualquier script o etiqueta insegura
  let html = escaparHtmlBasico(normalizado);

  // 3. Reemplazar enlaces seguros [etiqueta](https://...)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,
    '<a href="$2" data-enlace="$2" target="_blank" rel="noopener noreferrer" style="color:#007DC5;text-decoration:underline;font-weight:700;">$1</a>'
  );

  // 4. Colores institucionales [azul:...], [magenta:...], [verde:...] (aplicado de adentro hacia afuera si hubiera anidación)
  for (let i = 0; i < 3; i++) {
    html = html.replace(
      /\[azul:([^\[\]]*?)\]/g,
      '<span data-color="azul" style="color:#007DC5;font-weight:700;">$1</span>'
    );
    html = html.replace(
      /\[magenta:([^\[\]]*?)\]/g,
      '<span data-color="magenta" style="color:#ED145B;font-weight:700;">$1</span>'
    );
    html = html.replace(
      /\[verde:([^\[\]]*?)\]/g,
      '<span data-color="verde" style="color:#047857;font-weight:700;">$1</span>'
    );
  }

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

  // 7. Negrita + Cursiva combinadas ***texto***
  html = html.replace(
    /\*\*\*([\s\S]+?)\*\*\*/g,
    '<strong style="font-weight:800;"><em style="font-style:italic;">$1</em></strong>'
  );

  // 8. Negrita **texto**
  html = html.replace(
    /\*\*([\s\S]+?)\*\*/g,
    '<strong style="font-weight:800;">$1</strong>'
  );

  // 9. Cursiva *texto* (evitando colisión con viñetas sueltas)
  html = html.replace(
    /(^|[^*])\*([^*\n]+?)\*(?!\*)/g,
    '$1<em style="font-style:italic;">$2</em>'
  );

  // 10. Limpiar marcadores huérfanos residuales si quedaron vacíos
  html = html
    .replace(/\*{2,}/g, '')
    .replace(/_{2,}/g, '')
    .replace(/={2,}/g, '')
    .replace(/\[(azul|magenta|verde):|\]/g, (match) =>
      match.startsWith('[') ? '' : match
    );

  // 11. Saltos de línea
  html = html.replace(/\r?\n/g, '<br />');

  return html;
}

/**
 * Elimina las marcas de formato y devuelve texto plano limpio (ideal para PDF con jsPDF y buscadores).
 */
export function limpiarFormatoTextoPlano(texto: string): string {
  if (!texto) return '';

  let limpio = String(texto)
    .replace(/<\s*(b|strong|i|em|u|mark|span)\b[^>]*>(.*?)<\s*\/\s*\1\s*>/gis, '$2')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '$1 ($2)');

  // Desanidar colores si existieran varios niveles
  let prev = '';
  while (prev !== limpio) {
    prev = limpio;
    limpio = limpio.replace(/\[(azul|magenta|verde):([\s\S]*?)\]/g, '$2');
  }

  return limpio
    .replace(/==([\s\S]+?)==/g, '$1')
    .replace(/__([\s\S]+?)__/g, '$1')
    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, '$1')
    .replace(/\*\*([\s\S]+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+?)\*(?!\*)/g, '$1$2')
    .replace(/\*{2,}|_{2,}|={2,}/g, '');
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

interface EstiloActivoRun {
  negrita: boolean;
  cursiva: boolean;
  subrayado: boolean;
  resaltado: boolean;
  color: 'azul' | 'magenta' | 'verde' | null;
  enlaceUrl: string | null;
}

interface SegmentoSerializado {
  tipo: 'texto' | 'salto';
  texto: string;
  estilo: EstiloActivoRun;
}

function estilosIguales(a: EstiloActivoRun, b: EstiloActivoRun): boolean {
  return (
    a.negrita === b.negrita &&
    a.cursiva === b.cursiva &&
    a.subrayado === b.subrayado &&
    a.resaltado === b.resaltado &&
    a.color === b.color &&
    a.enlaceUrl === b.enlaceUrl
  );
}

/**
 * Convierte el árbol DOM de un editor visual contentEditable a la cadena canónica sin duplicaciones
 * ni símbolos anidados redundantes.
 */
export function serializarDomEditorATexto(raiz: HTMLElement): string {
  const segmentos: SegmentoSerializado[] = [];

  const estiloInicial: EstiloActivoRun = {
    negrita: false,
    cursiva: false,
    subrayado: false,
    resaltado: false,
    color: null,
    enlaceUrl: null,
  };

  const agregarSalto = () => {
    if (segmentos.length > 0 && segmentos[segmentos.length - 1].tipo !== 'salto') {
      segmentos.push({
        tipo: 'salto',
        texto: '\n',
        estilo: { ...estiloInicial },
      });
    } else if (segmentos.length > 0 && segmentos[segmentos.length - 1].tipo === 'salto') {
      segmentos.push({
        tipo: 'salto',
        texto: '\n',
        estilo: { ...estiloInicial },
      });
    }
  };

  const recorrer = (nodo: Node, estiloPadre: EstiloActivoRun) => {
    if (nodo.nodeType === Node.TEXT_NODE) {
      const contenido = (nodo.textContent || '').replace(/\u200B/g, '');
      if (!contenido) return;

      const ultimo = segmentos[segmentos.length - 1];
      if (ultimo && ultimo.tipo === 'texto' && estilosIguales(ultimo.estilo, estiloPadre)) {
        ultimo.texto += contenido;
      } else {
        segmentos.push({
          tipo: 'texto',
          texto: contenido,
          estilo: { ...estiloPadre },
        });
      }
      return;
    }

    if (nodo.nodeType !== Node.ELEMENT_NODE) return;

    const el = nodo as HTMLElement;
    const tag = el.tagName.toUpperCase();

    if (tag === 'BR') {
      segmentos.push({
        tipo: 'salto',
        texto: '\n',
        estilo: { ...estiloInicial },
      });
      return;
    }

    const esBloque = tag === 'DIV' || tag === 'P' || tag === 'LI';
    if (esBloque && segmentos.length > 0 && segmentos[segmentos.length - 1].tipo !== 'salto') {
      agregarSalto();
    }

    const nuevoEstilo: EstiloActivoRun = { ...estiloPadre };

    if (tag === 'B' || tag === 'STRONG' || el.dataset.formato === 'negrita') {
      nuevoEstilo.negrita = true;
    }
    if (tag === 'I' || tag === 'EM' || el.dataset.formato === 'cursiva') {
      nuevoEstilo.cursiva = true;
    }
    if (tag === 'U' || el.dataset.formato === 'subrayado') {
      nuevoEstilo.subrayado = true;
    }
    if (tag === 'MARK' || el.dataset.formato === 'resaltado') {
      nuevoEstilo.resaltado = true;
    }

    const dataColor = el.dataset.color;
    if (dataColor === 'azul' || dataColor === 'magenta' || dataColor === 'verde') {
      nuevoEstilo.color = dataColor;
    } else if (tag === 'FONT' || el.style?.color) {
      const colorCss = (el.getAttribute('color') || el.style.color || '').toLowerCase();
      if (colorCss.includes('007dc5') || colorCss.includes('0, 125, 197')) {
        nuevoEstilo.color = 'azul';
      } else if (colorCss.includes('ed145b') || colorCss.includes('237, 20, 91')) {
        nuevoEstilo.color = 'magenta';
      } else if (colorCss.includes('047857') || colorCss.includes('4, 120, 87')) {
        nuevoEstilo.color = 'verde';
      }
    }

    if (el.style?.fontWeight === 'bold' || Number(el.style?.fontWeight) >= 700) {
      if (!dataColor && tag !== 'A') {
        nuevoEstilo.negrita = true;
      }
    }
    if (el.style?.fontStyle === 'italic') {
      nuevoEstilo.cursiva = true;
    }
    if (el.style?.textDecoration?.includes('underline') && tag !== 'A') {
      nuevoEstilo.subrayado = true;
    }

    if (tag === 'A') {
      const href = el.getAttribute('href') || el.dataset.enlace || '';
      if (/^(https?:\/\/|mailto:)/i.test(href)) {
        nuevoEstilo.enlaceUrl = href;
      }
    }

    if (tag === 'LI') {
      segmentos.push({
        tipo: 'texto',
        texto: '• ',
        estilo: { ...estiloInicial },
      });
    }

    const hijos = Array.from(el.childNodes);
    for (const hijo of hijos) {
      recorrer(hijo, nuevoEstilo);
    }
  };

  for (const hijo of Array.from(raiz.childNodes)) {
    recorrer(hijo, estiloInicial);
  }

  // Formatear cada segmento plano sin duplicar ni anidar el mismo marcador
  const resultadoPartes: string[] = [];

  for (const seg of segmentos) {
    if (seg.tipo === 'salto') {
      resultadoPartes.push('\n');
      continue;
    }

    const textoCrudo = seg.texto;
    if (!textoCrudo) continue;

    // Preservar espacios laterales fuera de los delimitadores de formato para que Markdown/parser nunca falle
    const matchEspacios = textoCrudo.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const espacioIzq = matchEspacios ? matchEspacios[1] : '';
    const nucleo = matchEspacios ? matchEspacios[2] : textoCrudo;
    const espacioDer = matchEspacios ? matchEspacios[3] : '';

    if (!nucleo) {
      resultadoPartes.push(textoCrudo);
      continue;
    }

    const { estilo } = seg;
    if (estilo.enlaceUrl) {
      resultadoPartes.push(`${espacioIzq}[${nucleo}](${estilo.enlaceUrl})${espacioDer}`);
      continue;
    }

    let envuelto = nucleo;
    if (estilo.cursiva && estilo.negrita) {
      envuelto = `***${envuelto}***`;
    } else if (estilo.negrita) {
      envuelto = `**${envuelto}**`;
    } else if (estilo.cursiva) {
      envuelto = `*${envuelto}*`;
    }

    if (estilo.subrayado) {
      envuelto = `__${envuelto}__`;
    }
    if (estilo.resaltado) {
      envuelto = `==${envuelto}==`;
    }
    if (estilo.color) {
      envuelto = `[${estilo.color}:${envuelto}]`;
    }

    resultadoPartes.push(`${espacioIzq}${envuelto}${espacioDer}`);
  }

  return resultadoPartes.join('').replace(/\n+$/, '');
}
