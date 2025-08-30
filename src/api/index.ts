import axios, { AxiosResponse } from "axios";
import {
  DashboardData,
  ForgotPasswordFormData,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  LogoutResponse,
  UserList,
  LeadsList,
  DealsList,
  SalesDashboardData,
  industryDetailsList,
  LeadDetails,
  LeadsData,
  SalesDashboardTableList,
  notesList,
  notes,
  activity,
  activityList,
  CompanyList,
  CompanyDetails,
  PhasesList,
  DocumentList,
  UserPermissions,
  getContractStagesList,
  getLeadLableList,
  getLeadStatusList,
  PhaseWiseRevenue,
  RenewalData,
  MonthlyCollectionData,
  AccountsList,
  TypeoW,
} from "../types";
import { SessionUtils } from "@/context/ApplicationContext";
import { jwtDecode } from "jwt-decode";

//export const BASE_URL = "https://api.enttlevo.online";
//export const BASE_URL = 'http://localhost:3002';
export const BASE_URL = 'https://dev-api.enttlevo.online';

// Define the token structure
interface DecodedToken {
  exp: number;
  iat: number;
  result: Array<{
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    team_id: number;
    role_id: number;
    company_id: number;
    password_hashed: string;
    google_email: string;
  }>;
}
//export const BASE_URL = 'http://localhost:3002';
// export const BASE_URL = 'https://dev-api.enttlevo.online';


export const API_CLIENT = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Request interceptor - checks token before each request
API_CLIENT.interceptors.request.use(
  function (config) {
    const token = SessionUtils.getSession()?.token ?? "";
    
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds

        // Check if token is expired
        if (decodedToken.exp < currentTime) {
          // Token is expired, logout user
          SessionUtils.removeSession();
          window.location.href = "/";
          return Promise.reject("Token expired");
        }
      } catch (error) {
        console.error("Error decoding token:", error);
        // Invalid token, logout user
        SessionUtils.removeSession();
        window.location.href = "/";
        return Promise.reject("Invalid token");
      }
    }

    // Set authorization header with bearer token
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// Response interceptor - handles 401 errors
API_CLIENT.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Clear session and redirect to login
      SessionUtils.removeSession();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export const login = async (
  payload: LoginRequest
): Promise<LoginResponse | string> => {
  const response = await API_CLIENT.post<
    LoginRequest,
    AxiosResponse<LoginResponse>
  >("/login", payload);
  return response.data;
};

export const logout = async (payload: LogoutRequest) => {
  const response = await API_CLIENT.post<
    LogoutRequest,
    AxiosResponse<LogoutResponse>
  >("/logout", payload);
  return response.data;
};

export const forgotPassword = async (payload: {
  uid: number;
  token: string;
  new_password: string;
}) => {
  const response = await API_CLIENT.post<{
    uid: number;
    token: string;
    new_password: string;
  }>(
    "/public-api/resetPassword",
    payload
  );
  return response.data;
};

export const requestResetPassword = async (payload: {
  email: string;
}) => {
  const response = await API_CLIENT.post<{
    email: string;
  }>(
    "/public-api/requestPasswordReset",
    payload
  );
  return response.data;
};


export const getDashboardData = async (params: {
  role_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get<DashboardData>("/users/dashboard", {
    params,
  });

  return response.data;
};

export const getUsers = async (params: {
  role_id: number;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get<UserList>("/users/fetchUserList", {
    params,
  });

  return response.data;
};

export const addUserPermissions = async (payload: {
  user_id: number;
  module_id: number;
  permission_id: number;
}) => {
  const response = await API_CLIENT.post<UserPermissions>(
    "/users/addPermission",
    payload
  );
  return response.data;
};

export const getLeads = async (params: object, company_id: number) => {
  const response = await API_CLIENT.post<LeadsList>("/sales/getLeads", {
    filters: params,
    company_id: company_id,
  });
  return response.data;
};

export const getDeals = async (params: object, company_id: number) => {
  const response = await API_CLIENT.post<DealsList>("/sales/getDeals", {
    filters: params,
    company_id: company_id,
  });
  return response.data;
};

export const salesDashboard = async (params: {
  start_date: string;
  end_date: string;
  company_id: number;
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.get<SalesDashboardData>(
    "/sales/leadsDashboard",
    {
      params,
    }
  );

  return response.data;
};

export const getIndustries = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<industryDetailsList>(
    "/sales/getIndustry",
    { params }
  );

  return response.data;
};

export const createLead = async (payload: {
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post<LeadDetails>(
    "/sales/createCustomer",
    payload
  );
  return response;
};

export const getLeadDetails = async (params: { id: number }) => {
  const response = await API_CLIENT.get<LeadsData>("/sales/getLeadsDetails", {
    params,
  });
  return response.data;
};

export const getSalesDashboardTableData = async (params: {
  company_id: number;
}) => {
  const response = await API_CLIENT.get<SalesDashboardTableList>(
    "/sales/getSalesDashboardTable",
    {
      params,
    }
  );

  return response.data;
};

export const getNotesByLeads = async (params: { leads_id: number }) => {
  const response = await API_CLIENT.get<notesList>("/notes/fetchNoteByLeadId", {
    params,
  });

  return response.data;
};

export const createNote = async (params: object) => {
  const response = await API_CLIENT.post<notes>("/notes/create", {
    params,
  });
  return response.data;
};

export const getNotesByCompanyId = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<notesList>("/notes/notesByCompanyId", {
    params,
  });

  return response.data;
};

export const createNoteByCompanyId = async (payload: object) => {
  const response = await API_CLIENT.post<notes>("/notes/addNotes", payload);

  return response.data;
};

export const getActivityByLeads = async (params: {
  leads_id: number;
  company_id: number;
  company_customer_id: number;
}) => {
  const response = await API_CLIENT.get<activityList>(
    "/activity/fetchActivityByLeadId",
    {
      params,
    }
  );

  return response.data;
};

export const createActivity = async (params: object) => {
  const response = await API_CLIENT.post<activity>("/activity/create", {
    params,
  });
  return response.data;
};

export const getActivityByUser = async (params: {
  user_id: number;
  company_id: number;
  customer_company_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.get<activityList>(
    "/activity/fetchActivityByUserId",
    {
      params,
    }
  );
  return response.data;
};

export const updateActivityStatus = async (params: object) => {
  const response = await API_CLIENT.post<activity>("/activity/updateStatus", {
    params,
  });
  return response.data;
};

export const getActivitiesByCompanyId = async (params: {
  company_id: number;
  company_customer_id: number;
}) => {
  const response = await API_CLIENT.get<activityList>(
    "/activity/fetchActivityByCompanyId",
    {
      params,
    }
  );
  return response.data;
};

export const createActivityByCompanyId = async (payload: object) => {
  const response = await API_CLIENT.post<activity>(
    "/activity/createByCompanyId",
    payload
  );

  return response.data;
};

export const getCustomersListByUserAndCompanyId = async (params: {
  user_id: number;
  company_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.get<CompanyList>(
    "/onboarding/fetchCustomersByUserId",
    {
      params,
    }
  );

  return response.data;
};

export const getCustomerDetailsByCompanyId = async (params: {
  company_id: number;
}) => {
  const response = await API_CLIENT.get<CompanyDetails>(
    "/onboarding/fetchCustomerDeatilsByCompanyId",
    {
      params,
    }
  );

  return response.data;
};

export const updateCustomer = async (payload: object) => {
  const response = await API_CLIENT.post("/onboarding/updateCustomer", payload);
  return response;
};

export const addCustomerContact = async (payload: object) => {
  const response = await API_CLIENT.post(
    "/onboarding/addCustomerContact",
    payload
  );
  return response;
};

export const getTimezones = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get("/onboarding/timezone", { params });
  return response.data;
};

export const getAccountStatus = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get("/onboarding/accountStatusType", {
    params,
  });
  return response.data;
};

export const getContractType = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get("/onboarding/contractType", { params });
  return response.data;
};

export const getPhasesByCompanyId = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<PhasesList>(
    "/onboarding/fetchPhasesByCompanyId",
    {
      params,
    }
  );

  return response.data;
};

