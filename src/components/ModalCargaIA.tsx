import React, { useEffect, useState } from 'react';

export interface EtapaProgresoBoton {
  porcentajeHasta: number;
  textoAccion: string;
}

export interface BotonConProgresoProps {
  cargando: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variante?: 'azul' | 'esmeralda' | 'celeste';
  duracionEstimadaSegundos?: number;
  etapas?: EtapaProgresoBoton[];
  icono?: React.ReactNode;
  iconoCargando?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const ETAPAS_POR_DEFECTO: EtapaProgresoBoton[] = [
  { porcentajeHasta: 25, textoAccion: 'Iniciando proceso...' },
  { porcentajeHasta: 55, textoAccion: 'Procesando información...' },
  { porcentajeHasta: 85, textoAccion: 'Sincronizando datos...' },
  { porcentajeHasta: 100, textoAccion: 'Finalizando...' },
];

export const BotonConProgreso: React.FC<BotonConProgresoProps> = ({
  cargando,
  onClick,
  type = 'button',
  disabled = false,
  variante = 'azul',
  duracionEstimadaSegundos = 14,
  etapas = ETAPAS_POR_DEFECTO,
  icono,
  iconoCargando,
  children,
  className = '',
  title,
}) => {
  const [porcentaje, setPorcentaje] = useState<number>(6);

  useEffect(() => {
    if (!cargando) {
      setPorcentaje(6);
      return;
    }

    setPorcentaje(8);
    const intervalo = setInterval(() => {
      setPorcentaje((prev) => {
        if (prev >= 95) return 95;
        const restante = 95 - prev;
        const incremento = Math.max(0.8, Math.min(4.5, restante / (duracionEstimadaSegundos * 0.75)));
        return Math.min(95, Math.round((prev + incremento) * 10) / 10);
      });
    }, 220);

    return () => clearInterval(intervalo);
  }, [cargando, duracionEstimadaSegundos]);

  const etapaActual =
    etapas.find((e) => porcentaje <= e.porcentajeHasta) || etapas[etapas.length - 1];

  // Paletas según la variante del botón
  const estilosVariante = {
    azul: {
      inactivo: 'bg-[#007DC5] hover:bg-[#034EA2] text-white border border-[#034EA2]/20',
      fondoCargando: 'bg-[#022c5e] text-white border border-[#007DC5]/60',
      barraLlenado: 'bg-gradient-to-r from-[#034EA2] via-[#007DC5] to-[#38bdf8]',
      insigniaPorcentaje: 'bg-slate-950/35 text-sky-100 border border-white/25',
    },
    esmeralda: {
      inactivo: 'bg-[#059669] hover:bg-[#047857] text-white border border-[#047857]/20',
      fondoCargando: 'bg-[#064e3b] text-white border border-emerald-400/50',
      barraLlenado: 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#34d399]',
      insigniaPorcentaje: 'bg-slate-950/35 text-emerald-100 border border-white/25',
    },
    celeste: {
      inactivo: 'bg-sky-50 hover:bg-sky-100 text-[#034EA2] border border-sky-200',
      fondoCargando: 'bg-sky-100 text-[#034EA2] border border-sky-300',
      barraLlenado: 'bg-gradient-to-r from-sky-200 via-sky-300 to-sky-400/80',
      insigniaPorcentaje: 'bg-white/80 text-[#034EA2] border border-sky-300',
    },
  }[variante];

  return (
    <button
      type={type}
      disabled={disabled || cargando}
      onClick={onClick}
      title={title}
      aria-busy={cargando}
      className={`relative overflow-hidden select-none transition-all cursor-pointer disabled:cursor-wait ${
        cargando ? estilosVariante.fondoCargando : estilosVariante.inactivo
      } ${className}`}
    >
      {/* Capa de animación de llenado del color del botón */}
      {cargando && (
        <span
          aria-hidden="true"
          className={`
            pointer-events-none absolute inset-y-0 left-0 transition-all duration-300 ease-out
            ${estilosVariante.barraLlenado}
          `}
          style={{ width: `${Math.max(8, Math.round(porcentaje))}%` }}
        />
      )}

      {/* Contenido frontal: icono + texto de acción + porcentaje */}
      <span className="relative z-10 inline-flex items-center justify-center gap-2 w-full">
        {cargando ? (
          <>
            {iconoCargando || (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
            )}
            <span className="truncate font-bold">{etapaActual.textoAccion}</span>
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-mono-tabular font-extrabold shrink-0 ${estilosVariante.insigniaPorcentaje}`}
            >
              {Math.round(porcentaje)}%
            </span>
          </>
        ) : (
          <>
            {icono}
            <span>{children}</span>
          </>
        )}
      </span>
    </button>
  );
};
