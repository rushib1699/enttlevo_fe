import { Route, Routes } from "react-router-dom";
import Login from "./pages/Auth/Login";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import Settings from "./pages/Settings/ProfilePage";
import ProtectedRoute from "./components/ProtectedRoute";
import AllSalesLeadsPage from "./pages/SalesModules/AllLeads/AllSalesLeadsPage";
import SuperAdminSalesDashboard from "./pages/SalesModules/Dashboard/SuperAdminSalesDashboard";
import CompanyPage from "./pages/Settings/CompanyPage/CompanyPage";
import UserRoleManagement from "./pages/Settings/UserRoleManagement/UserRoleManagement";
import NotificationPage from "./pages/Notification/NotificationPage";
import EmailPage from "./pages/EmailPage/EmailPage";
import EmailCampaignsPage from "./pages/Integrations/Campaign/EmailCampaignsPage";
import WorkflowsPage from "./pages/Workflows/WorkflowsPage";
import DataRulesPage from "./pages/Settings/DataRules/DataRulesPage";
import ResetPassword from "./pages/Auth/ResetPassword";
import NotFound from "./pages/NotFound";

//Sales
import SalesDeatilsPage from "./pages/SalesModules/SalesDetails/SalesDeatilsPage";
import DealsPage from "./pages/SalesModules/DealsPage/DealsPage";
import TasksPage from "./pages/SalesModules/TasksPage/SalesTasksPage";
import SchedulingPage from "./pages/Scheduling/SchedulingPage";

//OB
import OBReportsPage from "./pages/OBModules/Reports/OBReportsPage";
import AllOBAccountsPage from "./pages/OBModules/AllAccounts/AllOBAccountsPage";
import SuperAdminOBDashboard from "./pages/OBModules/Dashboard/SuperAdminOBDashboard";
import OBAccountDetailsPage from "./pages/OBModules/AccountDetails/OBAccountDetailsPage";

//AM
import SuperAdminAMDashboard from "./pages/AMModules/Dashboard/SuperAdminAMDashboard";
import AllAMAccountsPage from "./pages/AMModules/AllAccounts/AllAMAccountsPage";
import AMAccountDetailsPage from "./pages/AMModules/AccountDetails/AMAccountDetailsPage";
import AMPaymentsPage from "./pages/AMModules/AMPayments/AMPaymentsPage";
import AMReportsPage from "./pages/AMModules/Reports/AMReportsPage";
import EstimatesPage from "./pages/AMModules/AMPayments/Estimates/EstimatesPage";
import InvoicesPage from "./pages/AMModules/AMPayments/Inovices/InovicesPage";

//Settings
import IntegrationLibraryPage from "./pages/Settings/Integrations/IntegrationLibraryPage";
import CallHippoPage from "./pages/Integrations/CallHippo/CallHippoPage";
import AudioTranscriptPage from "./pages/Integrations/AudioTranscript/AudioTranscriptPage";

//Integrations
import WorkflowsLibraryPage from "./pages/Integrations/WorkflowsLibrary/WorkflowsLibraryPage";
import CreateWorkFlowPage from "./pages/Workflows/CreateWorkFlowPage";

//Email Builder
import EmailBuilderPage from "./pages/EmailBuilder/EmailBuilderPage";

const AppRouter = () => {
    return (
        <>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path={"/"} element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>                    
                    {/* Sales Routes */}
                    <Route path="sales">
                        <Route path="" element={<SuperAdminSalesDashboard />} />
                        <Route path="leads" element={<AllSalesLeadsPage />} />
                        <Route path="deals" element={<DealsPage />} />
                        <Route path="account/:id" element={<SalesDeatilsPage />} />
                        <Route path="tasks" element={<TasksPage />} />
                        <Route path="scheduling" element={<SchedulingPage />} />
                    </Route>

                    {/* Onboarding Routes */}
                    <Route path="onboarding">
                        <Route path="" element={<SuperAdminOBDashboard />} />
                        <Route path="accounts" element={<AllOBAccountsPage />} />
                        <Route path="account/:id" element={<OBAccountDetailsPage />} />
                        <Route path="tasks" element={<TasksPage />} />
                        <Route path="reports" element={<OBReportsPage />} />
                        <Route path="scheduling" element={<SchedulingPage />} />
                    </Route>

                    {/* Account Management Routes */}
                    <Route path="account-management">
                        <Route path="" element={<SuperAdminAMDashboard />} />
                        <Route path="accounts" element={<AllAMAccountsPage />} />
                        <Route path="account/:id" element={<AMAccountDetailsPage />} />
                        <Route path="payments" element={<AMPaymentsPage />} />
                        <Route path="tasks" element={<TasksPage />} />
                        <Route path="reports" element={<AMReportsPage />} />
                        <Route path="scheduling" element={<SchedulingPage />} />
                    </Route>

                    {/* Notification Routes */}
                    <Route path="notification" element={<NotificationPage />} />

                    {/* Email Routes */}
                    <Route path="email" element={<EmailPage />} />

                    {/* Settings Routes */}
                    <Route path="settings">
                        <Route path="profile" element={<Settings />} />
                        <Route path="company" element={<CompanyPage />} />
                        <Route path="integration-library" element={<IntegrationLibraryPage />} />
                        <Route path="role-management" element={<UserRoleManagement />} />
                        <Route path="data-rules" element={<DataRulesPage />} />
                    </Route>

                    {/* Integrations Routes */}
                    <Route path="integrations">
                        <Route path="email-campaigns" element={<EmailCampaignsPage />} />
                        <Route path="workflow-library" element={<WorkflowsLibraryPage />} />
                        <Route path="workflows" element={<WorkflowsPage />} />
                        <Route path="workflows/:workflowName" element={<CreateWorkFlowPage />} />
                        <Route path="email-builder" element={<EmailBuilderPage />} />
                        {/* <Route path="workflows/edit/:workflowName" element={<CreateWorkFlowPage />} /> */}
                        <Route path="call-hippo" element={<CallHippoPage />} />
                        <Route path="audio-transcription" element={<AudioTranscriptPage />} />
                    </Route>
                        
                </Route>
                
                {/* 404 Not Found Route - Must be last */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    )
}

export default AppRouter