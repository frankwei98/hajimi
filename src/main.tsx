import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function MaybeConvexProvider({ children }: { children: ReactNode }) {
  return convex ? <ConvexProvider client={convex}>{children}</ConvexProvider> : <>{children}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MaybeConvexProvider>
      <App />
    </MaybeConvexProvider>
  </StrictMode>,
)
