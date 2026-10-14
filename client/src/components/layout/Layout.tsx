import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '../common/Toast';
import { PresentationModal } from '../common/PresentationModal';
import { resetDemoData } from '../../lib/api';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDemoLoad = async () => {
    await resetDemoData();
    handleRefresh();
  };

  return (
    <ToastProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-[#F7F4EE]">
        {/* Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
          onOpenTour={() => setIsTourOpen(true)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header
            onRefreshData={handleRefresh}
            onOpenTour={() => setIsTourOpen(true)}
          />

          <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F7F4EE]">
            <div className="max-w-7xl mx-auto">
              <Outlet context={{ refreshTrigger, onRefresh: handleRefresh }} />
            </div>
          </main>
        </div>

        {/* 12-Step Presentation Modal */}
        <PresentationModal
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          onTriggerDemoLoad={handleDemoLoad}
        />
      </div>
    </ToastProvider>
  );
};
