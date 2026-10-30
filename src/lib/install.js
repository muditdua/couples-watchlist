import { useEffect, useState } from 'react';

// Chrome, Edge and Android offer an install prompt once; keep it so Settings can trigger it later
let deferred = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify(); });
window.addEventListener('appinstalled', () => { deferred = null; notify(); });

const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function useInstall() {
  const [, tick] = useState(0);
  useEffect(() => {
    const fn = () => tick((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  return {
    installed: standalone(),
    canPrompt: Boolean(deferred),
    isIOS: /iphone|ipad|ipod/i.test(navigator.userAgent),
    install: async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      notify();
    },
  };
}
