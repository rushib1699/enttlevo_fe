export interface LoginResponse {
  isLoggedIn: boolean;
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  team_id: number;
  token: string;
  role_id: number;
  company_id: number;
  google_email: string;
  zoho_email: string;
  custom_email: string;
  currentTime: number;
  expirationTime: number;
}

export interface LogoutResponse {
  isLoggedIn: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LogoutRequest {
  userId: number;
  username: string;
  time: string;
  loginTimeStamp: string;
  logOutTimeStamp: string;
}

export interface ForgotPasswordFormData {
  user_id: number;
  email: string;
  old_password: string;
  new_password: string;
}

export type ModulePermissions = {
  module_id: number;
  permissions: "read" | "write" | "read_write" | undefined;
};

export type UserPermissionsObject = {
  account_management?: ModulePermissions;
  onboarding?: ModulePermissions;
  sales?: ModulePermissions;
};

export interface DashboardData {
  onboarding_revenue: number;
  customers: number;
  mrr?: number;
  arr?: number;
  bugs?: number;
}

export type UserList = UserData[];
export type Permission = "read" | "write" | "read-write";
export type UserPermissions = Record<
  string,
  { user_id: number; module_id: number; permissions: string }
>;

export interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  contact: number;
  role: string;
  name: string;
  company_count: number;
  mrr: number;
  resolvedIssues: number;
  unresolvedIssues: number;
  permission: UserPermissions;
}

export type TimezoneType = {
  id: number;
  name: string;
  code: string;
  offset: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  isDeleted: boolean;
  createdBy: number;
  updatedBy: number;
};

export type ContractType = {
  id: number;
  contract_type_name: string;
  contract_days: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: number;
  updated_by: number;
};

export type AccountStatusType = {
  id: number;
  status_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: number;
  updated_by: number;
};

export type getLeadStatusList = {
  id: number;
  status: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: number;
  updated_by: number;
};

export type getLeadLableList = {
  id: number;
  label: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: number;
  updated_by: number;
};

export type getContractStagesList = {
  id: number;
  stage: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_deleted: boolean;
  created_by: number;
  updated_by: number;
};

export interface Company {
  mrr: number;
  name: string;
  id: number;
  resolvedIssues: number;
  unresolvedIssues: number;
}

export type LeadsList = LeadsData[];

export interface LeadsData {
  account_owner_id: number;
  account_owner: string;
  is_icp: any;
  is_icp_id: number;
  is_unassigned: any;
  is_unassigned_id: number;
  account_status_type_id: number;
  account_status_id: number;
  lead_source_id: number;
  contract_stage_id: number;
  funnel_stage_id: number;
  label_id: number;
  status_id: number;
  account_status_type: string;
  account_status: string;
  lead_source: string;
  contract_arr: number;
  proposed_arr: number;
  id: number;
  account_name: string;
  contact_name: string;
  linkedin: string;
  email: string;
  website: string;
  industry: string;
  product_name: string;
  contract_stage: string;
  funnel_stage: string;
  created_by: string;
  updated_by: string;
  status: string;
  label: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  sent_to_ob: number;
}

export type DealsList = DealsData[];

export interface DealsData {
  id: number;
  account_name: string;
  lead_owner: string;
  address:string;
  city:string;
  state:string;
  country:string;
  account_status_type_id:number;
  contract_type_id:number;
  contract_stage_id:number;
  funnel_stage_id:number;
  label_id:number;
  status_id:number;
  lead_id:number;
  contract_value:number;
  contract_duration:number;
  timezone_id:number;
  proposed_arr:number;
  contact_name: string;
  linkedin: string;
  email: string;
  website: string;
  industry: string;
  product_name: string;
  mib: number;
  contract_stage: string;
  funnel_stage: string;
  created_by: string;
  updated_by: string;
  status: string;
  label: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
}

export type SalesDashboardData = {
  total_leads: LeadData[];
  total_leads_OC: LeadOCData[];
  total_leads_industry: LeadIndustryData[];
  total_mib_date: MibData[];
};

export type LeadData = {
  total_hot: number;
  total_warm: number;
  total_cold: number;
};

export type LeadOCData = {
  month: string;
  open_leads: number;
  closed_leads: number;
};

export type LeadIndustryData = {
  industry: string;
  total_leads: number;
};

export type MibData = {
  total_mib: number;
  total_deals: number;
};

export type industryDetailsList = industryDetails[];
export interface industryDetails {
  id: number;
  industry: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  created_by: number;
  updated_by: number;
}

export interface LeadDetails {
  company_id: number;
  account_name: string;
  contact_name: string;
  linkedin: string;
  email: string;
  website: string;
  contact_number: string;
  industry_id: number;
  product_name: string;
  user_id: number;
}

export type SalesDashboardTableList = SalesDashboardTableData[];
export interface SalesDashboardTableData {
  id: number;
  mib: number;
  account_name: string;
  contact_name: string;
  linkedin: string;
  email: string;
  website: string;
  industry: string;
  product_name: string;
  contract_stage: string;
  contract_value: number;
  funnel_stage: string;
  created_by: string;
  updated_by: string;
  status: string;
  label: string;
  created_at: string;
  updated_at: string;
}

export type notesList = notes[];
export interface notes {
  created_by: string;
  id: number;
  note: string;
  created_at: string; // Consider using Date if you want to handle date objects
}

export interface onboardingNotes {
  note: string;
  user_id: number;
  company_id: number;
}

