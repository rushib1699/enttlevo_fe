import { 
  Settings,
  DollarSign,
  User,
  Users,
  Building,
  Mic,
  CalendarDays,
  BookOpen,
  LayoutDashboard,
  Handshake,
  BarChart3,
  Mail,
  LineChart,
  ListTodo,
  Bell,
  SwitchCamera,
  Library,
  Phone,
  Blocks,
  Target,
  FileText
} from "lucide-react";

export const SIDE_BAR_ITEMS = [
  {
    title: "Sales",
    icon: Target ,
    rootPath: "/sales",
    module: "sales",
    subRoutes: [
      {
        name: "Dashboard",
        childIcon: LayoutDashboard,
        childPath: "/sales",
      },
      {
        name: "All Leads",
        childIcon: LineChart,
        childPath: "/sales/leads",
      },
      {
        name: "Deals",
        childIcon: BarChart3,
        childPath: "/sales/deals",
      },
      {
        name: "Tasks",
        childIcon: ListTodo,
        childPath: "/sales/tasks",
      },
      {
        name: "Scheduler",
        childIcon: CalendarDays,
        childPath: "/sales/scheduling",
      },
    ],
  },
  {
    title: "Onboarding",
    icon: Handshake,
    rootPath: "/onboarding",
    module: "onboarding",
    subRoutes: [
      {
        name: "Dashboard",
        childIcon: LayoutDashboard,
        childPath: "/onboarding",
      },
      {
        name: "All Accounts",
        childIcon: Users,
        childPath: "/onboarding/accounts",
      },
      {
        name: "Tasks",
        childIcon: ListTodo,
        childPath: "/onboarding/tasks",
      },
      {
        name: "Scheduler",
        childIcon: CalendarDays,
        childPath: "/onboarding/scheduling",
      },
      {
        name: "Reports",
        childIcon: BarChart3,
        childPath: "/onboarding/reports",
      },
    ],
  },
  {
    title: "AM",
    icon: Users ,
    rootPath: "/account-management",
    module: "account_management",
    subRoutes: [
      {
        name: "Dashboard",
        childIcon: LayoutDashboard,
        childPath: "/account-management",
      },
      {
        name: "All Accounts",
        childIcon: Users,
        childPath: "/account-management/accounts",
      },
      {
        name: "Scheduler",
        childIcon: CalendarDays,
        childPath: "/account-management/scheduling",
      },
      {
        name: "Payments",
        childIcon: DollarSign,
        childPath: "/account-management/payments",
      },
      {
        name: "Tasks",
        childIcon: ListTodo,
        childPath: "/account-management/tasks",
      },
      {
        name: "Reports",
        childIcon: BarChart3,
        childPath: "/account-management/reports",
      },
    ],
  },
  {
    title: "Email",
    icon: Mail,
    rootPath: "/email",
  },
  {
    title: "Notification",
    icon: Bell,
    rootPath: "/notification",
  },
  {
    title: "Settings",
    icon: Settings,
    rootPath: "/settings/profile",
    subRoutes: [
      {
        name: "Profile",
        childIcon: User,
        childPath: "/settings/profile",
      },
      {
        name: "Company",
        childIcon: Building,
        childPath: "/settings/company",
      },
      {
        name: "User Role Management",
        childIcon: Users,
        childPath: "/settings/role-management",
      },
      {
        name: "Data Rules",
        childIcon: BookOpen,
        childPath: "/settings/data-rules",
      },
      {
        name: "Integration Library",
        childIcon: Library,
        childPath: "/settings/integration-library",
      },
    ],
  },
  {
    title: "Integration",
    icon: Blocks ,
    rootPath: "/integrations/email",
    module:'integrations',
    subRoutes:[
      {
        name: "Campaign",
        childIcon: Mail,
        childPath: "/integrations/email-campaigns",
      },
      {
        name: "Workflows",
        childIcon: SwitchCamera,
        childPath: "/integrations/workflows",
      },
      {
        name: "Workflows Library",
        childIcon: Library,
        childPath: "/integrations/workflow-library",
      },
      {
        name: "Call Hippo",
        childIcon: Phone,
        childPath: "/integrations/call-hippo",
      },
      {
        name: "Audio Transcription",
        childIcon: Mic,
        childPath: "/integrations/audio-transcription",
      },
    ],
  },


];