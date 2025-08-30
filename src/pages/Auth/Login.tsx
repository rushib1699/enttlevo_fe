import { useNavigate } from "react-router-dom";
import { LoginRequest } from "../../types";
import { login, roleWithPermission } from "../../api";
import { useEffect, useState } from "react";
import { useApplicationContext } from "../../hooks/useApplicationContext";
import ENTTLEVO_LOGO from "@/assets/enttlevo.svg";
import LOGIN_BANNER from "@/assets/images/login-banner.png";
import { SIDE_BAR_ITEMS } from "@/components/Sidebar/items";
import { getAccessibleModules } from "../../utils/moduleAccess";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

// Form validation
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Lucide React Icons
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock,
  ArrowRight,
  Loader2
} from "lucide-react";

import { ROUTES } from "@/constants";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(2, { message: "Password is required" }),
});

type FormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { setLoginResponse } = useApplicationContext();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const [isLogging, setIsLogging] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  // Load background image
  useEffect(() => {
    const bgImage = new Image();
    bgImage.src = LOGIN_BANNER;
    bgImage.onload = () => setIsImageLoaded(true);
  }, []);

  // Reset all states when component mounts or remounts
  useEffect(() => {
    setErrorMessage("");
    setIsLogging(false);
    setShowPassword(false);
    
    form.reset({
      email: "",
      password: "",
    });
    
    form.clearErrors();
    form.setValue("email", "");
    form.setValue("password", "");
  }, []);

  const onSubmit = async (values: LoginRequest) => {
    if (isLogging) return;
    
    setIsLogging(true);
    setErrorMessage("");
    
    try {
      const response: any = await login(values);
      setLoginResponse(response);
      sessionStorage.setItem("googleEmail", response.google_email);

      // Get user permissions
      const permissionsResponse = await roleWithPermission({
        role_id: response.role_id,
        company_id: response.company_id,
      });

      // Get accessible modules
      const accessibleModules = getAccessibleModules(response, permissionsResponse);

      if (accessibleModules.length === 0) {
        throw new Error("You don't have access to any modules");
      }

      // Priority order: Sales > Onboarding > Account Management
      const priorityOrder = ['sales', 'onboarding', 'account_management'];

      // Find the highest priority module the user has access to
      let targetModule = null;
      for (const moduleName of priorityOrder) {
        if (accessibleModules.includes(moduleName)) {
          targetModule = SIDE_BAR_ITEMS.find(item => item.module === moduleName);
          if (targetModule) break;
        }
      }

      // If no priority module found, use the first available module
      if (!targetModule) {
        targetModule = SIDE_BAR_ITEMS.find(item =>
          item.module && accessibleModules.includes(item.module)
        );
      }

      if (!targetModule) {
        throw new Error("No valid module found for navigation");
      }

      // Navigate to the appropriate module
      navigate(targetModule.rootPath);
      setIsLogging(false);
    } catch (error: any) {
      setIsLogging(false);
      
      if (error.response) {
        const errorMessage = error.response.data.error;
        setErrorMessage(errorMessage);
      } else if (error.request) {
        setErrorMessage("Server connection error. Please try again later.");
        console.error("Network error - no response received:", error);
      } else {
        setErrorMessage("Login failed. Please try again.");
        console.error("Login error:", error.message || error);
      }
      
      form.reset({
        email: "",
        password: "",
      });
    }
  };

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values as LoginRequest);
  };

  // Show loading while image is loading
  if (!isImageLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center overflow-hidden relative bg-background">
      {/* Background decorative elements */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-radial from-orange-400/10 via-orange-500/5 to-transparent top-[-200px] left-[-200px] z-0" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-gradient-radial from-blue-400/10 via-blue-500/5 to-transparent bottom-[-150px] right-[-150px] z-0" />

      <div className="w-full max-w-[1400px] h-full max-h-[85%] rounded-lg overflow-hidden flex relative z-10 shadow-2xl bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full">
          {/* Left side - Form */}
          <div className="flex flex-col relative bg-background border-r border-border">
            {/* Logo */}
            <div className="absolute top-[8%] left-1/2 transform -translate-x-1/2 z-10 mb-24">
              <div className="flex flex-col items-center">
                <img
                  src={ENTTLEVO_LOGO}
                  alt="Enttlevo Logo"
                  className="h-16 w-auto md:h-16"
                />
              </div>
            </div>

            {/* Login Form */}
            <div className="flex flex-col justify-center items-center h-full px-6 md:px-8 lg:px-12 py-4">
              <div className="w-full max-w-md">
                <div className="text-center mb-8">
                  {/* <h1 className="text-3xl font-bold text-foreground mb-2">
                    Welcome Back
                  </h1> */}
                  <p className="text-muted-foreground">
                    Sign in to your Enttlevo account
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-medium">Email Address</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type="email"
                                placeholder="Enter your email"
                                className="pl-10 h-12 border-border focus:border-orange-500 focus:ring-orange-500"
                                disabled={isLogging}
                                autoComplete="email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-medium">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="pl-10 pr-10 h-12 border-border focus:border-orange-500 focus:ring-orange-500"
                                disabled={isLogging}
                                autoComplete="current-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLogging}
                                tabIndex={-1}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 font-normal text-orange-600 hover:text-orange-700"
                        onClick={() => navigate(ROUTES.RESET_PASSWORD)}
                        disabled={isLogging}
                      >
                        Forgot your password?
                      </Button>
                    </div>

                    {errorMessage && (
                      <Alert variant="destructive" className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      disabled={isLogging}
                    >
                      {isLogging ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>

          {/* Right side - Background Image */}
          <div className="hidden md:block relative overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat relative"
              style={{
                backgroundImage: `url(${LOGIN_BANNER})`
              }}
            >
              {/* Darkened overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/50 z-10" />

              {/* Content on top of image */}
              <div className="absolute bottom-10 left-10 z-20 text-white max-w-[70%]">
                <h2 className="text-4xl font-bold mb-4 text-shadow-lg">
                  Elevate Your Business
                </h2>
                <p className="text-lg leading-relaxed text-shadow-md">
                  Streamline operations, boost revenue, and enhance customer satisfaction with our comprehensive business management platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;