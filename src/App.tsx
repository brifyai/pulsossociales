import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

/**
 * App - Main entry point for Pulso Social (formerly AI Town)
 * 
 * Architecture:
 * - React Router handles navigation with real URLs
 * - Routes defined in src/routes/index.tsx with AppLayout
 * - Store syncs with URL for state persistence
 * 
 * Layout (in AppLayout):
 * - Header: Breadcrumbs + Layer switcher
 * - Main: Route content via Outlet
 * - Footer: Original AI Town controls (hidden on country view)
 * - Modal: Help dialog
 * - ToastContainer: Notifications
 * 
 * 3-Level Navigation (handled by React Router):
 * 1. Country (/): ChileMapView - Map of Chile with clickable regions
 * 2. Region (/region/:regionId): RegionSceneView - AI Town world for selected region
 * 3. Agent (/region/:regionId/agent/:agentId): AgentInspectorPanel - Overlay panel on top of region view
 */
export default function App() {
  return (
    <div className="relative min-h-screen font-body game-background overflow-hidden">
      <RouterProvider router={router} />
    </div>
  );
}
