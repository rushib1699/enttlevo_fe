import { Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Eagerly load critical components
import Login from "./pages/Auth/Login";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load all other components
const Settings = lazy(() => import("./pages/Settings/ProfilePage"));
const AllSalesLeadsPage = lazy(() => import("./pages/SalesModules/AllLeads/AllSalesLeadsPage"));
const SuperAdminSalesDashboard = lazy(() => import("./pages/SalesModules/Dashboard/SuperAdminSalesDashboard"));
const CompanyPage = lazy(() => import("./pages/Settings/CompanyPage/CompanyPage"));
const UserRoleManagement = lazy(() => import("./pages/Settings/UserRoleManagement/UserRoleManagement"));
const NotificationPage = lazy(() => import("./pages/Notification/NotificationPage"));
const EmailPage = lazy(() => import("./pages/EmailPage/EmailPage"));
const EmailCampaignsPage = lazy(() => import("./pages/Integrations/Campaign/EmailCampaignsPage"));
const WorkflowsPage = lazy(() => import("./pages/Workflows/WorkflowsPage"));
const DataRulesPage = lazy(() => import("./pages/Settings/DataRules/DataRulesPage"));
const ResetPassword = lazy(() => import("./pages/Auth/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Sales
const SalesDeatilsPage = lazy(() => import("./pages/SalesModules/SalesDetails/SalesDeatilsPage"));
const DealsPage = lazy(() => import("./pages/SalesModules/DealsPage/DealsPage"));
const TasksPage = lazy(() => import("./pages/SalesModules/TasksPage/SalesTasksPage"));
const SchedulingPage = lazy(() => import("./pages/Scheduling/SchedulingPage"));

// OB
const OBReportsPage = lazy(() => import("./pages/OBModules/Reports/OBReportsPage"));
const AllOBAccountsPage = lazy(() => import("./pages/OBModules/AllAccounts/AllOBAccountsPage"));
const SuperAdminOBDashboard = lazy(() => import("./pages/OBModules/Dashboard/SuperAdminOBDashboard"));
const OBAccountDetailsPage = lazy(() => import("./pages/OBModules/AccountDetails/OBAccountDetailsPage"));

// AM
const SuperAdminAMDashboard = lazy(() => import("./pages/AMModules/Dashboard/SuperAdminAMDashboard"));
const AllAMAccountsPage = lazy(() => import("./pages/AMModules/AllAccounts/AllAMAccountsPage"));
const AMAccountDetailsPage = lazy(() => import("./pages/AMModules/AccountDetails/AMAccountDetailsPage"));
const AMPaymentsPage = lazy(() => import("./pages/AMModules/AMPayments/AMPaymentsPage"));
const AMReportsPage = lazy(() => import("./pages/AMModules/Reports/AMReportsPage"));

// Settings
const IntegrationLibraryPage = lazy(() => import("./pages/Settings/Integrations/IntegrationLibraryPage"));
const CallHippoPage = lazy(() => import("./pages/Integrations/CallHippo/CallHippoPage"));
const AudioTranscriptPage = lazy(() => import("./pages/Integrations/AudioTranscript/AudioTranscriptPage"));

// Integrations
const WorkflowsLibraryPage = lazy(() => import("./pages/Integrations/WorkflowsLibrary/WorkflowsLibraryPage"));
const CreateWorkFlowPage = lazy(() => import("./pages/Workflows/CreateWorkFlowPage"));

// Email Builder
const EmailBuilderPage = lazy(() => import("./pages/EmailBuilder/EmailBuilderPage"));

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
);

const AppRouter = () => {
    return (
        <>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/reset-password" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <ResetPassword />
                  </Suspense>
                } />
                <Route path={"/"} element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }>                    
                    {/* Sales Routes */}
                    <Route path="sales">
                        <Route path="" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <SuperAdminSalesDashboard />
                          </Suspense>
                        } />
                        <Route path="leads" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AllSalesLeadsPage />
                          </Suspense>
                        } />
                        <Route path="deals" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <DealsPage />
                          </Suspense>
                        } />
                        <Route path="account/:id" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <SalesDeatilsPage />
                          </Suspense>
                        } />
                        <Route path="tasks" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <TasksPage />
                          </Suspense>
                        } />
                        <Route path="scheduling" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <SchedulingPage />
                          </Suspense>
                        } />
                    </Route>

                    {/* Onboarding Routes */}
                    <Route path="onboarding">
                        <Route path="" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <SuperAdminOBDashboard />
                          </Suspense>
                        } />
                        <Route path="accounts" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AllOBAccountsPage />
                          </Suspense>
                        } />
                        <Route path="account/:id" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <OBAccountDetailsPage />
                          </Suspense>
                        } />
                        <Route path="tasks" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <TasksPage />
                          </Suspense>
                        } />
                        <Route path="reports" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <OBReportsPage />
                          </Suspense>
                        } />
                        <Route path="scheduling" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <SchedulingPage />
                          </Suspense>
                        } />
                    </Route>

                    {/* Account Management Routes */}
                    <Route path="account-management">
                        <Route path="" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <SuperAdminAMDashboard />
                          </Suspense>
                        } />
                        <Route path="accounts" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AllAMAccountsPage />
                          </Suspense>
                        } />
                        <Route path="account/:id" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AMAccountDetailsPage />
                          </Suspense>
                        } />
                        <Route path="payments" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AMPaymentsPage />
                          </Suspense>
                        } />
                        <Route path="tasks" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <TasksPage />
                          </Suspense>
                        } />
                        <Route path="reports" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AMReportsPage />
                          </Suspense>
                        } />
                        <Route path="scheduling" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <SchedulingPage />
                          </Suspense>
                        } />
                    </Route>

                    {/* Notification Routes */}
                    <Route path="notification" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <NotificationPage />
                      </Suspense>
                    } />

                    {/* Email Routes */}
                    <Route path="email" element={
                      <Suspense fallback={<LoadingSpinner />}>
                        <EmailPage />
                      </Suspense>
                    } />

                    {/* Settings Routes */}
                    <Route path="settings">
                        <Route path="profile" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <Settings />
                          </Suspense>
                        } />
                        <Route path="company" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <CompanyPage />
                          </Suspense>
                        } />
                        <Route path="integration-library" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <IntegrationLibraryPage />
                          </Suspense>
                        } />
                        <Route path="role-management" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <UserRoleManagement />
                          </Suspense>
                        } />
                        <Route path="data-rules" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <DataRulesPage />
                          </Suspense>
                        } />
                    </Route>

                    {/* Integrations Routes */}
                    <Route path="integrations">
                        <Route path="email-campaigns" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmailCampaignsPage />
                          </Suspense>
                        } />
                        <Route path="workflow-library" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <WorkflowsLibraryPage />
                          </Suspense>
                        } />
                        <Route path="workflows" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <WorkflowsPage />
                          </Suspense>
                        } />
                        <Route path="workflows/:workflowName" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <CreateWorkFlowPage />
                          </Suspense>
                        } />
                        <Route path="email-builder" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <EmailBuilderPage />
                          </Suspense>
                        } />
                        <Route path="call-hippo" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <CallHippoPage />
                          </Suspense>
                        } />
                        <Route path="audio-transcription" element={
                          <Suspense fallback={<LoadingSpinner />}>
                            <AudioTranscriptPage />
                          </Suspense>
                        } />
                    </Route>
                        
                </Route>
                
                {/* 404 Not Found Route - Must be last */}
                <Route path="*" element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <NotFound />
                  </Suspense>
                } />
            </Routes>
        </>
    )
}

export default AppRouter