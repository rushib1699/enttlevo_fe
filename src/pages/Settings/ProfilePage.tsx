import React, { useState, useCallback, useEffect } from "react";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import {
  changePassword,
  updateUserDetails,
  getUser,
  removeGoogleAccount,
  saveGoogleToken,
  checkGoogleUser,
  removeZohoAccount,
  saveZohoToken,
  checkZohoUser,
  saveConfig,
  updateConfig,
  getConfig,
  updateUserPreferences,
  getUserPrefences,
} from "@/api";
import { toast } from "sonner";
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, ZOHO_CLIENT_ID, ZOHO_REDIRECT_URI } from "@/constants";

// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "lucide-react";
import { SiZoho } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';

// Icons
import {
  Edit3,
  Lock,
  User,
  Phone,
  Mail,
  Shield,
  Check,
  X,
  AlertTriangle,
  Settings,
  Save,
  Eye,
  EyeOff,
  Link,
  Unlink,
  Loader2,
} from "lucide-react";



interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  contact: string;
  profile_image: string;
}



interface FormData {
  first_name: string;
  last_name: string;
  username: string;
  contact: string;
}

interface PasswordData {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

interface CustomEmailConfig {
  MAIL_HOST: string;
  MAIL_SMTP_PORT: string;
  MAIL_USERNAME: string;
  MAIL_PASSWORD: string;
  MAIL_ENCRYPTION: string;
  MAIL_IMAP_PORT: string;
}

interface ConfigResponse {
  id: number;
  email: string;
  config: string;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  created_by: number;
  updated_by: number;
  user_id: number;
}

interface TabContentProps {
  isActive: boolean;
  children: React.ReactNode;
}

const TabContent = ({ isActive, children }: TabContentProps) => {
  if (!isActive) return null;
  return <div>{children}</div>;
};

interface ConnectedEmails {
  google_email?: string;
  zoho_email?: string;
  custom_email?: string;
}

interface EmailPreferences {
  columnVisibilityModel: {
    primary_email_type: string;
  };
}

interface UserPreferences {
  email_preferences: EmailPreferences;
}

const ProfilePage = () => {
  const { loginResponse } = useApplicationContext();
  
  // User data state
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    username: "",
    contact: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Password states
  const [passwordData, setPasswordData] = useState<PasswordData>({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Google account states
  const [emailExists, setEmailExists] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleDisconnectDialogOpen, setIsGoogleDisconnectDialogOpen] = useState(false);

  // Zoho account states
  const [zohoEmailExists, setZohoEmailExists] = useState(false);
  const [isZohoLoading, setIsZohoLoading] = useState(false);
  const [isZohoDisconnectDialogOpen, setIsZohoDisconnectDialogOpen] = useState(false);

  // Custom email states
  const [customEmailExists, setCustomEmailExists] = useState(false);
  const [isCustomEmailDialogOpen, setIsCustomEmailDialogOpen] = useState(false);
  const [isCustomEmailLoading, setIsCustomEmailLoading] = useState(false);
  const [customEmailConfig, setCustomEmailConfig] = useState<CustomEmailConfig>({
    MAIL_HOST: "",
    MAIL_SMTP_PORT: "",
    MAIL_USERNAME: "",
    MAIL_PASSWORD: "",
    MAIL_ENCRYPTION: "ssl",
    MAIL_IMAP_PORT: "",
  });
  const [existingConfig, setExistingConfig] = useState<ConfigResponse | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState("profile");

  // Add this state variable
  const [primaryEmail, setPrimaryEmail] = useState<string>("");
  const [connectedEmails, setConnectedEmails] = useState<ConnectedEmails>({});

  //USER PREFERENCES
  

  // Fetch user data and config
  const fetchUserData = useCallback(async () => {

    try {
      setIsLoading(true);
      const id = loginResponse?.id;
      if (id) {
                 const response = await getUser({ id }) as unknown as UserData;
         setUser(response);
          setFormData({
            first_name: response.first_name || "",
            last_name: response.last_name || "",
            username: response.username || "",
            contact: response.contact || "",
          });
      
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  }, [loginResponse]);

  // Fetch custom email configuration
  const fetchCustomEmailConfig = async () => {
    try {
      const user_id = loginResponse?.id;
      const user_email = loginResponse?.custom_email;
      
        const configResponse = await getConfig({ 
          user_id: user_id || 0,
          email: user_email || ""
         });
        if (configResponse && configResponse.is_active === 1 && configResponse.is_deleted === 0) {
          setExistingConfig(configResponse);
          setCustomEmailExists(true);
          
          // Parse the config JSON string
          try {
            const parsedConfig = JSON.parse(configResponse.config);
            setCustomEmailConfig({
              MAIL_HOST: parsedConfig.MAIL_HOST || "",
              MAIL_SMTP_PORT: parsedConfig.MAIL_SMTP_PORT || "",
              MAIL_USERNAME: parsedConfig.MAIL_USERNAME || "",
              MAIL_PASSWORD: parsedConfig.MAIL_PASSWORD || "",
              MAIL_ENCRYPTION: parsedConfig.MAIL_ENCRYPTION || "ssl",
              MAIL_IMAP_PORT: parsedConfig.MAIL_IMAP_PORT || "",
            });
          } catch (parseError) {
            console.error("Error parsing config:", parseError);
          }
        } else {
          setCustomEmailExists(false);
          setExistingConfig(null);
        }
    
    } catch (error) {
      console.error("Error fetching custom email config:", error);
      setCustomEmailExists(false);
      setExistingConfig(null);
    }
  };

  useEffect(() => {
    fetchCustomEmailConfig();
  }, []);

  useEffect(() => {
    fetchUserData();
    checkUserExists();
    checkZohoUserExists();
  }, [fetchUserData]);

  // Function to fetch user email preferences
  const fetchUserEmailPreferences = async () => {
    try {
      const userPref = await getUserPrefences({
        user_id: loginResponse?.id || 0
      });

      // Get available emails
      const availableEmails: ConnectedEmails = {
        google_email: sessionStorage.getItem('googleEmail') || undefined,
        zoho_email: sessionStorage.getItem('zohoEmail') || undefined,
        custom_email: loginResponse?.custom_email
      };
      setConnectedEmails(availableEmails);

      if (userPref?.preference) {
        // Parse the preferences
        const preferences = JSON.parse(userPref.preference);
        
        // Get email preferences
        if (preferences?.email_preferences?.columnVisibilityModel?.primary_email_type) {
          const primaryEmailType = preferences.email_preferences.columnVisibilityModel.primary_email_type;
          const primaryEmailValue = availableEmails[primaryEmailType as keyof ConnectedEmails];
          
          if (primaryEmailValue) {
            setPrimaryEmail(primaryEmailValue);
            return;
          }
        }
      }

      // If no preference found or invalid, default to first available email
      const firstAvailableEmail = Object.values(availableEmails).find(email => email);
      if (firstAvailableEmail) {
        setPrimaryEmail(firstAvailableEmail);
        
        // Save the preference
        const emailType = Object.entries(availableEmails).find(([_, email]) => email === firstAvailableEmail)?.[0];
        if (emailType) {
          const preferences = {
            email_preferences: {
              columnVisibilityModel: {
                primary_email_type: emailType
              }
            }
          };

          await updateUserPreferences({
            user_id: loginResponse?.id || 0,
            preferences: preferences as unknown as JSON,
            table_name: "email_preferences"
          });
        }
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
    }
  };

  // Initialize primary email
  useEffect(() => {
    if (loginResponse?.id) {
      fetchUserEmailPreferences();
    }
  }, [loginResponse?.id, loginResponse?.custom_email, emailExists, zohoEmailExists, customEmailExists]);

  // Handle profile update
  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    
    try {
      setIsSaving(true);
      const user_id = loginResponse?.id || 0;
      await updateUserDetails({ user_id, ...formData });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      fetchUserData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords do not match!");
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    try {
      setIsChangingPassword(true);
      const user_id = loginResponse?.id || 0;
      await changePassword({
        user_id,
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success("Password changed successfully!");
      setIsPasswordDialogOpen(false);
      setPasswordData({ old_password: "", new_password: "", confirm_password: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Google account functions
  const handleGoogleLogin = () => {
    toast.info("Please ensure you connect with a Google account that uses the same email address as your user account.");
    
    const scopes = [
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.events.readonly"
    ];
    
    const scopeParams = scopes.join("%20");
    const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=${scopeParams}&access_type=offline&prompt=consent`;
    window.location.href = authUrl;
  };

  const handleGoogleDisconnect = async () => {
    setIsGoogleLoading(true);
    try {
      const email = sessionStorage.getItem("googleEmail");
      const user_id = loginResponse?.id;

      if (!email) {
        throw new Error("Google account email not found in session.");
      }

      await removeGoogleAccount({ email, user_id: user_id?.toString() || "" });
      sessionStorage.removeItem("googleEmail");
      sessionStorage.removeItem("tokenProcessed");
      toast.success("Google account disconnected successfully.");
      setEmailExists(false);
    } catch (error) {
      console.error("Error removing Google account:", error);
      toast.error("Failed to disconnect Google account.");
    } finally {
      setIsGoogleLoading(false);
      setIsGoogleDisconnectDialogOpen(false);
    }
  };

  const checkUserExists = async () => {
    const email = sessionStorage.getItem("googleEmail");
    if (!email) return;
    
    try {
      const response = await checkGoogleUser({ email });
      setEmailExists(response.exists);
    } catch (error) {
      console.error("Error checking user existence:", error);
    }
  };

  // Zoho account functions
  const handleZohoLogin = () => {
    toast.info("Please ensure you connect with a Zoho account that uses the same email address as your user account.");
    
    const zohoAuthUrl = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${ZOHO_CLIENT_ID}&redirect_uri=${ZOHO_REDIRECT_URI}&scope=ZohoMail.accounts.ALL,ZohoMail.messages.ALL&access_type=offline&prompt=consent&state=zoho`;
    window.location.href = zohoAuthUrl;
  };

  const handleZohoDisconnect = async () => {
    setIsZohoLoading(true);
    try {
      const email = sessionStorage.getItem("zohoEmail");
      const user_id = loginResponse?.id;

      if (!email) {
        throw new Error("Zoho account email not found in session.");
      }

      await removeZohoAccount({ email, user_id });
      sessionStorage.removeItem("zohoEmail");
      sessionStorage.removeItem("zohoTokenProcessed");
      toast.success("Zoho account disconnected successfully.");
      setZohoEmailExists(false);
    } catch (error) {
      console.error("Error removing Zoho account:", error);
      toast.error("Failed to disconnect Zoho account.");
    } finally {
      setIsZohoLoading(false);
      setIsZohoDisconnectDialogOpen(false);
    }
  };

  const checkZohoUserExists = async () => {
    const email = sessionStorage.getItem("zohoEmail");
    if (!email) return;
    
    try {
      const response = await checkZohoUser({ email });
      setZohoEmailExists(response.exists);
    } catch (error) {
      console.error("Error checking Zoho user existence:", error);
    }
  };

  // Custom email functions
  const handleCustomEmailConnect = () => {
    setIsCustomEmailDialogOpen(true);
  };

  const handleCustomEmailDisconnect = async () => {
    setIsCustomEmailLoading(true);
    try {
      await updateConfig({
        user_id: loginResponse?.id,
        email: user?.email || "",
        is_active: 0,
        is_deleted: 1,
        config: {
          user_id: loginResponse?.id ,
          user_email: loginResponse?.custom_email || "",
          MAIL_HOST: customEmailConfig.MAIL_HOST,
          MAIL_SMTP_PORT: customEmailConfig.MAIL_SMTP_PORT,
          MAIL_USERNAME: customEmailConfig.MAIL_USERNAME,
          MAIL_PASSWORD: customEmailConfig.MAIL_PASSWORD,
          MAIL_ENCRYPTION: customEmailConfig.MAIL_ENCRYPTION,
          MAIL_IMAP_PORT: customEmailConfig.MAIL_IMAP_PORT,
        }
      });
      setCustomEmailExists(false);
      setExistingConfig(null);
      toast.success("Custom email disconnected.");
    } catch (err) {
      toast.error("Failed to disconnect custom email.");
    } finally {
      setIsCustomEmailLoading(false);
    }
  };

  const handleCustomConfigSave = async () => {
    setIsCustomEmailLoading(true);
    try {
      if (existingConfig) {
        // Update existing config
        await updateConfig({
          user_id: loginResponse?.id,
          email: loginResponse?.custom_email || "",
          is_active: 1,
          is_deleted: 0,
          config: {
            user_id: loginResponse?.id ,
            user_email: loginResponse?.custom_email || "",
            MAIL_HOST: customEmailConfig.MAIL_HOST,
            MAIL_SMTP_PORT: customEmailConfig.MAIL_SMTP_PORT,
            MAIL_USERNAME: customEmailConfig.MAIL_USERNAME,
            MAIL_PASSWORD: customEmailConfig.MAIL_PASSWORD,
            MAIL_ENCRYPTION: customEmailConfig.MAIL_ENCRYPTION,
            MAIL_IMAP_PORT: customEmailConfig.MAIL_IMAP_PORT,
          }
        });
        toast.success("Custom email configuration updated!");
       // Update loginResponse in localStorage with new custom_email
        const currentLoginResponse = JSON.parse(localStorage.getItem('loginResponse') || '{}');
        const updatedLoginResponse = {
         ...currentLoginResponse,
         custom_email: customEmailConfig.MAIL_USERNAME
       };
       localStorage.setItem('loginResponse', JSON.stringify(updatedLoginResponse));
        
      } else {
        // Save new config
        await saveConfig({
          user_id: loginResponse?.id,
          email: loginResponse?.custom_email || "",
          ...customEmailConfig,
        });
        setCustomEmailExists(true);
        toast.success("Custom email connected!");
      }
      setIsCustomEmailDialogOpen(false);
      await fetchCustomEmailConfig(); // Refresh config data
    } catch (err) {
      toast.error("Failed to save custom email configuration.");
    } finally {
      setIsCustomEmailLoading(false);
    }
  };

  const handleUpdateCustomEmail = () => {
    if (existingConfig) {
      // Parse existing config and populate form
      try {
        const parsedConfig = JSON.parse(existingConfig.config);
        setCustomEmailConfig({
          MAIL_HOST: parsedConfig.MAIL_HOST || "",
          MAIL_SMTP_PORT: parsedConfig.MAIL_SMTP_PORT || "",
          MAIL_USERNAME: parsedConfig.MAIL_USERNAME || "",
          MAIL_PASSWORD: parsedConfig.MAIL_PASSWORD || "",
          MAIL_ENCRYPTION: parsedConfig.MAIL_ENCRYPTION || "ssl",
          MAIL_IMAP_PORT: parsedConfig.MAIL_IMAP_PORT || "",
        });
      } catch (parseError) {
        console.error("Error parsing existing config:", parseError);
      }
    }
    setIsCustomEmailDialogOpen(true);
  };

  // Handle OAuth callbacks
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    
    if (!code || sessionStorage.getItem(`${state}TokenProcessed`) === "true") return;
    
    window.history.replaceState({}, document.title, window.location.pathname);
    
    if (state === "google") {
      handleAuthCode(code);
    } else if (state === "zoho") {
      handleAuthCodeZoho(code);
    }
  }, []);

  const handleAuthCode = async (code: string) => {
    const user_id = loginResponse?.id;
    const user_email = loginResponse?.email;
    
    try {
      const response = await saveGoogleToken({ code, user_id: user_id || 0 });
      const googleEmail = response.google_email;
      
      const normalizedUserEmail = (user_email || '').trim().toLowerCase();
      const normalizedGoogleEmail = (googleEmail || '').trim().toLowerCase();
      
      if (normalizedUserEmail !== normalizedGoogleEmail) {
        toast.error('The Google account email does not match your user account email. Please use a Google account with the same email address.');
        return;
      }
      
      sessionStorage.setItem("googleEmail", googleEmail);
      sessionStorage.setItem("googleTokenProcessed", "true");
      setEmailExists(true);
      toast.success("Google account connected successfully!");
    } catch (error) {
      console.error("Error sending authorization code to backend:", error);
      toast.error("Failed to connect Google account. Please try again.");
    }
  };

  const handleAuthCodeZoho = async (code: string) => {
    const user_id = loginResponse?.id;
    const user_email = loginResponse?.email;
    
    try {
      const response = await saveZohoToken({ code, user_id });
      const zohoEmail = response.zoho_email;
      
      const normalizedUserEmail = (user_email || '').trim().toLowerCase();
      const normalizedZohoEmail = (zohoEmail || '').trim().toLowerCase();
      
      if (normalizedUserEmail !== normalizedZohoEmail) {
        toast.error('The Zoho account email does not match your user account email. Please use a Zoho account with the same email address.');
        return;
      }
      
      sessionStorage.setItem("zohoEmail", zohoEmail);
      sessionStorage.setItem("zohoTokenProcessed", "true");
      setZohoEmailExists(true);
      toast.success("Zoho account connected successfully!");
    } catch (error) {
      console.error("Error sending Zoho authorization code to backend:", error);
      toast.error("Failed to connect Zoho account. Please try again.");
    }
  };

  // Password validation
  const isPasswordValid = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    return hasUpperCase && hasNumber && hasSpecialChar && isLongEnough;
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };



  // Add this component for the radio selection
  const PrimaryEmailSelector = ({ connectedEmails }: { connectedEmails: ConnectedEmails }) => {
    const availableEmails = Object.entries(connectedEmails).filter(([_, email]) => email);
    
    if (availableEmails.length <= 1) return null;

    const getEmailIcon = (type: string) => {  
      switch (type) {
        case 'google_email':
          return <FcGoogle className="h-4 w-4" />;
        case 'zoho_email':
          return <SiZoho className="h-4 w-4 text-red-500" />;
        case 'custom_email':
          return <Mail className="h-4 w-4 text-blue-500" />;
        default:
          return <Mail className="h-4 w-4" />;
      }
    };

    const getEmailLabel = (type: string) => {
      return type.split('_')[0].charAt(0).toUpperCase() + type.split('_')[0].slice(1);
    };


    //USER PREFERENCES
    const fetchUserEmailPreferences = async () => {
      try {
        const userPref = await getUserPrefences({
          user_id: loginResponse?.id || 0
        });
  
        if (userPref?.preference) {
          // Parse the preferences
          const preferences = JSON.parse(userPref.preference) as UserPreferences;
          
          // Get email preferences
          if (preferences?.email_preferences?.columnVisibilityModel?.primary_email_type) {
            setPrimaryEmail(preferences.email_preferences.columnVisibilityModel.primary_email_type);
          }
        }
      } catch (error) {
        console.error('Failed to load email preferences:', error);
      }
    }

    const handlePrimaryEmailChange = async (email: string) => {
      try {
        // Find the email type from the email value
        const emailType = Object.entries(connectedEmails).find(([_, value]) => value === email)?.[0];
        
        if (!emailType) {
          throw new Error("Invalid email selection");
        }

        const preferences = {
          email_preferences: {
            columnVisibilityModel: {
              primary_email_type: emailType
            }
          }
        };

        await updateUserPreferences({
          user_id: loginResponse?.id || 0,
          preferences: preferences as unknown as JSON,
          table_name: "email_preferences"
        });
        
        setPrimaryEmail(email);
        toast.success(`${emailType.split('_')[0].charAt(0).toUpperCase() + emailType.split('_')[0].slice(1)} email selected as primary`);
      } catch (error) {
        console.error("Error updating primary email:", error);
        toast.error("Failed to update primary email. Please try again.");
      }
    }



    useEffect(() => {
      if (loginResponse?.id) {
        fetchUserEmailPreferences();
      }
    }, [loginResponse?.id]);

    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Primary Email</h4>
            <p className="text-sm text-gray-500">
              Select which email interface to show by default
            </p>
          </div>
          <Select
            value={primaryEmail}
            onValueChange={handlePrimaryEmailChange}
          >
            <SelectTrigger className="w-auto">
              <SelectValue placeholder="Select primary email" />
            </SelectTrigger>
            <SelectContent>
              {availableEmails.map(([type, email]) => (
                <SelectItem
                  key={type}
                  value={email || ''}
                  className="flex items-center space-x-2 py-2"
                >
                  <div className="flex items-center space-x-2">
                    {getEmailIcon(type)}
                    <div className="flex flex-col">
                      <span className="font-medium">{getEmailLabel(type)}: {email}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Alert className="bg-orange-50 border-orange-200">
          <Mail className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-sm text-orange-700">
            Your primary email will be used as the default interface when accessing the email section.
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <Settings className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-2">
        <div className="flex space-x-4">
          <button
            className={`py-4 px-1 relative font-medium text-sm ${
              activeTab === "profile"
                ? "text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`py-4 px-1 relative font-medium text-sm ${
              activeTab === "security"
                ? "text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
          <button
            className={`py-4 px-1 relative font-medium text-sm ${
              activeTab === "accounts"
                ? "text-orange-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-orange-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("accounts")}
          >
            Connected Accounts
          </button>
        </div>
      </div>

      {/* Profile Tab Content */}
      <TabContent isActive={activeTab === "profile"}>
        <Card className="overflow-hidden rounded-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-indigo-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={user?.profile_image} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-100 to-indigo-100 text-orange-700 text-xl font-semibold">
                    {getInitials(user?.first_name, user?.last_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">
                    {user?.first_name} {user?.last_name}
                  </CardTitle>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {user?.email}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    <User className="w-3 h-3 mr-1" />
                    @{user?.username}
                  </Badge>
                </div>
              </div>
              
              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        first_name: user?.first_name || "",
                        last_name: user?.last_name || "",
                        username: user?.username || "",
                        contact: user?.contact || "",
                      });
                    }}
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-2"
                    placeholder="Enter your first name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    disabled={!isEditing}
                    className="mt-2"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative mt-2">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      disabled={true}
                      className="pl-8"
                      placeholder="username"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="contact">Contact Number *</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="contact"
                      value={formData.contact}
                      onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10"
                      placeholder="Enter your contact number"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div>
              <Label>Email Address</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={user?.email}
                  disabled
                  className="pl-10 bg-gray-50"
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Email address cannot be changed. Contact support if needed.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabContent>

      {/* Security Tab Content */}
      <TabContent isActive={activeTab === "security"}>
        <Card className="overflow-hidden rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-orange-600" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-gray-500">
                  Change your account password
                </p>
              </div>
              <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Lock className="w-5 h-5 mr-2" />
                      Change Password
                    </DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="old_password">Current Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="old_password"
                          type={showOldPassword ? "text" : "password"}
                          value={passwordData.old_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                        >
                          {showOldPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="new_password">New Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="new_password"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {passwordData.new_password && (
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                          <div className="text-sm">
                            <p className="font-medium mb-2">Password Requirements:</p>
                            <ul className="space-y-1">
                              <li className={`flex items-center ${passwordData.new_password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                                <Check className="w-3 h-3 mr-2" />
                                At least 8 characters
                              </li>
                              <li className={`flex items-center ${/[A-Z]/.test(passwordData.new_password) ? 'text-green-600' : 'text-gray-500'}`}>
                                <Check className="w-3 h-3 mr-2" />
                                One uppercase letter
                              </li>
                              <li className={`flex items-center ${/\d/.test(passwordData.new_password) ? 'text-green-600' : 'text-gray-500'}`}>
                                <Check className="w-3 h-3 mr-2" />
                                One number
                              </li>
                              <li className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password) ? 'text-green-600' : 'text-gray-500'}`}>
                                <Check className="w-3 h-3 mr-2" />
                                One special character
                              </li>
                            </ul>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsPasswordDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword || !isPasswordValid(passwordData.new_password)}
                    >
                      {isChangingPassword && (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      )}
                      Change Password
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </TabContent>

      {/* Connected Accounts Tab Content */}
      <TabContent isActive={activeTab === "accounts"}>
        <Card className="overflow-hidden rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Link className="w-5 h-5 mr-2 text-orange-600" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add the selector at the top */}
            <PrimaryEmailSelector connectedEmails={connectedEmails} />
            
            {/* Add a separator */}
            <Separator className="my-6" />

            <div className="space-y-4">
              {/* Google Account */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <FcGoogle className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">Google Account</h4>
                      <Badge variant={emailExists ? "default" : "secondary"}>
                        {emailExists ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {emailExists 
                        ? 'Sync your emails and calendar events'
                        : 'Connect to access Google services'
                      }
                    </p>
                  </div>
                </div>
                
                {emailExists ? (
                  <AlertDialog open={isGoogleDisconnectDialogOpen} onOpenChange={setIsGoogleDisconnectDialogOpen}>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsGoogleDisconnectDialogOpen(true)}
                      disabled={isGoogleLoading}
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                          Disconnect Google Account
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Disconnecting your Google account will remove access to email synchronization, 
                          calendar integration, and other Google services. Are you sure you want to continue?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleGoogleDisconnect}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isGoogleLoading && (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          )}
                          Yes, Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    onClick={handleGoogleLogin}
                    size="sm"
                    disabled={isGoogleLoading}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Connect Account
                  </Button>
                )}
              </div>

              {/* Zoho Account */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <SiZoho className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">Zoho Account</h4>
                      <Badge variant={zohoEmailExists ? "default" : "secondary"}>
                        {zohoEmailExists ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {zohoEmailExists 
                        ? 'Sync your Zoho emails and contacts'
                        : 'Connect to access Zoho services'
                      }
                    </p>
                  </div>
                </div>
                
                {zohoEmailExists ? (
                  <AlertDialog open={isZohoDisconnectDialogOpen} onOpenChange={setIsZohoDisconnectDialogOpen}>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsZohoDisconnectDialogOpen(true)}
                      disabled={isZohoLoading}
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                          Disconnect Zoho Account
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Disconnecting your Zoho account will remove access to email synchronization, 
                          contact management, and other Zoho services. Are you sure you want to continue?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleZohoDisconnect}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isZohoLoading && (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          )}
                          Yes, Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button
                    onClick={handleZohoLogin}
                    size="sm"
                    disabled={isZohoLoading}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Connect Account
                  </Button>
                )}
              </div>

              {/* Custom Email Account */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Mail className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">Custom Email</h4>
                      <Badge variant={customEmailExists ? "default" : "secondary"}>
                        {customEmailExists ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {customEmailExists 
                        ? 'Sync your custom SMTP/IMAP email'
                        : 'Connect to use your own email server'
                      }
                    </p>
                    {customEmailExists && existingConfig && (
                      <div className="mt-2 text-xs text-gray-600">
                        <p><strong>Host:</strong> {JSON.parse(existingConfig.config).MAIL_HOST}</p>
                        <p><strong>Username:</strong> {JSON.parse(existingConfig.config).MAIL_USERNAME}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {customEmailExists ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUpdateCustomEmail}
                      disabled={isCustomEmailLoading}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Update
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleCustomEmailDisconnect}
                      disabled={isCustomEmailLoading}
                    >
                      <Unlink className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleCustomEmailConnect}
                    size="sm"
                    disabled={isCustomEmailLoading}
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Connect Account
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabContent>

      {/* Custom Email Configuration Dialog */}
      <Dialog open={isCustomEmailDialogOpen} onOpenChange={setIsCustomEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              {existingConfig ? "Update Custom Email" : "Connect Custom Email"}
            </DialogTitle>
            <DialogDescription>
              {existingConfig 
                ? "Update your custom SMTP/IMAP email server settings."
                : "Configure your custom SMTP/IMAP email server settings."
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="MAIL_HOST">SMTP Host</Label>
              <Input
                id="MAIL_HOST"
                value={customEmailConfig.MAIL_HOST}
                onChange={(e) => setCustomEmailConfig(prev => ({ ...prev, MAIL_HOST: e.target.value }))}
                placeholder="e.g., smtp.gmail.com"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="MAIL_SMTP_PORT">SMTP Port</Label>
              <Input
                id="MAIL_SMTP_PORT"
                value={customEmailConfig.MAIL_SMTP_PORT}
                onChange={(e) => setCustomEmailConfig(prev => ({ ...prev, MAIL_SMTP_PORT: e.target.value }))}
                placeholder="e.g., 587"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="MAIL_USERNAME">Username</Label>
              <Input
                id="MAIL_USERNAME"
                value={customEmailConfig.MAIL_USERNAME}
                onChange={(e) => setCustomEmailConfig(prev => ({ ...prev, MAIL_USERNAME: e.target.value }))}
                placeholder="Your email username"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="MAIL_PASSWORD">Password</Label>
              <Input
                id="MAIL_PASSWORD"
                type="password"
                value={customEmailConfig.MAIL_PASSWORD}
                onChange={(e) => setCustomEmailConfig(prev => ({ ...prev, MAIL_PASSWORD: e.target.value }))}
                placeholder="Your email password"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Encryption</Label>
              <RadioGroup
                value={customEmailConfig.MAIL_ENCRYPTION}
                onValueChange={(value) => setCustomEmailConfig(prev => ({ ...prev, MAIL_ENCRYPTION: value }))}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none">None</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ssl" id="ssl" />
                  <Label htmlFor="ssl">SSL (implicit TLS, port 465)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="tls" id="tls" />
                  <Label htmlFor="tls">TLS (STARTTLS, port 587)</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="MAIL_IMAP_PORT">IMAP Port</Label>
              <Input
                id="MAIL_IMAP_PORT"
                value={customEmailConfig.MAIL_IMAP_PORT}
                onChange={(e) => setCustomEmailConfig(prev => ({ ...prev, MAIL_IMAP_PORT: e.target.value }))}
                placeholder="e.g., 993"
                className="mt-2"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCustomEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCustomConfigSave}
              disabled={isCustomEmailLoading}
            >
              {isCustomEmailLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              {existingConfig ? "Update" : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;