import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, WifiOff } from 'lucide-react';

/**
 * Registra el Service Worker institucional para garantizar que el boletín actual
 * y sus recursos queden almacenados en caché del navegador (estrategia Network-First).
 */
export function registrarServiceWorkerNotiProfes(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw-notiprofes.js', { scope: '/' })
      .then((reg) => {
        // Precargar en segundo plano la ruta pública del boletín actual
        fetch('/api/public/boletin/actual').catch(() => {});
        fetch('/api/public/boletines').catch(() => {});
        return reg;
      })
      .catch(() => {
        // Silencioso en entornos que restringen SW dentro de iframes cruzados
      });
  });
}

export function useOnlineStatus(onReconexion?: () => void) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [mostrarAvisoReconectado, setMostrarAvisoReconectado] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMostrarAvisoReconectado(true);
      if (onReconexion) {
        onReconexion();
      }
      setTimeout(() => {
        setMostrarAvisoReconectado(false);
      }, 4500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setMostrarAvisoReconectado(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onReconexion]);

  return { isOnline, mostrarAvisoReconectado };
}

interface BannerEstadoConexionProps {
  isOnline: boolean;
  mostrarAvisoReconectado: boolean;
  numeroBoletin: number;
  ultimaActualizacionTexto?: string;
  onReintentarSincronizacion?: () => void;
}

export const BannerEstadoConexion: React.FC<BannerEstadoConexionProps> = ({
  isOnline,
  mostrarAvisoReconectado,
  numeroBoletin,
  ultimaActualizacionTexto,
  onReintentarSincronizacion,
}) => {
  if (isOnline && !mostrarAvisoReconectado) {
    return null;
  }

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-amber-500 text-slate-950 border-b border-amber-600/40 px-4 py-2 text-xs font-semibold shadow-sm no-print"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-950/15 text-slate-950 shrink-0">
              <WifiOff className="w-3.5 h-3.5" />
            </span>
            <span>
              <strong>Modo sin conexión activo:</strong> Estás consultando la copia guardada en caché del{' '}
              <strong>Boletín N° {numeroBoletin}</strong>
              {ultimaActualizacionTexto ? ` (guardado: ${ultimaActualizacionTexto})` : ''}. Puedes leer toda la programación básica sin red; se sincronizará automáticamente al recuperar la conexión.
            </span>
          </div>
          {onReintentarSincronizacion && (
            <button
              type="button"
              onClick={onReintentarSincronizacion}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/15 hover:bg-slate-950/25 text-slate-950 text-[11px] font-bold transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Comprobar red</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold shadow-sm no-print animate-in fade-in duration-200"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
        <span>
          Conexión restablecida · El Boletín N° {numeroBoletin} se ha sincronizado con el servidor.
        </span>
      </div>
    </div>
  );
};
