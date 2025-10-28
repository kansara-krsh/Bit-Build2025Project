import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import CampaignPage from './pages/CampaignPage';
import GeoDashboardPage from './pages/GeoDashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import WorkflowDetailPage from './pages/WorkflowDetailPage';
import CreateWorkflowPage from './pages/CreateWorkflowPage';
import WorkflowBuilderPage from './pages/WorkflowBuilderPage';

function App() {
  return (
    <Router>
      <div className="relative min-h-screen">
        {/* Main App */}
        <Routes>
          {/* Public Routes with Layout (Navbar) */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/about" element={<Layout><AboutPage /></Layout>} />
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
          
          {/* Campaign Generator */}
          <Route path="/campaign" element={<Layout><CampaignPage /></Layout>} />
          
          {/* Geo Dashboard */}
          <Route path="/geo-dashboard" element={<Layout><GeoDashboardPage /></Layout>} />
          
          {/* Workflow Builder - No Layout (full screen) */}
          <Route path="/workflow-builder" element={<WorkflowBuilderPage />} />
          
          {/* Marketplace */}
          <Route path="/marketplace" element={<Layout><MarketplacePage /></Layout>} />
          <Route path="/marketplace/create" element={<Layout><CreateWorkflowPage /></Layout>} />
          <Route path="/marketplace/:id" element={<Layout><WorkflowDetailPage /></Layout>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
