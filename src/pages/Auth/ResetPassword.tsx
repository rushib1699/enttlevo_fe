import { requestResetPassword, forgotPassword } from "@/api";
import { ROUTES } from "@/constants";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, Lock, CheckCircle } from "lucide-react";
import ENTTLEVO_LOGO from "@/assets/enttlevo.svg";

// Schema for requesting password reset (email only)
const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Schema for resetting password with token
const passwordResetSchema = z.object({
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type RequestResetFormValues = z.infer<typeof requestResetSchema>;
type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogging, setIsLogging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get uid and token from URL parameters
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');
  const isPasswordReset = uid && token; // If we have both uid and token, show password reset form

  // Form for requesting password reset
  const requestForm = useForm<RequestResetFormValues>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: "",
    },
  });

  // Form for resetting password with token
  const resetForm = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  // Reset states on component mount
  useEffect(() => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsLogging(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, []);

  // Handle requesting password reset
  const onRequestReset = async (values: RequestResetFormValues) => {
    try {
      setIsLogging(true);
      setErrorMessage("");
      setSuccessMessage("");
      await requestResetPassword({
        email: values.email,
      });
      setSuccessMessage("Password reset link has been sent to your email address");
    } catch (error) {
      console.log(error);
      setErrorMessage("Failed to send reset link. Please try again.");
    } finally {
      setIsLogging(false);
    }
  };

  // Handle password reset with token
  const onPasswordReset = async (values: PasswordResetFormValues) => {
    try {
      setIsLogging(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      await forgotPassword({
        uid: parseInt(uid!),
        token: token!,
        new_password: values.new_password,
      });
      
      setSuccessMessage("Password has been reset successfully! You can now login with your new password.");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate(ROUTES.HOME);
      }, 3000);
    } catch (error: any) {
      console.log(error);
      if (error.response?.status === 400) {
        setErrorMessage("Invalid or expired reset link. Please request a new password reset.");
      } else {
        setErrorMessage("Failed to reset password. Please try again.");
      }
    } finally {
      setIsLogging(false);
    }
  };

  // Validate token on component mount
  useEffect(() => {
    if (isPasswordReset) {
      // Validate that uid is a number
      if (isNaN(parseInt(uid!))) {
        setErrorMessage("Invalid reset link. Please check the URL and try again.");
      }
    }
  }, [uid, token, isPasswordReset]);

  return (
    <div className="min-h-screen h-screen grid lg:grid-cols-2 overflow-hidden">
      {/* Left Side - Reset Password Form */}
      <div className="flex flex-col gap-8 p-6 md:p-12 lg:p-16 bg-background h-full">
        {/* Logo Section */}
        <div className="flex justify-center md:justify-start flex-shrink-0">
          <a href="#" className="flex items-center gap-3 group">
            <img src={ENTTLEVO_LOGO} alt="Enttlevo Logo" className="w-26 h-12" />
          </a>
        </div>

        {/* Form Section */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[400px] space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                {isPasswordReset ? "Set New Password" : "Reset Password"}
              </h1>
              <p className="text-muted-foreground">
                {isPasswordReset 
                  ? "Enter your new password below" 
                  : "Enter your email address and we'll send you a link to reset your password"
                }
              </p>
            </div>

            {!isPasswordReset ? (
              // Request password reset form
              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-4">
                  <FormField
                    control={requestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter your email address"
                              className="pl-10"
                              disabled={isLogging}
                              autoComplete="email"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLogging}
                  >
                    {isLogging ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              // Password reset form with token
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onPasswordReset)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="new_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your new password"
                              className="pl-10 pr-10"
                              disabled={isLogging}
                              autoComplete="new-password"
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
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirm_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your new password"
                              className="pl-10 pr-10"
                              disabled={isLogging}
                              autoComplete="new-password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={isLogging}
                              tabIndex={-1}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLogging}
                  >
                    {isLogging ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}

            {/* Error and Success messages */}
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <Button
                variant="link"
                className="text-muted-foreground hover:text-primary"
                onClick={() => navigate(ROUTES.HOME)}
                disabled={isLogging}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground flex-shrink-0">
          © 2025 Enttlevo. All rights reserved.
        </div>
      </div>

      {/* Right Side - Security Info */}
      <div className="relative hidden lg:block bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative h-full p-16 flex flex-col justify-center max-w-2xl mx-auto overflow-y-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-bold tracking-tight">
                Secure password recovery
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We take your account security seriously. Follow our secure process to reset your password safely.
              </p>
            </div>
            
            {/* Security Features */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Email Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll send a secure reset link to your registered email address
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Secure Token</h3>
                  <p className="text-sm text-muted-foreground">
                    Reset links are encrypted and expire after a short time for security
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="p-3 rounded-lg bg-primary/10">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Strong Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Your new password must meet our security requirements
                  </p>
                </div>
              </div>
            </div>

            {/* Security Tips */}
            <div className="pl-6 pr-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
              <h4 className="font-semibold mb-3">Security Tips</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use a unique password that you don't use elsewhere</li>
                <li>• Include uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid personal information in your password</li>
                <li>• Consider using a password manager</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
