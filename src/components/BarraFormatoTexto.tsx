import React, { useRef, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Highlighter,
  List,
  Link2,
  Eraser,
  Eye,
  EyeOff,
  Palette
} from 'lucide-react';
import {
  formatearTextoAHtmlSeguro,
  limpiarFormatoTextoPlano,
  tieneFormatoEnriquecido
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
  as: Tag = 'span'
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

/**
 * Caja de texto enriquecida con barra de herramientas de formato institucional
 * (Negrita, Cursiva, Subrayado, Resaltado, Colores Villa Flora, Viñetas, Enlace y Vista Previa).
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
  id
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [mostrarInputEnlace, setMostrarInputEnlace] = useState(false);
  const [urlEnlace, setUrlEnlace] = useState('https://');
  const [textoEnlace, setTextoEnlace] = useState('');

  const aplicarEnvoltura = (prefijo: string, sufijo: string, textoEjemplo = 'texto') => {
    if (disabled) return;
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}${prefijo}${textoEjemplo}${sufijo}`);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const seleccionado = value.slice(start, end);

    // Si ya tiene el formato exactamente alrededor o dentro de la selección, alternarlo (quitarlo)
    if (
      seleccionado.startsWith(prefijo) &&
      seleccionado.endsWith(sufijo) &&
      seleccionado.length >= prefijo.length + sufijo.length
    ) {
      const sinFormato = seleccionado.slice(prefijo.length, seleccionado.length - sufijo.length);
      const nuevoTexto = value.slice(0, start) + sinFormato + value.slice(end);
      onChange(nuevoTexto);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + sinFormato.length);
      });
      return;
    }

    const contenido = seleccionado || textoEjemplo;
    const reemplazo = `${prefijo}${contenido}${sufijo}`;
    const nuevoTexto = value.slice(0, start) + reemplazo + value.slice(end);
    onChange(nuevoTexto);

    requestAnimationFrame(() => {
      el.focus();
      const nuevoInicio = start + prefijo.length;
      const nuevoFin = nuevoInicio + contenido.length;
      el.setSelectionRange(nuevoInicio, nuevoFin);
    });
  };

  const insertarListaVinetas = () => {
    if (disabled) return;
    const el = textareaRef.current;
    if (!el) {
      onChange(value ? `${value}\n• ` : '• ');
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const seleccionado = value.slice(start, end);

    if (seleccionado) {
      const lineas = seleccionado
        .split('\n')
        .map((l) => (l.trim().startsWith('•') ? l : `• ${l}`))
        .join('\n');
      const nuevoTexto = value.slice(0, start) + lineas + value.slice(end);
      onChange(nuevoTexto);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start, start + lineas.length);
      });
    } else {
      const necesitaSalto = start > 0 && value[start - 1] !== '\n';
      const insercion = `${necesitaSalto ? '\n' : ''}• `;
      const nuevoTexto = value.slice(0, start) + insercion + value.slice(end);
      onChange(nuevoTexto);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + insercion.length;
        el.setSelectionRange(pos, pos);
      });
    }
  };

  const abrirAsistenteEnlace = () => {
    if (disabled) return;
    const el = textareaRef.current;
    if (el) {
      const seleccionado = value.slice(el.selectionStart, el.selectionEnd).trim();
      setTextoEnlace(seleccionado || 'Ver documento');
    } else {
      setTextoEnlace('Ver documento');
    }
    setUrlEnlace('https://');
    setMostrarInputEnlace((prev) => !prev);
  };

  const confirmarInsertarEnlace = () => {
    const urlLimpia = urlEnlace.trim();
    if (!urlLimpia || !/^https?:\/\//i.test(urlLimpia)) return;
    const etiqueta = (textoEnlace || 'Enlace').trim();
    const markdownLink = `[${etiqueta}](${urlLimpia})`;

    const el = textareaRef.current;
    if (el) {
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const nuevoTexto = value.slice(0, start) + markdownLink + value.slice(end);
      onChange(nuevoTexto);
    } else {
      onChange(`${value ? `${value} ` : ''}${markdownLink}`);
    }
    setMostrarInputEnlace(false);
  };

  const limpiarTodoElFormato = () => {
    if (disabled || !value) return;
    onChange(limpiarFormatoTextoPlano(value));
  };

  const manejarAtajosTeclado = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        aplicarEnvoltura('**', '**', 'texto en negrita');
      } else if (key === 'i') {
        e.preventDefault();
        aplicarEnvoltura('*', '*', 'texto en cursiva');
      } else if (key === 'u') {
        e.preventDefault();
        aplicarEnvoltura('__', '__', 'texto subrayado');
      }
    }
  };

  const hayFormato = tieneFormatoEnriquecido(value);

  return (
    <div
      className={`rounded-sm border border-slate-200 bg-white focus-within:border-[#007DC5] focus-within:ring-1 focus-within:ring-[#007DC5]/20 transition-all overflow-hidden ${
        disabled ? 'opacity-60 pointer-events-none bg-slate-50' : ''
      } ${className}`}
    >
      {/* Barra de herramientas de formato */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-2 py-1 bg-slate-50 border-b border-slate-200 select-none">
        <div className="flex flex-wrap items-center gap-0.5">
          <button
            type="button"
            onClick={() => aplicarEnvoltura('**', '**', 'negrita')}
            disabled={disabled}
            title="Negrita (Ctrl+B)"
            className="p-1.5 rounded-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => aplicarEnvoltura('*', '*', 'cursiva')}
            disabled={disabled}
            title="Cursiva (Ctrl+I)"
            className="p-1.5 rounded-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => aplicarEnvoltura('__', '__', 'subrayado')}
            disabled={disabled}
            title="Subrayado (Ctrl+U)"
            className="p-1.5 rounded-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-200 mx-0.5" />

          <button
            type="button"
            onClick={() => aplicarEnvoltura('==', '==', 'importante')}
            disabled={disabled}
            title="Resaltador amarillo"
            className="p-1.5 rounded-xs text-amber-600 hover:text-amber-800 hover:bg-amber-100/80 transition-colors cursor-pointer"
          >
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => aplicarEnvoltura('[azul:', ']', 'destacado')}
            disabled={disabled}
            title="Color Azul Institucional Villa Flora"
            className="px-1.5 py-1 rounded-xs text-[10px] font-black text-[#007DC5] hover:bg-sky-100 transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <Palette className="w-3 h-3" />
            <span>AZUL</span>
          </button>
          <button
            type="button"
            onClick={() => aplicarEnvoltura('[magenta:', ']', 'urgente')}
            disabled={disabled}
            title="Color Magenta Institucional (Énfasis / Urgente)"
            className="px-1.5 py-1 rounded-xs text-[10px] font-black text-[#ED145B] hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-0.5"
          >
            <Palette className="w-3 h-3" />
            <span>MAGENTA</span>
          </button>

          <span className="w-px h-4 bg-slate-200 mx-0.5" />

          <button
            type="button"
            onClick={insertarListaVinetas}
            disabled={disabled}
            title="Insertar viñeta (•)"
            className="p-1.5 rounded-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={abrirAsistenteEnlace}
            disabled={disabled}
            title="Insertar enlace web"
            className={`p-1.5 rounded-xs transition-colors cursor-pointer ${
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
              onClick={limpiarTodoElFormato}
              disabled={disabled}
              title="Quitar todo el formato del texto"
              className="p-1.5 rounded-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Eraser className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {value.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setMostrarVistaPrevia((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              mostrarVistaPrevia
                ? 'bg-[#007DC5] text-white'
                : 'text-slate-600 hover:bg-slate-200/70'
            }`}
            title="Alternar vista previa con formato"
          >
            {mostrarVistaPrevia ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Editar</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Vista previa</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Mini panel para insertar enlace */}
      {mostrarInputEnlace && (
        <div className="p-2 bg-sky-50/80 border-b border-sky-200 flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            value={textoEnlace}
            onChange={(e) => setTextoEnlace(e.target.value)}
            placeholder="Texto visible"
            className="px-2 py-1 border border-slate-300 rounded-xs bg-white text-slate-800 text-xs flex-1 min-w-[120px]"
          />
          <input
            type="url"
            value={urlEnlace}
            onChange={(e) => setUrlEnlace(e.target.value)}
            placeholder="https://..."
            className="px-2 py-1 border border-slate-300 rounded-xs bg-white text-slate-800 text-xs flex-2 min-w-[160px]"
          />
          <button
            type="button"
            onClick={confirmarInsertarEnlace}
            className="px-2.5 py-1 bg-[#007DC5] text-white font-bold rounded-xs hover:bg-[#0066a2] cursor-pointer text-[11px]"
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

      {/* Área de escritura o Vista Previa */}
      {mostrarVistaPrevia ? (
        <div
          onClick={() => setMostrarVistaPrevia(false)}
          title="Haz clic para volver a editar"
          className={`w-full px-3 py-2 text-sm text-slate-800 bg-amber-50/20 min-h-[60px] cursor-text leading-relaxed ${
            compact ? 'text-xs' : 'text-sm'
          }`}
        >
          <TextoFormateado texto={value} />
        </div>
      ) : (
        <textarea
          id={id}
          ref={textareaRef}
          rows={rows}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={manejarAtajosTeclado}
          placeholder={placeholder}
          className={`w-full px-3 py-2 text-slate-800 bg-transparent focus:outline-none resize-y ${
            compact ? 'text-xs' : 'text-sm'
          } ${textareaClassName}`}
        />
      )}

      {/* Pie de vista previa instantánea si contiene formato y no está en modo vista previa */}
      {!mostrarVistaPrevia && hayFormato && value.trim().length > 0 && (
        <div className="px-3 py-1.5 bg-slate-50/90 border-t border-slate-100 text-xs text-slate-700 flex items-baseline gap-2">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Así se verá:
          </span>
          <div className="leading-snug break-words">
            <TextoFormateado texto={value} />
          </div>
        </div>
      )}
    </div>
  );
};