export const addPhaseToCompany = async (payload: object) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/addPhase",
    payload
  );
  return response;
};

export const updatePhaseStepStatus = async (payload: object) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/updatePhaseStep",
    payload
  );

  return response;
};

export const updatePhaseStatus = async (payload: object) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/updatePhase",
    payload
  );
  return response;
};

export const addPhaseStep = async (payload: object) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/addPhaseStep",
    payload
  );
  return response;
};

export const getUserPermissions = async (params: { role_id: number }) => {
  const response = await API_CLIENT.get("/users/userPermissions", { params });

  return response.data;
};

export const getDocumentsByCompanyId = async (params: {
  customer_company_id: number;
  company_id: number;
}) => {
  const response = await API_CLIENT.get<DocumentList>(
    "/onboarding/fetchDocuments",
    {
      params,
    }
  );

  return response.data;
};

export const uploadDocuments = async (params: {
  file: File;
  company_customer_id: number;
  user_id: number;
  company_id: number;
}) => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("company_customer_id", params.company_customer_id.toString());
  formData.append("user_id", params.user_id.toString());
  formData.append("company_id", params.company_id.toString());

  const response = await API_CLIENT.post("/onboarding/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const uploadDocumentSales = async (params: {
  file: File;
  lead_id: number;
  user_id: number;
}) => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("lead_id", params.lead_id.toString());
  formData.append("user_id", params.user_id.toString());

  const response = await API_CLIENT.post("/sales/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getDocumentsByLeadId = async (params: { lead_id: number }) => {
  const response = await API_CLIENT.get<DocumentList>("/sales/fetchDocuments", {
    params,
  });

  return response.data;
};

export const updateLead = async (payload: {
  user_id:number;
  id: number;
  account_name: string;
  account_owner: number;
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
  lable: string;
  created_at: string;
  updated_at: string;
  contract_value: number;
  contract_duration: number;
  timezone: string;
  contract_type: string;
  mib: number;
  address: string;
  city: string;
  state: string;
  country: string;
  account_status: string;
  proposed_arr:number;
  account_status_type_id:number;
  contract_type_id:number;
  contract_stage_id:number;
  funnel_stage_id:number;
  label_id:number;
  status_id:number;
  lead_id:number;
  timezone_id:number;
}) => {
  const response = await API_CLIENT.post<LeadsData>(
    "/sales/updateCustomer",
    payload
  );
  return response.data;
};

export const getUserRoles = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get("/users/roles", {
    params,
  });

  return response.data;
};

export const createUser = async (payload: {
  phone: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  team_id: number;
  role_id: number;
  company_id: number;
}) => {
  const response = await API_CLIENT.post<UserList>(
    "/users/createUser",
    payload
  );
  return response.data;
};

export const getUser = async (params: { id: number }) => {
  const response = await API_CLIENT.get<UserList>("/users/getUser", {
    params,
  });

  return response.data;
};

export const updateUserDetails = async (payload: {
  first_name: string;
  last_name: string;
  username: string;
  user_id: number;
}) => {
  const response = await API_CLIENT.post<UserList>(
    "/users/updateUserDetails",
    payload
  );
  return response.data;
};

export const disableUser = async (payload: { user_id: number }) => {
  const response = await API_CLIENT.post<UserList>(
    "/users/disableUser",
    payload
  );
  return response.data;
};

