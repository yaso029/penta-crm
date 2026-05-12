import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage';
import Landing from './pages/Landing';
import Layout from './components/Layout';
import PartnershipsLayout from './components/PartnershipsLayout';
import AgentsLayout from './components/AgentsLayout';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import UsersPage from './pages/UsersPage';
import CustomersPage from './pages/CustomersPage';
import PartnershipsDashboard from './pages/partnerships/Dashboard';
import Partners from './pages/partnerships/Partners';
import Outreach from './pages/partnerships/Outreach';
import Templates from './pages/partnerships/Templates';
import Replies from './pages/partnerships/Replies';
import Commissions from './pages/partnerships/Commissions';
import AgentsDashboard from './pages/agents/Dashboard';
import ClientReports from './pages/agents/ClientReports';
import PropertyVault from './pages/agents/PropertyVault';
import PropertyDetail from './pages/agents/PropertyDetail';
import ListProperty from './pages/agents/ListProperty';
import Events from './pages/agents/Events';
import Videos from './pages/agents/Videos';
import Promotions from './pages/agents/Promotions';
import AIModelLayout from './components/AIModelLayout';
import AIDashboard from './pages/aimodel/Dashboard';
import OffPlanListings from './pages/aimodel/OffPlanListings';
import SecondaryListings from './pages/aimodel/SecondaryListings';
import ClientMatcher from './pages/aimodel/ClientMatcher';
import IntakeAI from './pages/aimodel/IntakeAI';
import ScrapeControl from './pages/aimodel/ScrapeControl';
import PublicIntakePage from './pages/PublicIntakePage';
import HRLayout from './components/HRLayout';
import Employees from './pages/hr/Employees';
import PublicReferralPage from './pages/PublicReferralPage';
import ReferralPartners from './pages/agents/ReferralPartners';
import ReferralApplications from './pages/partnerships/ReferralApplications';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public — no auth required */}
      <Route path="/intake" element={<PublicIntakePage />} />
      <Route path="/referral" element={<PublicReferralPage />} />

      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Landing — module selector */}
      <Route path="/" element={<PrivateRoute><Landing /></PrivateRoute>} />

      {/* CRM module */}
      <Route path="/crm" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="leads/:id" element={<LeadDetailPage />} />
        <Route path="client-reports" element={<ClientReports />} />
        <Route path="referral-partners" element={<ReferralPartners />} />
        <Route path="users" element={
          <PrivateRoute roles={['admin']}>
            <UsersPage />
          </PrivateRoute>
        } />
        <Route path="customers" element={
          <PrivateRoute roles={['admin']}>
            <CustomersPage />
          </PrivateRoute>
        } />
      </Route>

      {/* Partnerships module — admin only */}
      <Route path="/partnerships" element={
        <PrivateRoute roles={['admin']}>
          <PartnershipsLayout />
        </PrivateRoute>
      }>
        <Route index element={<PartnershipsDashboard />} />
        <Route path="referral-applications" element={<ReferralApplications />} />
        <Route path="partners" element={<Partners />} />
        <Route path="outreach" element={<Outreach />} />
        <Route path="templates" element={<Templates />} />
        <Route path="replies" element={<Replies />} />
        <Route path="commissions" element={<Commissions />} />
      </Route>

      {/* Agents Dashboard module */}
      <Route path="/agents" element={<PrivateRoute><AgentsLayout /></PrivateRoute>}>
        <Route index element={<AgentsDashboard />} />
        <Route path="properties" element={<PropertyVault />} />
        <Route path="properties/:id" element={<PropertyDetail />} />
        <Route path="list-property" element={<ListProperty />} />
        <Route path="events" element={<Events />} />
        <Route path="videos" element={<Videos />} />
        <Route path="promotions" element={<Promotions />} />
        <Route path="client-reports" element={<ClientReports />} />
        <Route path="referral-partners" element={<ReferralPartners />} />
      </Route>

      {/* AI Model module — admin only */}
      <Route path="/ai" element={
        <PrivateRoute roles={['admin']}>
          <AIModelLayout />
        </PrivateRoute>
      }>
        <Route index element={<AIDashboard />} />
        <Route path="offplan" element={<OffPlanListings />} />
        <Route path="secondary" element={<SecondaryListings />} />
        <Route path="match" element={<ClientMatcher />} />
        <Route path="intake" element={<IntakeAI />} />
        <Route path="scrape" element={<ScrapeControl />} />
      </Route>

      {/* HR module — admin + hr_admin */}
      <Route path="/hr" element={
        <PrivateRoute roles={['admin', 'hr_admin']}>
          <HRLayout />
        </PrivateRoute>
      }>
        <Route index element={<Employees />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
