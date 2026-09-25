import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';

// Pages
import Home from './pages/Home';
import ActiveAnalysis from './pages/ActiveAnalysis';
import Report from './pages/Report';
import TrendExplorer from './pages/TrendExplorer';
import CompetitorResearch from './pages/CompetitorResearch';
import MarketGaps from './pages/MarketGaps';
import IdeaBrainstorming from './pages/IdeaBrainstorming';
import SavedInsights from './pages/SavedInsights';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/active-analysis" element={<ActiveAnalysis />} />
          <Route path="/report" element={<Report />} />
          <Route path="/trends" element={<TrendExplorer />} />
          <Route path="/competitors" element={<CompetitorResearch />} />
          <Route path="/market-gaps" element={<MarketGaps />} />

          {/* Placeholders for others */}
          <Route path="/brainstorming" element={<IdeaBrainstorming />} />
          <Route path="/saved" element={<SavedInsights />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