export const addCustomer = async (payload: {
  name: string;
  support_email: string;
  contract_value: number;
  contract_duration: number;
  user_id: number;
  timezone_id: number;
  contract_type_id: number;
  mib: number;
}) => {
  const response = await API_CLIENT.post<LeadsData>(
    "/onboarding/addCustomer",
    payload
  );
  return response.data;
};

export const getContractStages = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<getContractStagesList>(
    "/sales/getContractStages",
    { params }
  );

  return response.data;
};

export const getLeadLable = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<getLeadLableList>(
    "/sales/getLeadLable",
    { params }
  );

  return response.data;
};

export const getLeadStatus = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<getLeadStatusList>(
    "/sales/getLeadStatus",
    { params }
  );

  return response.data;
};

export const dealConversionReport = async (payload: {
  start_date: string;
  end_date: string;
  company_id: number;
}) => {
  const response = await API_CLIENT.post<SalesDashboardData>(
    "/sales/dealConversionReport",
    payload
  );
  return response.data;
};

export const importLeadsFromCSV = async (payload: FormData) => {
  const response = await API_CLIENT.post<LeadsList>(
    "/sales/csv-import",
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const getCBDPhases = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<PhasesList>(
    "onboarding/fetchCbdPhasesByCompanyId",
    {
      params,
    }
  );

  return response.data;
};

export const addCBDPhase = async (payload: object) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/addCbdPhase",
    payload
  );
  return response;
};

export const addCBDPhaseStep = async (payload: object) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/addCbdPhaseStep",
    payload
  );
  return response;
};

export const getRevenuePhaseWise = async (payload: object) => {
  const response = await API_CLIENT.post<PhaseWiseRevenue[]>(
    "/onboarding/revenuePhaseWise",
    payload
  );

  return response.data;
};

