import React, { useEffect, useState } from 'react';
import { Sparkles, Cpu, Clock, AlertCircle, CheckCircle2, Minimize2, Maximize2, ShieldAlert } from 'lucide-react';

export interface EtapaCargaIA {
  porcentajeHasta: number;
  titulo: string;
  descripcion: string;
}

export interface ModalCargaIAProps {
  activo: boolean;
  titulo?: string;
  subtitulo?: string;
  operacionNombre?: string;
  etapasPersonalizadas?: EtapaCargaIA[];
  duracionEstimadaSegundos?: number;
  completado?: boolean;
  error?: string | null;
  onMinimizarToggle?: () => void;
  esMinimizado?: boolean;
}

const ETAPAS_POR_DEFECTO: EtapaCargaIA[] = [
  {
    porcentajeHasta: 20,
    titulo: 'Lectura e Inspección de Documento',
    descripcion: 'Iniciando conexión segura con el motor de IA Gemini y leyendo la estructura del archivo...',
  },
  {
    porcentajeHasta: 45,
    titulo: 'Extracción de Semanas y Artículos',
    descripcion: 'Identificando semanas lectivas, desarrollo institucional, vacaciones docentes y receso estudiantil...',
  },
  {
    porcentajeHasta: 75,
    titulo: 'Cruce con Festivos Oficiales de Colombia',
    descripcion: 'Calculando los 18 festivos del año lectivo por Ley Emiliani y definiendo los tres periodos académicos...',
  },
  {
    porcentajeHasta: 92,
    titulo: 'Estructuración y Formateo JSON',
    descripcion: 'Organizando el calendario oficial en el formato estandarizado para NotiProfes Digital...',
  },
  {
    porcentajeHasta: 100,
    titulo: 'Finalizando y Sincronizando',
    descripcion: 'Consolidando la vista previa del calendario en la plataforma...',
  },
];

