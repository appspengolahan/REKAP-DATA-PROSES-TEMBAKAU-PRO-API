import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Cek pembaruan SW otomatis saat aplikasi PWA dibuka kembali di HP/tablet
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          registration.update().catch(() => {});
        }
      });
    },
    onNeedRefresh() {
      updateSW(true).catch(() => {});
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
