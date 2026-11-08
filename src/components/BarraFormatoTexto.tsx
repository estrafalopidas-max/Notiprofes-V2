import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  Link2,
  Eraser,
  Palette,
} from 'lucide-react';
import {
  formatearTextoAHtmlSeguro,
  limpiarFormatoTextoPlano,
  serializarDomEditorATexto,
  tieneFormatoEnriquecido,
} from '../utils/formatoTexto';

interface TextoFormateadoProps {
  texto: string;
  className?: string;
  as?: 'span' | 'div' | 'p';
}

/**
 * Renderizador seguro de texto con formato ligero para las vistas React del boletín y del editor.
 */
export const TextoFormateado: React.FC<TextoFormateadoProps> = ({
  texto,
  className = '',
  as: Tag = 'span',
}) => {
  const htmlSeguro = formatearTextoAHtmlSeguro(texto);
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlSeguro }}
    />
  );
};

interface EditorTextoFormateadoProps {
  value: string;
  onChange: (nuevoValor: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
  compact?: boolean;
  id?: string;
}

interface EstadoFormatosActivos {
  negrita: boolean;
  cursiva: boolean;
  subrayado: boolean;
  resaltado: boolean;
  color: 'azul' | 'magenta' | null;
}

/**
 * Caja de texto visual WYSIWYG con barra de herramientas de formato institucional
 * (Negrita, Cursiva, Subrayado, Resaltado, Colores Villa Flora, Viñetas, Enlace y Limpiar formato).
 * El usuario ve el formato aplicado directamente sobre las palabras (como en Word), sin símbolos ni códigos.
 */
export const EditorTextoFormateado: React.FC<EditorTextoFormateadoProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  rows = 2,
  disabled = false,
  className = '',
  textareaClassName = '',
  compact = false,
  id,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const ultimoValorEmitidoRef = useRef<string>(value);
  const rangoGuardadoRef = useRef<Range | null>(null);

  const [mostrarInputEnlace, setMostrarInputEnlace] = useState(false);
  const [urlEnlace, setUrlEnlace] = useState('https://');
  const [textoEnlace, setTextoEnlace] = useState('');
  const [enfocado, setEnfocado] = useState(false);
  const [formatosActivos, setFormatosActivos] = useState<EstadoFormatosActivos>({
    negrita: false,
    cursiva: false,
    subrayado: false,
    resaltado: false,
    color: null,
  });