export const ModalCargaIA: React.FC<ModalCargaIAProps> = ({
  activo,
  titulo = 'Procesamiento Inteligente en Curso',
  subtitulo = 'El motor de IA Gemini está analizando y estructurando la información institucional.',
  operacionNombre = 'Análisis de Decreto con IA',
  etapasPersonalizadas,
  duracionEstimadaSegundos = 18,
  completado = false,
  error = null,
  onMinimizarToggle,
  esMinimizado = false,
}) => {
  const [porcentaje, setPorcentaje] = useState<number>(5);
  const [segundosTranscurridos, setSegundosTranscurridos] = useState<number>(0);
  const etapas = etapasPersonalizadas || ETAPAS_POR_DEFECTO;

  // Reiniciar estado cuando se activa una nueva operación
  useEffect(() => {
    if (activo) {
      setPorcentaje(5);
      setSegundosTranscurridos(0);
    }
  }, [activo]);

  // Contador de segundos transcurridos
  useEffect(() => {
    if (!activo || completado || error) return;

    const intervalTimer = setInterval(() => {
      setSegundosTranscurridos((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [activo, completado, error]);

  // Simulación progresiva fluida del porcentaje de carga
  useEffect(() => {
    if (!activo) return;

    if (error) {
      return;
    }

    if (completado) {
      setPorcentaje(100);
      return;
    }

    // Tasa de incremento progresivo asintótico hacia 94%
    const intervalProgress = setInterval(() => {
      setPorcentaje((prev) => {
        if (prev >= 94) return 94; // Mantenerse cerca del 94% hasta que llegue la respuesta real
        const restante = 94 - prev;
        const incremento = Math.max(0.5, Math.min(4, restante / (duracionEstimadaSegundos * 0.8)));
        return Math.min(94, Math.round((prev + incremento) * 10) / 10);
      });
    }, 250);

    return () => clearInterval(intervalProgress);
  }, [activo, completado, error, duracionEstimadaSegundos]);

  if (!activo) return null;

  // Obtener la etapa actual según el porcentaje
  const etapaActualIndice = etapas.findIndex((e) => porcentaje <= e.porcentajeHasta);
  const etapaActual = etapas[etapaActualIndice >= 0 ? etapaActualIndice : etapas.length - 1];

  // Si está minimizado, mostrar una barra/píldora flotante discreta en la esquina inferior derecha
  if (esMinimizado) {
    return (
      <div
        role="dialog"
        aria-label="Progreso de IA en segundo plano"
        className="no-print fixed bottom-5 right-5 z-50 bg-slate-900/95 text-white border border-sky-400/50 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md max-w-xs w-full transition-all duration-300 animate-fade-in"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-amber-300" />
            </div>
            <span className="text-xs font-display font-bold text-sky-200 truncate max-w-[140px]">
              {operacionNombre}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono-tabular font-extrabold text-amber-300 bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-700">
              {Math.round(porcentaje)}%
            </span>
            {onMinimizarToggle && (
              <button
                type="button"
                onClick={onMinimizarToggle}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Maximizar progreso de IA"
                aria-label="Maximizar modal de progreso de IA"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Barra de progreso minimizada */}
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden p-0.5 border border-slate-700/80">
          <div
            className="h-full bg-gradient-to-r from-sky-400 via-[#007DC5] to-emerald-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(4, porcentaje)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 font-mono-tabular">
          <span className="truncate max-w-[180px]">{etapaActual.titulo}</span>
          <span>{segundosTranscurridos}s</span>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none"
    >
      <div className="bg-slate-900 border border-sky-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden space-y-6">
        {/* Efecto de resplandor decorativo de fondo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#ED145B]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado con insignias y controles */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#034EA2] to-[#007DC5] text-white shadow-lg border border-sky-400/30 shrink-0">
              <Cpu className="w-6 h-6 animate-pulse text-sky-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-400/30 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Motor de IA Gemini
                </span>
                <span className="text-[10.5px] font-mono-tabular text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {segundosTranscurridos}s transcurridos
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-white mt-1">
                {titulo}
              </h2>
            </div>
          </div>

          {onMinimizarToggle && (
            <button
              type="button"
              onClick={onMinimizarToggle}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 border border-slate-700"
              title="Continuar en segundo plano"
              aria-label="Minimizar modal de progreso de IA"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed relative z-10">
          {subtitulo}
        </p>

        {/* Sección de porcentaje y barra de carga principal */}
        <div className="space-y-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 relative z-10">
          <div className="flex items-baseline justify-between text-xs font-display">
            <span className="font-bold text-sky-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              {etapaActual.titulo}
            </span>
            <span className="text-2xl font-mono-tabular font-extrabold text-white tracking-tight">
              {Math.round(porcentaje)}%
            </span>
          </div>

          {/* Barra de progreso estilizada */}
          <div className="w-full bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-700 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-sky-400 via-[#007DC5] to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm"
              style={{ width: `${Math.max(3, porcentaje)}%` }}
            />
          </div>

          <p className="text-[11.5px] text-slate-400 leading-snug italic pt-0.5">
            "{etapaActual.descripcion}"
          </p>
        </div>

        {/* Pasos / Etapas de ejecución */}
        <div className="space-y-2 relative z-10">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Fases del Procesamiento:
          </h3>

          <div className="grid grid-cols-1 gap-1.5">
            {etapas.map((etapa, idx) => {
              const esCompletada = porcentaje >= etapa.porcentajeHasta;
              const esEnCurso =
                porcentaje < etapa.porcentajeHasta &&
                (idx === 0 || porcentaje >= etapas[idx - 1].porcentajeHasta);

              return (
                <div
                  key={`etapa-${idx}-${etapa.porcentajeHasta}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs transition-all ${
                    esCompletada
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : esEnCurso
                      ? 'bg-sky-950/50 border-sky-400/50 text-sky-100 font-medium ring-1 ring-sky-400/30'
                      : 'bg-slate-950/30 border-slate-800/80 text-slate-500'
                  }`}
                >
                  {esCompletada ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : esEnCurso ? (
                    <div className="w-4 h-4 rounded-full border-2 border-sky-400 border-t-transparent animate-spin shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 bg-slate-800 shrink-0" />
                  )}
                  <span className="truncate">{etapa.titulo}</span>
                  <span className="ml-auto text-[10px] font-mono-tabular opacity-70">
                    {etapa.porcentajeHasta}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advertencia preventiva */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200/90 relative z-10">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-snug text-[11.5px]">
            <strong>Atención:</strong> El análisis profundo con Inteligencia Artificial puede tomar entre 10 y 30 segundos segun la longitud del documento.{' '}
            <span className="text-amber-100 font-semibold">Por favor no cierre ni recargue la página.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