export const userRoleUpdate = async (payload: {
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.post<UserList>(
    "/users/updateUserRole",
    payload
  );
  return response.data;
};

export const getMonthlyRenewals = async (payload: {
  user_id: number;
  role: number;
  company_id: number;
  start_date: string;
  end_date: string;
}) => {
  const response = await API_CLIENT.post<RenewalData>(
    "/accountMangement/monthlyRenewals",
    payload
  );
  return response.data;
};

export const getMonthlyPayments = async (payload: {
  user_id: number;
  role: number;
  company_id: number;
  start_date: string;
  end_date: string;
}) => {
  const response = await API_CLIENT.post<MonthlyCollectionData>(
    "/accountMangement/monthlyPayments",
    payload
  );
  return response.data;
};

export const getCompanyListByUSerId = async (params: {
  user_id: number;
  company_id: number;
}) => {
  const response = await API_CLIENT.get<CompanyList>(
    "/accountMangement/fetchCustomersByUserId",
    {
      params,
    }
  );
  return response.data;
};

export const getCompanyDetailsBycompanyId = async (params: {
  customer_company_id: number;
}) => {
  const response = await API_CLIENT.get<CompanyDetails>(
    "/accountMangement/fetchCustomerDeatilsByCompanyId",
    {
      params,
    }
  );
  return response.data;
};

export const getSalesSankeyGraph = async (params: {
  company_id: number;
  start_date: string;
  end_date: string;
  role: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get("/sales/sankeyGraph", {
    params,
  });
  return response.data;
};

export const getOnboardingSankeyGraph = async (params: {
  company_id: number;
  role: number;
  user_id: number;
  start_date: string;
  end_date: string;
}) => {
  const response = await API_CLIENT.get("/onboarding/sankeyGraph", {
    params,
  });
  return response.data;
};

export const updateHealth = async (params: {
  customer_company_id: number;
  health_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/companyCustomer/updateHealth",
    params
  );
  return response.data;
};

//timeToOnboardGraph
export const getTimeToOnboardGraph = async (params: {
  company_id: number;
  role: number;
  user_id: number;
  start_date: string;
  end_date: string;
}) => {
  const response = await API_CLIENT.get("/onboarding/timeToOnboard", {
    params,
  });
  return response.data;
};

//email campaign
export const createEcGroup = async (payload: {
  name: string;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/mailCampaign/createEcGroup",
    payload
  );
  return response.data;
};

export const getECGroups = async (params: {
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get("/mailCampaign/fetchEcGroup", {
    params,
  });
  return response.data;
};

export const addSubscribersToGroup = async (payload: {
  email_list: Array<{
    email: string;
    fields: {
      name: string;
      last_name: string;
    };
  }>;
  groups: number[];
  company_id: number;
  user_id: number;
}) => {
  try {
    const response = await API_CLIENT.post(
      "/mailCampaign/addEcSubscriber",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to add subscribers:", error);
    throw error;
  }
};

export const fetchEcSubscribers = async (params: {
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get("/mailCampaign/fetchEcSubscribers", {
    params,
  });
  return response.data;
};

export const createEmailCampaign = async (payload: {
  type: string;
  emails: [
    {
      subject: string;
      from_name: string;
      content: string;
      from: string;
    }
  ];
  name: string;
  groups: string[];
  company_id: number;
  user_id: number;
}) => {
  try {
    const response = await API_CLIENT.post(
      "/mailCampaign/createEcCampaign",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to create email campaign:", error);
    throw error;
  }
};

export const fetchEcCampaigns = async (params: {
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get("/mailCampaign/fetchEcCampaign", {
    params,
  });
  return response.data;
};

export const scheduleCampaignDelivery = async (payload: {
  campaign_id: string;
  company_id: number;
  delivery: string;
  user_id: number;
  schedule?: {
    date: string;
    hours: string;
    minutes: string;
    timezone: string;
  };
}) => {
  try {
    const response = await API_CLIENT.post(
      "/mailCampaign/scheduleEcCampaign",
      payload
    );
    return response.data;
  } catch (error) {
    console.error("Failed to schedule campaign delivery:", error);
    throw error;
  }
};

export const companyEmailList = async (params: {
  company_id: number;
  role_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get("/mailCampaign/ecEmailIds", {
    params,
  });
  return response.data;
};

export const fetchTsTickets = async (params: {
  company_id: number;
  user_id: number;
  company_customer_id: number;
}) => {
  const response = await API_CLIENT.get("/ticketSystem/fetchTsTickets", {
    params,
  });
  return response.data;
};

export const addTsTicket = async (payload: {
  company_id: number;
  user_id: number;
  company_customer_id: number;
  subject: string;
  description: string;
  email: string;
  priority: number;
  status: number;
  cc_emails: string[];
  due_date: string;
}) => {
  const response = await API_CLIENT.post("/ticketSystem/addTsTicket", payload);
  return response.data;
};

export const campaignReport = async (payload: {
  campaign_id: string;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/mailCampaign/getEcCampaignReport",
    payload
  );
  return response.data;
};

export const getScheduledCampaignsReport = async (params: {
  company_id: number;
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.get("/mailCampaign/scheduledCampaigns", {
    params,
  });
  return response.data;
};

export const sendToAM = async (payload: {
  user_id: number;
  company_id: number;
  company_customer_id: number;
  am_user_id: number;
  industry_id: number;
  account_status_type_id: number;
}) => {
  const response = await API_CLIENT.post("/accountMangement/sendToAm", payload);
  return response.data;
};

export const getAllAccounts = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<CompanyList>(
    "/onboarding/fetchAllCompanies",
    {
      params,
    }
  );
  return response.data;
};

export const Sales = async (params: {
  company_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.get<LeadsList>(
    "/sales/fetchUnassignedCustomersByCompanyId",
    {
      params,
    }
  );
  return response.data;
};

export const getUnassignedAccounts = async (params: {
  company_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.get<AccountsList>(
    "/onboarding/fetchUnassignedCustomersByCompanyId",
    {
      params,
    }
  );
  return response.data;
};

export const sendToOb = async (payload: { lead_id: number, industry_id: number, account_status_type_id: number }) => {
  const response = await API_CLIENT.post("/sales/sendToOb", payload);
  return response.data;
};
export const getCalendarEvents = async (payload: object) => {
  const response = await API_CLIENT.post(
    "/mail/api/get-calendar-events",
    payload
  );
  return response.data;
};
export const createCalendarEvent = async (payload: object) => {
  const response = await API_CLIENT.post(
    "/mail/api/create-calendar-event",
    payload
  );
  return response;
};

export const updateCalendarEvent = async (payload: object) => {
  const response = await API_CLIENT.post(
    "/mail/api/update-calendar-event",
    payload
  );
  return response;
};
export const deleteCalendarEvent = async (payload: object) => {
  const response = await API_CLIENT.post(
    "/mail/api/delete-calendar-event",
    payload
  );
  return response;
};

export const deleteCbdPhase = async (payload: {
  phase_id: number;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/onboarding/deleteCBDPhase", payload);
  return response;
};

export const renameCbdPhase = async (payload: {
  user_id: number;
  phase: string;
  company_id: number;
  phase_id: number;
}) => {
  const response = await API_CLIENT.post("/onboarding/renameCBDPhase", payload);
  return response;
};

export const renameCbdPhaseStep = async (payload: {
  user_id: number;
  step: string;
  company_id: number;
  phase_id: number;
  step_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/onboarding/renameCBDPhaseStep",
    payload
  );
  return response;
};

export const deleteCbdPhaseStep = async (payload: {
  step_id: number;
  company_id: number;
  user_id: number;
  phase_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/onboarding/deleteCBDPhaseStep",
    payload
  );
  return response;
};

export const renamePhaseStepToCompany = async (payload: {
  user_id: number;
  step: string;
  customer_company_id: number;
  phase_id: number;
  step_id: number;
}) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/renamePhaseStep",
    payload
  );
  return response;
};

export const deletePhaseStepToCompany = async (payload: {
  user_id: number;
  customer_company_id: number;
  phase_id: string;
  step_id: string;
}) => {
  const response = await API_CLIENT.post<string>(
    "/onboarding/deletePhaseStep",
    payload
  );
  return response;
};

export const renameEcGroup = async (payload: {
  group_id: number;
  new_name: string;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post<String>(
    "/mailCampaign/renameEcGroup",
    {
      payload,
    }
  );
  return response.data;
};

export const deleteEcGroup = async (payload: {
  group_id: number;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post<String>(
    "/mailCampaign/deleteEcGroup",
    {
      payload,
    }
  );
  return response.data;
};

export const getUnassignedAM = async (params: {
  company_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.get<AccountsList>(
    "/accountMangement/fetchUnassignedCustomersByCompanyId",
    {
      params,
    }
  );
  return response.data;
};

export const enableUser = async (payload: { user_id: number }) => {
  const response = await API_CLIENT.post<UserList>(
    "/users/enableUser",
    payload
  );
  return response.data;
};

export const createTemplate = async (payload: {
  user_id: number;
  company_id: number;
  template: string;
  name: string;
}) => {
  const response = await API_CLIENT.post<UserList>(
    "/mailCampaign/createTemplate",
    payload
  );
  return response.data;
};

export const getTemplates = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get("/mailCampaign/templates", {
    params,
  });
  return response.data;
};

export const getActiveTemplates = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get("/mailCampaign/activeTemplates", {
    params,
  });
  return response.data;
};

export const deleteTemplate = async (payload: {
  template_id: number;
  company_id: number;
  user_id: number;
  delete_bool: number;
}) => {
  const response = await API_CLIENT.post(
    "/mailCampaign/deleteTemplate",
    payload
  );
  return response.data;
};

export const forwardEmail = async (payload: {
  user_email: string;
  messageId: string;
  forwardTo: string;
  forwardBody: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/forward-email", payload);
  return response.data;
};

export const replyEmail = async (payload: {
  user_email: string;
  messageId: string;
  replyBody: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/reply-email", payload);
  return response.data;
};

export const replyAllEmail = async (payload: {
  user_email: string;
  messageId: string;
  replyBody: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/reply-all", payload);
  return response.data;
};

export const getAMTeamByCompanyId = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get(
    "/accountMangement/getAMTeamByCompanyId",
    {
      params,
    }
  );
  return response.data;
};

export const assignAMManager = async (payload: {
  user_id: number;
  am_manager_id: number;
  company_customer_id: number;
  company_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/accountMangement/assignAMManager",
    payload
  );
  return response.data;
};

export const getObTeamByCompanyId = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get("/onboarding/getObTeamByCompanyId", {
    params,
  });
  return response.data;
};

export const assignObManager = async (payload: {
  user_id: number;
  ob_manager_id: number;
  company_customer_id: number;
  company_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/onboarding/assignObManager",
    payload
  );
  return response.data;
};

export const logICP = async (payload: {
  is_icp: number;
  company_id: number;
  lead_id: number;
}) => {
  const response = await API_CLIENT.post("/sales/logICP", payload);
  return response.data;
};

export const getOBCustomersAndTeamByUserId = async (payload: {
  company_id: number;
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/onboarding/customersAndTeamByUserId",
    payload
  );
  return response.data;
};

export const getAMCustomersAndTeamByUserId = async (payload: {
  company_id: number;
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/accountMangement/customersAndTeamByUserId",
    payload
  );
  return response.data;
};

export const updateActivity = async (payload: {
  activity: string;
  description: string;
  date: string;
  time: string;
  user_id: number;
  activity_id: number;
  type: string;
  status: boolean;
}) => {
  const response = await API_CLIENT.post<activity>("/activity/update", payload);
  return response.data;
};

export const changePassword = async (payload: {
  user_id: number;
  old_password: string;
  new_password: string;
}) => {
  const response = await API_CLIENT.post("/users/changePassword", payload);
  return response.data;
};

export const getCbdCompanyDetails = async (params: { company_id: number }) => {
  const response = await API_CLIENT.get<CompanyDetails>(
    "/cbd/companyDetailsByCompanyId",
    {
      params,
    }
  );
  return response.data;
};

export const removeGoogleAccount = async (payload: {
  email: string;
  user_id: string;
}) => {
  const response = await API_CLIENT.post("mail/api/remove-user", payload);
  return response;
};

export const getEmailForCompany = async (payload: {
  user_email: string;
  company_customer_email: string;
  label: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/list-emails-user", payload);
  return response.data;
};

export const dataDefinitions = async (payload: {
  tableName: string;
  reqType: string;
  record_id: string;
  fieldData: JSON;
  company_id: string;
  user_id: string;
  delete_ids: string[];
}) => {
  const response = await API_CLIENT.post("/sales/dataDefinitions", payload);
  return response;
};

export const deleteDataDefinition = async (payload: {
  tableName: string;
  reqType: string;
  record_id: string;
  fieldData: JSON;
  company_id: string;
  user_id: string;
}) => {
  const response = await API_CLIENT.post("/sales/deleteDataDefinition", payload);
  return response;
};

export const getSentimentFields = async (params: {
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get("/accountMangement/sentimentFields", {
    params,
  });
  return response.data;
};

export const updateInlineDropdown = async (payload: {
  col_name: string;
  value: number;
  user_id: number;
  company_id: number;
  lead_id: number;
}) => {
  const response = await API_CLIENT.post("/sales/inlineDropdown", payload);
  return response.data;
};

export const getNotificationsbyUserId = async (params: {
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.get("/notifications/byUserId", {
    params,
  });
  return response.data;
};

export const getCustomersAndTeamByUserId = async (payload: {
  user_id: number;
  company_id: number;
  lead_id: number;
}) => {
  const response = await API_CLIENT.post(
    "/sales/customersAndTeamByUserId",
    payload
  );
  return response.data;
};

export const createWorkflow = async (payload: any) => {
  const response = await API_CLIENT.post("/workflow/createWorkflow", payload);
  return response.data;
};

export const deleteWorkflow = async (payload: any) => {
  const response = await API_CLIENT.post("/workflow/deleteWorkflow", payload);
  return response;
};

export const getWorkflow = async (params: {
  company_id: number;
  workflow_id: number;
  is_template?: number;
}) => {
  const response = await API_CLIENT.get(
    `/workflow/getWorkflow?company_id=${params.company_id}&workflow_id=${params.workflow_id}&is_template=${params.is_template}`
  );
  return response.data;
};

export const createNode = async (payload: any) => {
  const response = await API_CLIENT.post("/workflow/createNode", payload);
  return response;
};

export const deleteNode = async (payload: any) => {
  const response = await API_CLIENT.post("/workflow/deleteNode", payload);
  return response;
};

export const getNodes = async (params: {
  company_id: number;
  workflow_id: number;
  is_template?: number;
}) => {
  const { company_id, workflow_id, is_template = 0 } = params;

  const response = await API_CLIENT.get(
    `/workflow/getNodes?company_id=${company_id}&workflow_id=${workflow_id}&is_template=${is_template}`
  );
  return response.data;
};


export const updateNodes = async (payload: any) => {
  const response = await API_CLIENT.post("/workflow/updateNode", payload);
  return response;
};

export const publishWorkflow = async (payload: any) => {
  const response = await API_CLIENT.post("workflow/publishWorkflow", payload);
  return response;
};

export const getWorkflowsByCompanyId = async (params: {
  company_id: number;
}) => {
  const response = await API_CLIENT.get(
    `/workflow/getWorkflowByCompanyId?company_id=${params.company_id}`
  );
  return response.data;
};

export const getWorkflowsByType = async (params: {
  company_id: number;
  type: TypeoW;
}) => {
  const response = await API_CLIENT.get(
    `/workflow/getWorkflowByType?company_id=${params.company_id}&type=${params.type}`
  );
  return response.data;
};

export const generateOutput = async (payload: any) => {
  const response = await API_CLIENT.post(
    "https://ai.enttlevo.online/gpt/hit",
    payload
  );

  return response.data;
};

export const updateWorkflow = async (payload: any) => {
  const response = await API_CLIENT.post("/workflow/updateWorkflow", payload);
  return response;
};

export const getWorkflowTemplate = async () => {
  const response = await API_CLIENT.get("/workflow/getWorkflowTemplate");
  return response.data;
};

// Role and Permssion
export const createUserRole= async(payload:{
  name:string,
  company_id:number,
  user_id:number,
})=>{
  const response = await API_CLIENT.post("/roles/create", payload);
  return response.data;
}

export const addPermissionRole = async (payload: {
  role_id: number;
  permission: number[];
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/roles/addPermissionRole", payload);
  return response.data;
};

export const removePermissionRole = async (payload: {
  id:number,
  role_id: number;
  permission_id: number;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/roles/removePermissionRole", payload);
  return response.data;
};

export const roleWithPermission = async (payload: {
  role_id: number;
  company_id: number;
}) => {
  const response = await API_CLIENT.post("/roles/roleWithPermission", payload);
  return response.data;
};

export const getPermissions = async (payload: { 
  company_id: number,
  }) => {
  const response = await API_CLIENT.post('/roles/permissions',
    payload,
  );
  return response.data;
};

export const updateRole = async (payload: {
  id:number,
  name: string;
  company_id: number;
  user_id: number;
  is_active:number;
}) => {
  const response = await API_CLIENT.post("/roles/update", payload);
  return response.data;
};

export const sendToAMCustomer = async (payload: {
  name: string;
  support_email: string;
  contract_value: number;
  contract_duration: number;
  user_id: number;
  timezone_id: number;
  contract_type_id: number;
  mib: number;
  industry_id: number;
  account_status_type_id: number;
  licenses_or_units_sold: number;
}) => {
  const response = await API_CLIENT.post<LeadsData>(
    "/accountMangement/addCustomer",
    payload
  );
  return response.data;
};

export const getTeamMembers = async (params: { company_id: number, user_id: number }) => {
  const response = await API_CLIENT.get(`/teams/team`, { params });
  return response.data;
};

export const getTeamMembersList = async (params: { company_id: number, user_id: number, manager: number }) => {
  const response = await API_CLIENT.get(`/users/teamMembers`, { params });
  return response.data;
};

export const createTeam = async (payload: {
  company_id: number;
  user_id: number;
  team_owner_id: number;
  members: number[];
}) => {
  const response = await API_CLIENT.post('/teams/create', payload);
  return response.data;
};

export const deleteTeam = async (payload: {
  company_id: number;
  user_id: number;
  team_owner_id: number;
  is_active: number;
}) => {
  const response = await API_CLIENT.post('/teams/deleteTeam', payload);
  return response.data;
};

export const deleteTeamMember = async (payload: {
  company_id: number;
  user_id: number;
  team_owner_id: number;
  member_id: number;
}) => {
  const response = await API_CLIENT.post('/teams/deleteTeamMember', payload);
  return response.data;
};

export const getLeadsDeals = async (payload: {
  company_id: number;
  user_id: number;
  role_id: number;
  type: string;
  filters?: {
    column: string;
    operator: string;
    value: string;
    logicalOperator: string;
  }[];
  page: number;
  pageSize: number;
}) => {
  const response = await API_CLIENT.post("/sales/getLeadsDeals", payload);
  return response.data;
};

export const uploadAudio = async (payload: {
  file: File;
}) => {
  const formData = new FormData();
  formData.append('audio', payload.file);
  
  const response = await API_CLIENT.post("/audioTranscript/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const createTranscriptJob = async (payload: {
  company_id: number; 
  fileUrl: string;    
  user_id: number;    
  company_customer_id: number; 
  lead_id: number;   
}) => {
  const response = await API_CLIENT.post("/audioTranscript/transcribe", payload);
  return response.data;
};

export const getTranscriptStatus = async (payload: {
  transcript_job_id: string;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/audioTranscript/status", payload);
  return response.data;
};

export const getTranscripts = async (params: {
  company_id: number;
}) => {
  const response = await API_CLIENT.get("/audioTranscript/transcripts", { params });
  return response.data;
};

export const addLeadContact = async (payload: {
  name: string;
  email: string;
  contact: string;
  linkedin: string;
  lead_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/sales/addLeadContact", payload);
  return response.data;
};


// audioTranscript/upload with url
export const uploadAudioWithUrl = async (payload: {
  url: string;
}) => {
  const response = await API_CLIENT.post("/audioTranscript/uploadWithUrl", payload);
  return response.data;
};

export const getAllIntegrations = async () => {
  const response = await API_CLIENT.get("/integration/availableIntegrations");
  return response.data;
};

export const deleteCustomer = async (payload: {
user_id: number,
lead_id: number,
is_active: number,
is_deleted: number,
company_id: number,
}) => {
  const response = await API_CLIENT.post("/sales/deleteCustomer", payload);
  return response.data;
};

export const deleteObCustomer = async (payload: {
  user_id: number;
  company_id: number;
  is_active: number;
  is_deleted: number;
  company_customer_id: number;
}) => {
  const response = await API_CLIENT.post("/onboarding/deleteObCustomer", payload);
  return response.data;
};

export const deleteAMCustomer = async (payload: {
  user_id: number;
  company_id: number;
  is_active: number;
  is_deleted: number;
  company_customer_id: number;
}) => {
  const response = await API_CLIENT.post("/accountMangement/deleteAMCustomer", payload);
  return response.data;
};

export const addIntegrationAuth = async (payload: {
  company_id: number;
  user_id: number;
  integration_id: number;
  auth_json: {
    api: string;
    email: string;
  };
}) => {
  const response = await API_CLIENT.post("/integration/addIntegrationAuth", payload);
  return response.data;
};


// setTimezoneforCompany
export const setTimezoneforCompany = async (payload: {
  company_id: number;
  timezone_id: number;
}) => {
  const response = await API_CLIENT.post("/settings/setTimezoneforCompany", payload);
  return response.data;
};

export const getMrrOverview = async (payload: {
  company_id: number;
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.post("/accountMangement/report/mrrOverview", payload);
  return response.data;
};

export const getSentimentAnalysis = async (payload: {
  company_id: number;
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.post("/accountMangement/report/sentimentAnalysis", payload);
  return response.data;
};

export const getMrrTierSplit = async (payload: {
  company_id: number;
  user_id: number;
  role_id: number;
}) => {
  const response = await API_CLIENT.post("/accountMangement/report/mrrTierSplit", payload);
  return response.data;
};

export const getMrrTiers = async (payload: {
  company_id: number;
}) => {
  const response = await API_CLIENT.post("/accountMangement/mrrTiers", payload);
  return response.data;
};

export const deleteIntegration = async (payload: {
  company_id: number;
  user_id: number;
  integration_id: number;
}) => {
  const response = await API_CLIENT.post("/integration/deleteIntegration", payload);
  return response.data;
};

export const getIntegrationDetail = async (payload: {
  company_id: number;
  integration_id: number;
}) => {
  const response = await API_CLIENT.post("/integration/integrationDetail", payload);
  return response.data;
};

export const updateIntegration = async (payload: {
  company_id: number;
  user_id: number;
  integration_id: number;
}) => {
  const response = await API_CLIENT.post("/integration/updateIntegration", payload);
  return response.data;
};

export const getSubscriberGroups = async (params : {
  company_id: number;
  user_id: number
}) => {
  const response = await API_CLIENT.get("/mailCampaign/groupsWithSubs", {
    params
  });
  return response.data;
};


export const getUserPrefences = async (params : {
  user_id: number
}) => {
  const response = await API_CLIENT.get("/users/preferences", {
    params
  });
  return response.data;
};

export const updateUserPreferences = async (payload: {
  user_id: number;
  preferences: JSON;
  table_name: string
}) => {
  const response = await API_CLIENT.post("/users/preferences", payload);
  return response.data;
};

export const getSalesUnassignedLeads = async (payload: {
  filters: { column: string; operator: string; value: string; logicalOperator: string }[];
  company_id: number;
  user_id: number;
  role_id: number;
  type: string;
  page: number;
  pageSize: number;
}) => {
  const response = await API_CLIENT.post("/sales/getUnassignedLeads", payload);
  return response.data;
};


export const assignLead = async (payload: {
  user_id: number;
  company_id: number;
  assign_to: number;
  lead_id: number;
}) => {
  const response = await API_CLIENT.post("/sales/assignLead", payload);
  return response.data;
};

export const getAllAMAccounts = async (payload: {
  company_id: number;
  user_id: number;
  role_id: number;
  filters: { column: string; operator: string; value: string; logicalOperator: string }[];
}) => {
  const response = await API_CLIENT.post("/accountMangement/allAccounts", payload);
  return response.data;
};

export const getScheduledCampaignsReportById = async (payload: {
  campaign_id: string;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/mailCampaign/getEcCampaignReport", payload);
  return response.data;
};

export const getLogsByLeadId = async (payload: {
  lead_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/logs/getByLeadId", payload);
  return response.data;
};

export const getLogsByUserId = async (payload: {
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/logs/getByUserId", payload);
  return response.data;
};

export const googleBackendURL = async () =>{
  const response = await API_CLIENT.post("/mail/api/save-token");
  return response.data;
}

// Google Authentication API endpoints
export const saveGoogleToken = async (payload: {
  code: string;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/mail/api/save-token", payload);
  return response.data;
};

export const checkGoogleUser = async (params: {
  email: string;
}) => {
  const response = await API_CLIENT.get("/mail/api/check-user", { params });
  return response.data;
};

export const refreshGoogleToken = async (params: {
  email: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/refresh-token", params);
  return response.data;
};

export const getGoogleCalendarEvents = async (payload: object) => {
  const response = await API_CLIENT.post("/mail/api/get-calendar-events", payload);
  return response.data;
};

export const createGoogleCalendarEvent = async (payload: object) => {
  const response = await API_CLIENT.post("/mail/api/create-calendar-event", payload);
  return response.data;
};

export const updateGoogleCalendarEvent = async (payload: object) => {
  const response = await API_CLIENT.post("/mail/api/update-calendar-event", payload);
  return response.data;
};

export const deleteGoogleCalendarEvent = async (payload: object) => {
  const response = await API_CLIENT.post("/mail/api/delete-calendar-event", payload);
  return response.data;
};

export const forwardGoogleEmail = async (payload: {
  user_email: string;
  messageId: string;
  forwardTo: string;
  forwardBody: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/forward-email", payload);
  return response.data;
};

export const replyGoogleEmail = async (payload: {
  user_email: string;
  messageId: string;
  replyBody: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/reply-email", payload);
  return response.data;
};

export const replyAllGoogleEmail = async (payload: {
  user_email: string;
  messageId: string;
  replyBody: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/reply-all", payload);
  return response.data;
};

export const getGoogleEmailsForCompany = async (payload: {
  user_email: string;
  company_customer_email: string;
  label: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/list-emails-user", payload);
  return response.data;
};


export const getListofEmails = async (payload: {
  user_email: string;
  label: string;
}) => {
  const response = await API_CLIENT.post("/mail/api/list-emails", payload);
  return response.data;
};

export const viewGoogleEmail = async (payload: {
  emailId: string;
  userEmail: string;
}) => {
  const response = await API_CLIENT.get(`/mail/api/view-email?emailId=${payload.emailId}&userEmail=${payload.userEmail}`);
  return response.data;
};

export const sendGoogleEmail = async (payload: {
  user_email: string;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  account_owner: string | number;
}) => {
  const response = await API_CLIENT.post("/mail/api/send-email", payload);
  return response.data;
};

// AM Data Rules
export const addProduct = async(payload:{
  product_name: string;
  type: string;
  price: number;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/product/addProduct", payload);
  return response.data;
};

export const updateProduct = async(payload:{
  id: number;
  product_name: string;
  type: string;
  price: number;
  is_active: number;
  is_deleted: number;
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/product/updateProduct", payload);
  return response.data;
};

export const getProducts = async(payload:{
  company_id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/product/getAllProduct", payload);
  return response.data;
};

export const getProductByCustomerCompanyId = async(payload:{
  company_id: number;
  company_customer_id: number;
}) => {
  const response = await API_CLIENT.post("/product/getProductByCustomerCompanyId", payload);
  return response.data;
};

export const addCustomerProduct = async(payload:{
  product_id: number;
  quantity: number;
  price: number;
  user_id: number;
  company_customer_id: number;
  company_id: number;
  contacts: number[];
}) => {
  const response = await API_CLIENT.post("/product/addCustomerProduct", payload);
  return response.data;
};

export const updateCustomerProduct = async(payload:{
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  user_id: number;
  company_customer_id: number;
  company_id: number;
  contacts: number[];
}) =>{
  const response = await API_CLIENT.post("/product/updateCustomerProduct", payload);
  return response.data;
};

export const getContactByCompanyCustomerId = async(payload:{
  company_customer_id: number;
  company_id: number;
}) => {
  const response = await API_CLIENT.post("/companyCustomer/getContactByCompanyCustomerId", payload);
  return response.data;
};

export const removeProductContact = async(payload:{
  company_customer_id: number;
  customer_product_id: number;
  id: number;
  user_id: number;
}) => {
  const response = await API_CLIENT.post("/product/removeProductContact", payload);
  return response.data;
};

//Zoho API
export const removeZohoAccount = async(payload:{
  email: string;
  user_id: number | undefined;
}) => {
  const response = await API_CLIENT.post("/zoho/api/remove-zoho-account", payload);
  return response.data;
};

export const saveZohoToken = async(payload:{
  code: string;
  user_id: number | undefined;
}) => {
  const response = await API_CLIENT.post("/zoho/api/save-token", payload);
  return response.data;
};

export const checkZohoUser = async(payload:{
  email: string;
}) => {
  const response = await API_CLIENT.get(`/zoho/api/check-user?email=${payload.email}`);
  return response.data;
};

export const refreshZohoToken = async(payload:{
  user_id: number | undefined;
}) => {
  const response = await API_CLIENT.post("/zoho/api/refresh-token", payload);
  return response.data;
};

// Custom email
export const saveConfig = async(payload:{
  user_id: number | undefined;
  email: string;
  MAIL_HOST: string;
  MAIL_SMTP_PORT: string;
  MAIL_USERNAME: string;
  MAIL_PASSWORD: string;
  MAIL_ENCRYPTION: string;
  MAIL_IMAP_PORT: string;
}) => {
  const response = await API_CLIENT.post("/customEmail/api/save-config", payload);
  return response.data;
};

export const updateConfig = async(payload:{
  user_id: number | undefined;
  email: string;
  is_active: number;
  is_deleted: number;
  config: {
    user_id: number | undefined;
    user_email: string;
    MAIL_HOST: string;
    MAIL_SMTP_PORT: string;
    MAIL_USERNAME: string;
    MAIL_PASSWORD: string;
    MAIL_ENCRYPTION: string;
    MAIL_IMAP_PORT: string;
  }
}) => {
  const response = await API_CLIENT.post("/customEmail/api/update-config", payload);
  return response.data;
};

export const getConfig = async(payload:{
  user_id: number | undefined;
  email: string;
}) => {
  const response = await API_CLIENT.post("/customEmail/api/get-config", payload);
  return response.data;
};

  export const listCustomEmails = async(payload:{
    user_id: number | undefined;
    user_email: string;
    label: string;
  }) => {
    const response = await API_CLIENT.post("/customEmail/api/list-mails", payload);
    return response.data;
  };

export const sendCustomEmail = async(payload:{
  user_id: number | undefined;
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  attachments?: File[];
}) => {
  const response = await API_CLIENT.post("/customEmail/api/send-mail", payload);
  return response.data;
};

export const viewCustomEmail = async(payload:{
  user_id: number | undefined;
  user_email: string;
  uid: number;
}) => {
  const response = await API_CLIENT.post("/customEmail/api/view-mail", payload);
  return response.data;
};

export const replyCustomEmail = async(payload:{
  user_id: number | undefined;
  user_email: string;
  uid: number;
  body: string;
}) => {
  const response = await API_CLIENT.post("/customEmail/api/reply-mail", payload);
  return response.data;
};

export const replyAllCustomEmail = async(payload:{
  user_id: number | undefined;
  user_email: string;
  uid: number;
  body: string;
}) => {
  const response = await API_CLIENT.post("/customEmail/api/reply-all", payload);
  return response.data;
};

export const forwardCustomEmail = async(payload:{
  user_id: number | undefined;
  user_email: string;
  uid: number;
  body: string;
  forwardTo: string;
}) => {
  const response = await API_CLIENT.post("/customEmail/api/forward-mail", payload);
  return response.data;
};