  // Sincroniza el contenido HTML del editor cuando `value` cambia desde afuera (ej. limpiar formulario o cargar actividad)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (value !== ultimoValorEmitidoRef.current || el.innerHTML === '' && value !== '') {
      el.innerHTML = value ? formatearTextoAHtmlSeguro(value) : '';
      ultimoValorEmitidoRef.current = value;
    } else if (!value && el.innerHTML !== '') {
      el.innerHTML = '';
      ultimoValorEmitidoRef.current = '';
    }
  }, [value]);

  const sincronizarCambioDesdeDom = () => {
    const el = editorRef.current;
    if (!el) return;
    const textoPlanoActual = (el.textContent || '').replace(/\u200B/g, '').trim();
    if (!textoPlanoActual) {
      ultimoValorEmitidoRef.current = '';
      onChange('');
      return;
    }
    const serializado = serializarDomEditorATexto(el);
    ultimoValorEmitidoRef.current = serializado;
    onChange(serializado);
  };

  const buscarAncestroEnEditor = (
    nodoInicial: Node | null,
    predicado: (el: HTMLElement) => boolean
  ): HTMLElement | null => {
    const raiz = editorRef.current;
    if (!raiz || !nodoInicial) return null;
    let actual: Node | null =
      nodoInicial.nodeType === Node.TEXT_NODE ? nodoInicial.parentNode : nodoInicial;
    while (actual && actual !== raiz && actual instanceof HTMLElement) {
      if (predicado(actual)) return actual;
      actual = actual.parentNode;
    }
    return null;
  };

  const actualizarIndicadoresFormato = () => {
    const raiz = editorRef.current;
    const sel = window.getSelection();
    if (!raiz || !sel || sel.rangeCount === 0) return;
    const anchor = sel.anchorNode;
    if (!anchor || !raiz.contains(anchor)) return;

    let negrita = false;
    let cursiva = false;
    let subrayado = false;
    try {
      negrita = document.queryCommandState('bold');
      cursiva = document.queryCommandState('italic');
      subrayado = document.queryCommandState('underline');
    } catch {
      // Ignorar en entornos sin soporte queryCommandState
    }

    if (!negrita) {
      negrita = Boolean(
        buscarAncestroEnEditor(
          anchor,
          (e) => e.tagName === 'B' || e.tagName === 'STRONG' || e.dataset.formato === 'negrita'
        )
      );
    }
    if (!cursiva) {
      cursiva = Boolean(
        buscarAncestroEnEditor(
          anchor,
          (e) => e.tagName === 'I' || e.tagName === 'EM' || e.dataset.formato === 'cursiva'
        )
      );
    }
    if (!subrayado) {
      subrayado = Boolean(
        buscarAncestroEnEditor(
          anchor,
          (e) => e.tagName === 'U' || e.dataset.formato === 'subrayado'
        )
      );
    }

    const resaltado = Boolean(
      buscarAncestroEnEditor(
        anchor,
        (e) => e.tagName === 'MARK' || e.dataset.formato === 'resaltado'
      )
    );

    const nodoColor = buscarAncestroEnEditor(
      anchor,
      (e) => e.dataset.color === 'azul' || e.dataset.color === 'magenta'
    );
    const color =
      nodoColor?.dataset.color === 'azul'
        ? 'azul'
        : nodoColor?.dataset.color === 'magenta'
          ? 'magenta'
          : null;

    setFormatosActivos({
      negrita,
      cursiva,
      subrayado,
      resaltado,
      color,
    });
  };

  const desenvolverElemento = (elemento: HTMLElement) => {
    const padre = elemento.parentNode;
    if (!padre) return;
    while (elemento.firstChild) {
      padre.insertBefore(elemento.firstChild, elemento);
    }
    padre.removeChild(elemento);
  };

  const asegurarFocoYSeleccion = (): Selection | null => {
    const raiz = editorRef.current;
    if (!raiz) return null;
    raiz.focus();
    const sel = window.getSelection();
    if (!sel) return null;
    if (sel.rangeCount === 0 || !raiz.contains(sel.anchorNode)) {
      const rango = document.createRange();
      rango.selectNodeContents(raiz);
      rango.collapse(false);
      sel.removeAllRanges();
      sel.addRange(rango);
    }
    return sel;
  };

  const ejecutarComandoBasico = (comando: 'bold' | 'italic' | 'underline') => {
    if (disabled) return;
    const sel = asegurarFocoYSeleccion();
    if (!sel) return;
    document.execCommand(comando, false);
    sincronizarCambioDesdeDom();
    actualizarIndicadoresFormato();
  };

  const alternarResaltadoAmarillo = () => {
    if (disabled) return;
    const sel = asegurarFocoYSeleccion();
    const raiz = editorRef.current;
    if (!sel || !raiz || sel.rangeCount === 0) return;

    const rango = sel.getRangeAt(0);
    const markExistente = buscarAncestroEnEditor(
      rango.commonAncestorContainer,
      (e) => e.tagName === 'MARK' || e.dataset.formato === 'resaltado'
    );

    if (markExistente) {
      desenvolverElemento(markExistente);
      sincronizarCambioDesdeDom();
      actualizarIndicadoresFormato();
      return;
    }

    if (rango.collapsed) {
      // Si no hay texto seleccionado, insertar un bloque resaltado listo para escribir
      const mark = document.createElement('mark');
      mark.dataset.formato = 'resaltado';
      mark.style.cssText =
        'background-color:#FEF08A;color:#0F172A;padding:0 4px;border-radius:3px;font-weight:600;';
      mark.textContent = 'texto resaltado';
      rango.insertNode(mark);
      const nuevoRango = document.createRange();
      nuevoRango.selectNodeContents(mark);
      sel.removeAllRanges();
      sel.addRange(nuevoRango);
    } else {
      const fragmento = rango.extractContents();
      // Eliminar cualquier <mark> interno para no anidar
      fragmento.querySelectorAll('mark, [data-formato="resaltado"]').forEach((n) => {
        if (n instanceof HTMLElement) desenvolverElemento(n);
      });
      const mark = document.createElement('mark');
      mark.dataset.formato = 'resaltado';
      mark.style.cssText =
        'background-color:#FEF08A;color:#0F172A;padding:0 4px;border-radius:3px;font-weight:600;';
      mark.appendChild(fragmento);
      rango.insertNode(mark);
      const nuevoRango = document.createRange();
      nuevoRango.selectNodeContents(mark);
      sel.removeAllRanges();
      sel.addRange(nuevoRango);
    }

    sincronizarCambioDesdeDom();
    actualizarIndicadoresFormato();
  };

  const alternarColorInstitucional = (colorObjetivo: 'azul' | 'magenta') => {
    if (disabled) return;
    const sel = asegurarFocoYSeleccion();
    const raiz = editorRef.current;
    if (!sel || !raiz || sel.rangeCount === 0) return;

    const rango = sel.getRangeAt(0);
    const hexColor = colorObjetivo === 'azul' ? '#007DC5' : '#ED145B';

    const spanColorExistente = buscarAncestroEnEditor(
      rango.commonAncestorContainer,
      (e) => e.dataset.color === 'azul' || e.dataset.color === 'magenta'
    );

    if (spanColorExistente) {
      if (spanColorExistente.dataset.color === colorObjetivo) {
        // Si ya tiene este mismo color, quitarlo y volver a texto normal
        desenvolverElemento(spanColorExistente);
      } else {
        // Si tenía el otro color (ej. era azul y eligió magenta), cambiarlo limpiamente sin anidar
        spanColorExistente.dataset.color = colorObjetivo;
        spanColorExistente.style.color = hexColor;
        spanColorExistente.style.fontWeight = '700';
      }
      sincronizarCambioDesdeDom();
      actualizarIndicadoresFormato();
      return;
    }

    if (rango.collapsed) {
      const span = document.createElement('span');
      span.dataset.color = colorObjetivo;
      span.style.cssText = `color:${hexColor};font-weight:700;`;
      span.textContent = colorObjetivo === 'azul' ? 'texto azul' : 'texto urgente';
      rango.insertNode(span);
      const nuevoRango = document.createRange();
      nuevoRango.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(nuevoRango);
    } else {
      const fragmento = rango.extractContents();
      // Desenvolver cualquier color previo dentro de la selección para nunca anidar colores
      fragmento.querySelectorAll('[data-color]').forEach((n) => {
        if (n instanceof HTMLElement) desenvolverElemento(n);
      });
      const span = document.createElement('span');
      span.dataset.color = colorObjetivo;
      span.style.cssText = `color:${hexColor};font-weight:700;`;
      span.appendChild(fragmento);
      rango.insertNode(span);
      const nuevoRango = document.createRange();
      nuevoRango.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(nuevoRango);
    }

    sincronizarCambioDesdeDom();
    actualizarIndicadoresFormato();
  };

  const insertarListaVinetas = () => {
    if (disabled) return;
    const sel = asegurarFocoYSeleccion();
    if (!sel || sel.rangeCount === 0) return;

    const rango = sel.getRangeAt(0);
    const textoSeleccionado = rango.toString();

    if (textoSeleccionado.trim().length > 0) {
      const conVinetas = textoSeleccionado
        .split('\n')
        .map((l) => (l.trim().startsWith('•') ? l : `• ${l}`))
        .join('\n');
      document.execCommand('insertText', false, conVinetas);
    } else {
      const textoActual = editorRef.current?.textContent || '';
      const prefijo = textoActual.length > 0 && !textoActual.endsWith('\n') ? '\n• ' : '• ';
      document.execCommand('insertText', false, prefijo);
    }

    sincronizarCambioDesdeDom();
  };

  const abrirAsistenteEnlace = () => {
    if (disabled) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      rangoGuardadoRef.current = sel.getRangeAt(0).cloneRange();
      const txt = sel.toString().trim();
      setTextoEnlace(txt || 'Ver documento');
    } else {
      rangoGuardadoRef.current = null;
      setTextoEnlace('Ver documento');
    }
    setUrlEnlace('https://');
    setMostrarInputEnlace((prev) => !prev);
  };

  const confirmarInsertarEnlace = () => {
    const urlLimpia = urlEnlace.trim();
    if (!urlLimpia || !/^https?:\/\//i.test(urlLimpia)) return;
    const etiqueta = (textoEnlace || 'Enlace').trim();

    const raiz = editorRef.current;
    if (raiz) {
      raiz.focus();
      const sel = window.getSelection();
      if (sel && rangoGuardadoRef.current) {
        sel.removeAllRanges();
        sel.addRange(rangoGuardadoRef.current);
      }
      const a = document.createElement('a');
      a.href = urlLimpia;
      a.dataset.enlace = urlLimpia;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.style.cssText = 'color:#007DC5;text-decoration:underline;font-weight:700;';
      a.textContent = etiqueta;

      const selActual = window.getSelection();
      if (selActual && selActual.rangeCount > 0 && raiz.contains(selActual.anchorNode)) {
        const r = selActual.getRangeAt(0);
        r.deleteContents();
        r.insertNode(a);
        r.setStartAfter(a);
        r.collapse(true);
        selActual.removeAllRanges();
        selActual.addRange(r);
      } else {
        raiz.appendChild(a);
      }
      sincronizarCambioDesdeDom();
    }
    setMostrarInputEnlace(false);
  };

  const limpiarTodoElFormato = () => {
    if (disabled) return;
    const raiz = editorRef.current;
    if (!raiz) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && raiz.contains(sel.anchorNode)) {
      const r = sel.getRangeAt(0);
      const textoLimpio = r.toString();
      r.deleteContents();
      r.insertNode(document.createTextNode(textoLimpio));
      sincronizarCambioDesdeDom();
      actualizarIndicadoresFormato();
      return;
    }

    const limpioTotal = limpiarFormatoTextoPlano(value);
    raiz.innerText = limpioTotal;
    ultimoValorEmitidoRef.current = limpioTotal;
    onChange(limpioTotal);
    actualizarIndicadoresFormato();
  };

  const manejarAtajosTeclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        ejecutarComandoBasico('bold');
      } else if (key === 'i') {
        e.preventDefault();
        ejecutarComandoBasico('italic');
      } else if (key === 'u') {
        e.preventDefault();
        ejecutarComandoBasico('underline');
      }
    }
  };

  const manejarPegado = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    const textoPegado = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, textoPegado);
    sincronizarCambioDesdeDom();
  };

  const hayFormato = tieneFormatoEnriquecido(value);
  const estaVacio = !value || limpiarFormatoTextoPlano(value).trim().length === 0;
  const alturaMinimaPx = Math.max(44, rows * (compact ? 20 : 24) + 12);

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white focus-within:border-[#007DC5] focus-within:ring-1 focus-within:ring-[#007DC5]/20 transition-all overflow-hidden ${
        disabled ? 'opacity-60 pointer-events-none bg-slate-50' : ''
      } ${className}`}
    >
      {/* Barra de herramientas visual tipo procesador de texto */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1 bg-slate-50 border-b border-slate-200 select-none">
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => ejecutarComandoBasico('bold')}
            disabled={disabled}
            title="Negrita (Ctrl+B)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              formatosActivos.negrita
                ? 'bg-[#007DC5] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => ejecutarComandoBasico('italic')}
            disabled={disabled}
            title="Cursiva (Ctrl+I)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              formatosActivos.cursiva
                ? 'bg-[#007DC5] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => ejecutarComandoBasico('underline')}
            disabled={disabled}
            title="Subrayado (Ctrl+U)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              formatosActivos.subrayado
                ? 'bg-[#007DC5] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-200 mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={alternarResaltadoAmarillo}
            disabled={disabled}
            title="Resaltador amarillo (clic de nuevo para quitar)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              formatosActivos.resaltado
                ? 'bg-amber-300 text-slate-900 ring-1 ring-amber-500 font-bold'
                : 'text-amber-600 hover:text-amber-800 hover:bg-amber-100/80'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => alternarColorInstitucional('azul')}
            disabled={disabled}
            title="Color Azul Institucional Villa Flora (clic de nuevo para quitar)"
            className={`px-1.5 py-1 rounded-md text-[10px] font-black transition-colors cursor-pointer flex items-center gap-0.5 ${
              formatosActivos.color === 'azul'
                ? 'bg-[#007DC5] text-white shadow-2xs'
                : 'text-[#007DC5] hover:bg-sky-100'
            }`}
          >
            <Palette className="w-3 h-3" />
            <span>AZUL</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => alternarColorInstitucional('magenta')}
            disabled={disabled}
            title="Color Magenta Institucional (clic de nuevo para quitar)"
            className={`px-1.5 py-1 rounded-md text-[10px] font-black transition-colors cursor-pointer flex items-center gap-0.5 ${
              formatosActivos.color === 'magenta'
                ? 'bg-[#ED145B] text-white shadow-2xs'
                : 'text-[#ED145B] hover:bg-rose-100'
            }`}
          >
            <Palette className="w-3 h-3" />
            <span>MAGENTA</span>
          </button>

          <span className="w-px h-4 bg-slate-200 mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={insertarListaVinetas}
            disabled={disabled}
            title="Insertar viñeta (•)"
            className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={abrirAsistenteEnlace}
            disabled={disabled}
            title="Insertar enlace web"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              mostrarInputEnlace
                ? 'bg-[#007DC5] text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>

          {hayFormato && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={limpiarTodoElFormato}
              disabled={disabled}
              title="Quitar formato del texto seleccionado o de toda la caja"
              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center gap-1 text-[10px] font-semibold"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpiar formato</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini panel para insertar enlace */}
      {mostrarInputEnlace && (
        <div className="p-2 bg-sky-50/80 border-b border-sky-200 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            value={textoEnlace}
            onChange={(e) => setTextoEnlace(e.target.value)}
            placeholder="Texto visible"
            className="px-2 py-1 border border-slate-300 rounded-md bg-white text-slate-800 text-xs flex-1 min-w-[120px]"
          />
          <input
            type="url"
            value={urlEnlace}
            onChange={(e) => setUrlEnlace(e.target.value)}
            placeholder="https://..."
            className="px-2 py-1 border border-slate-300 rounded-md bg-white text-slate-800 text-xs flex-2 min-w-[160px]"
          />
          <button
            type="button"
            onClick={confirmarInsertarEnlace}
            className="px-2.5 py-1 bg-[#007DC5] text-white font-bold rounded-md hover:bg-[#0066a2] cursor-pointer text-[11px]"
          >
            Insertar
          </button>
          <button
            type="button"
            onClick={() => setMostrarInputEnlace(false)}
            className="px-2 py-1 text-slate-600 hover:text-slate-900 cursor-pointer text-[11px]"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Superficie editable 100% visual (WYSIWYG) sin símbolos de código */}
      <div className="relative">
        {estaVacio && !enfocado && (
          <div
            aria-hidden="true"
            onClick={() => editorRef.current?.focus()}
            className={`pointer-events-none select-none absolute inset-x-0 top-0 px-3 py-2 text-slate-400 leading-relaxed ${
              compact ? 'text-xs' : 'text-sm'
            }`}
          >
            {placeholder}
          </div>
        )}

        <div
          id={id}
          ref={editorRef}
          role="textbox"
          aria-multiline="true"
          aria-placeholder={placeholder}
          tabIndex={disabled ? -1 : 0}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onFocus={() => {
            setEnfocado(true);
            actualizarIndicadoresFormato();
          }}
          onBlur={() => {
            setEnfocado(false);
            sincronizarCambioDesdeDom();
          }}
          onInput={sincronizarCambioDesdeDom}
          onKeyUp={actualizarIndicadoresFormato}
          onMouseUp={actualizarIndicadoresFormato}
          onKeyDown={manejarAtajosTeclado}
          onPaste={manejarPegado}
          style={{ minHeight: `${alturaMinimaPx}px` }}
          className={`w-full px-3 py-2 text-slate-800 bg-transparent focus:outline-none leading-relaxed whitespace-pre-wrap break-words ${
            compact ? 'text-xs' : 'text-sm'
          } ${textareaClassName}`}
        />
      </div>
    </div>
  );
};
