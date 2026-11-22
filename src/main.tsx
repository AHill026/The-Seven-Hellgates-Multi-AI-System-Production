import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const isAzraelViewerRoute =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/dev/azrael-viewer');

if (isAzraelViewerRoute) {
  const LazyAzraelViewer = React.lazy(() => import('./dev/AzraelViewerSandbox.tsx'));
  createRoot(document.getElementById('root')!).render(
    <Suspense
      fallback={
        <div className="w-screen h-screen bg-[#050508] flex items-center justify-center text-xs font-mono text-slate-400">
          Initializing Azrael Runtime Sandbox...
        </div>
      }
    >
      <LazyAzraelViewer />
    </Suspense>
  );
} else {
  createRoot(document.getElementById('root')!).render(<App />);
}

