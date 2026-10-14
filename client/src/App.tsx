import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { FinancialAnalysisPage } from './pages/FinancialAnalysisPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { RiskAssessmentPage } from './pages/RiskAssessmentPage';
import { VerifiedDecisionsPage } from './pages/VerifiedDecisionsPage';
import { VoiceAssistantPage } from './pages/VoiceAssistantPage';
import { AuditTrailPage } from './pages/AuditTrailPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="analysis" element={<FinancialAnalysisPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="risk" element={<RiskAssessmentPage />} />
          <Route path="decisions" element={<VerifiedDecisionsPage />} />
          <Route path="voice" element={<VoiceAssistantPage />} />
          <Route path="audit" element={<AuditTrailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
