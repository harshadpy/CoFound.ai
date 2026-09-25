import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';
import { ToastProvider } from './components/ui';

// Pages
import Home from './pages/Home';
import ActiveAnalysis from './pages/ActiveAnalysis';
import Report from './pages/Report';
import TrendExplorer from './pages/TrendExplorer';
import CompetitorResearch from './pages/CompetitorResearch';
import MarketGaps from './pages/MarketGaps';
import IdeaBrainstorming from './pages/IdeaBrainstorming';
import SavedInsights from './pages/SavedInsights';
import Ideas from './pages/Ideas';
import AnalysisHistory from './pages/AnalysisHistory';
import SharedReport from './pages/SharedReport';

// Global Modals & Drawers
import SettingsModal from './components/layout/SettingsModal';
import AuthModal from './components/layout/AuthModal';
import CopilotDrawer from './components/layout/CopilotDrawer';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/active-analysis" element={<ActiveAnalysis />} />
            <Route path="/analysis/:id" element={<ActiveAnalysis />} />
            <Route path="/report" element={<Report />} />
            <Route path="/share/:token" element={<SharedReport />} />
            <Route path="/history" element={<AnalysisHistory />} />
            <Route path="/trends" element={<TrendExplorer />} />
            <Route path="/competitors" element={<CompetitorResearch />} />
            <Route path="/market-gaps" element={<MarketGaps />} />
            <Route path="/brainstorming" element={<IdeaBrainstorming />} />
            <Route path="/brainstorm" element={<IdeaBrainstorming />} />
            <Route path="/saved" element={<SavedInsights />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        {/* Global Modals */}
        <SettingsModal />
        <AuthModal />
        <CopilotDrawer />
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
