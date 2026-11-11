import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {registrarServiceWorkerNotiProfes} from './components/EstadoConexionPWA.tsx';
import './index.css';

registrarServiceWorkerNotiProfes();

createRoot(document.getElementById('root')!).render(<App />);