export type activityList = activity[];
export interface activity {
  created_by: string;
  id: number;
  date: string;
  time: string;
  activity: string;
  created_at: string;
  is_complete: boolean;
}

export interface CompaniesListType {
  id: number;
  name: string;
  support_email: string;
  live_date: string | null;
  handoff_date: string | null;
  transfer_date: string | null;
  contract_start_date: string | null;
  contract_close_date: string | null;
  balance: number;
  contract_value: number;
  arr: number;
  contract_duration: number;
  mrr: number;
  am: string;
  om: string;
  status: string;
  contract_type: string;
  previous_platform: string;
  timezone: string;
  accounting_software: string;
  phases: {
    id: number;
    phase: string;
    status: string;
    company_name: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
  }[];
}

export type CompanyList = CompaniesListType[];

export type CompanyDetails = {
  id: number;
  name: string;
  support_email: string;
  address: string | null;
  website: string | null;
  live_date: string | null;
  handoff_date: string | null;
  transfer_date: string | null;
  linkedin: string | null;
  contract_start_date: string | null;
  contract_close_date: string | null;
  balance: number;
  contract_value: number;
  arr: number;
  contract_duration: number;
  mrr: number;
  am: string;
  om: string;
  status: string;
  contract_type: string;
  previous_platform: string;
  timezone: string;
  accounting_software: string;
  contacts: ContactDetails[];
};

export type ContactDetails = {
  id: number;
  poc_name: string;
  poc_contact: string;
  poc_email: string;
  poc_linkedin: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  created_by: number;
  updated_by: number;
};

export type Step = {
  id: number;
  step: string;
  status: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};
export interface Phases {
  id: number;
  phase: string;
  status: string;
  company_name: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  steps: Step[];
}

export type PhasesList = Phases[];

export type DocumentList = {
  id: number;
  url: string;
  doc_name: string;
  company_id: number;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  created_by: number;
  updated_by: number;
}[];

export type getUserRoleList = {
  id: number;
  role: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
};

export interface PhaseWiseRevenue {
  phase: string;
  total_arr: number;
  total_mrr: number;
}

export interface getTimeToOnboardTypes {
  ob_manager: string;
  onboarding_manager: number;
  average_days_to_transfer: number;
}

export interface CalendarEvent {
  kind: string;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  creator: {
    email: string;
    self: boolean;
  };
  organizer: {
    email: string;
    self: boolean;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  iCalUID: string;
  sequence: number;
  reminders: {
    useDefault: boolean;
  };
  eventType: string;
}

export interface CalendarEventDetails {
  summary: string;
  location: string;
  description: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  recurrence?: string[];
  attendees?: Array<{ email: string }>;
}

export interface CreateCalendarEventBody {
  user_email: string;
  eventDetails: CalendarEventDetails;
}

export interface CustomSankeyNode {
  id: string;
  nodeColor: string;
}

export interface CustomSankeyLink {
  source: string;
  target: string;
  value: number;
  name?: string;
  mrr?: string;
}

export interface RenewalData {
  srNo: number;
  accountName: string;
  contractStartDate: string;
  contractValue: string;
}

export interface MonthlyCollectionData {
  srNo: number;
  accountName: string;
  paymentFailed: string;
  dueDate: string;
}

export interface Group {
  key: number;
  id: number;
  name: string;
}

export interface Campaign {
  key: number;
  campaign_id: number;
  campaign_name: string;
  type: string;
}

export interface Subscriber {
  key: number;
  id: number;
  email: string;
  groups: Array<{ id: number; name: string }>;
}

export interface CompanyContact {
  poc_email: string;
  poc_name: string;
  poc_linkedin: string;
}

export interface Company {
  company_id: number;
  company_name: string;
  company_email: string;
  company_contacts: CompanyContact[];
}

// ... existing code ...

export interface Account {
  id: number;
  name: string;
  support_email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  obm_id: number;
  website: string | null;
  linkedin: string | null;
  live_date: string | null;
  handoff_date: string | null;
  transfer_date: string | null;
  contract_start_date: string | null;
  contract_close_date: string | null;
  balance: number;
  contract_value: number;
  arr: number;
  contract_duration: number;
  mrr: number;
  am: string;
  is_unassigned: number;
  om: string;
  status: string;
  contract_type: string;
  previous_platform: string;
  timezone: string;
  accounting_software: string;
}

export type AccountsList = Account[];

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
}
export interface NodeData {
  id?: number;
  sort?: number;
  title?: string;
  input?: string;
  prompt?: string;
  background_prompt?: string;
  onNodeTypeChange?: (id: string, newType: string) => void;
  onNodeClickCallback?: (id: string, data: NodeData) => void;
  onDeleteNodeCallback?: (id: number, uuid: string) => void;
  onAddNodeCallback?: (
    parentNodeId: string,
    cur_elements: Element[],
    type: string
  ) => void;
}

export interface Node {
  id: string;
  type: string;
  data: NodeData;
  position: { x: number; y: number };
  style?: Record<string, any>;
}

export type Element = Node | Edge;

export type Prompt = {
  id: string;
  use_input: string;
  prompt: string;
  Input: string;
  Background_prompt: string;
};

export enum TypeoW {
  EMAIL = "email",
  GENERAL = "general",
}


export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactResponse {
  success: boolean;
  data: {
    contacts: Contact[];
    total: number;
  };
}

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  number: string;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}