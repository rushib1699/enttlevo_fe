import { useEffect, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { 
  AlignJustify, 
  ChevronDown, 
  X,
  Bell,
  LogOut,
  ChevronRight,
  Settings,
  Loader2,
  Calendar,
} from "lucide-react"
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SIDE_BAR_ITEMS } from "@/components/Sidebar/items"
import { logout, getNotificationsbyUserId } from "@/api";
import { jwtDecode } from "jwt-decode";
import { ROUTES, COMPANY_PERMISSION_SESSION_KEY } from "@/constants";
import { useUserPermission } from "@/context/UserPermissionContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import ENTTLEVO_LOGO_SMALL from "@/assets/enttlevo.svg"

interface Notification {
  id: number;
  activity: string;
  date: string;
  time: string;
  type: string;
  description: string;
  lead_name: string;
  is_complete: number;
}

export default function DashboardLayout() {
  const { hasAccess } = useUserPermission();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation()
  const { loginResponse, logoutUser } = useApplicationContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const navigate = useNavigate();

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? []
        : [title]
    )
  }

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutModal(true);
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (!loginResponse) {
        navigate(ROUTES.HOME);
        setIsLoggingOut(false);
        setShowLogoutModal(false);
        return;
      }

      // get login time from token
      const decodedToken = jwtDecode(loginResponse?.token);
      const loginTimeStamp = new Date(decodedToken?.iat * 1000).toISOString();
      const logOutTimeStamp = new Date().toISOString();
      
      // duration in HH:MM:SS
      const duration = new Date(logOutTimeStamp).getTime() - new Date(loginTimeStamp).getTime();
      const durationInMinutes = duration / 60000;
      const durationInHours = durationInMinutes / 60;
      const durationInSeconds = durationInMinutes * 60;

      const durationString = `${Math.floor(durationInHours)}:${Math.floor(durationInMinutes)}:${Math.floor(durationInSeconds)}`;

      await logout({ 
        userId: loginResponse?.id,
        username: loginResponse.username,
        time: durationString,
        loginTimeStamp: loginTimeStamp,
        logOutTimeStamp: logOutTimeStamp
      });
      logoutUser();
      window.location.href = ROUTES.HOME;
    } catch (error) {
      // handle error appropriately
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // get notifications
  const getNotifications = async () => {
    try {
      const response = await getNotificationsbyUserId({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0
      });
      setNotifications(response);
      setNotificationsCount(response.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }

  useEffect(() => {
    getNotifications();
  }, [loginResponse]);

  // close the sidebar on sales/account
  useEffect(() => {
    if (
      location.pathname.includes('sales/account/') || 
      location.pathname.includes('onboarding/account/') || 
      location.pathname.includes('account-management/account/') || 
      location.pathname.includes('integrations/email-builder') ||
      location.pathname.includes('integrations/workflows/') ||
      location.pathname.includes('integrations/email-campaigns')
    ) {
      setIsSidebarOpen(false);
      setIsCollapsed(true);
    }
  }, [location.pathname]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const showHeader = !location.pathname.includes('integrations/workflows/');

  const handleViewAllNotifications = () => {
    navigate('/notification');
  };

  // Add permission filtering logic
  const filteredSideBarItems = SIDE_BAR_ITEMS
    .map(item => {
      // Get company permissions from session storage
      const companyPermissions = JSON.parse(sessionStorage.getItem(COMPANY_PERMISSION_SESSION_KEY) || '[]');
      
      // First check company level permissions
      if (item.module) {
        const hasCompanyAccess = companyPermissions.some(
          (permission: { permission_name: string; is_active: number }) => 
            permission.permission_name.toLowerCase() === item.module?.toLowerCase() && 
            permission.is_active === 1
        );

        // If company doesn't have access, hide the module
        if (!hasCompanyAccess) {
          return null;
        }
      }

      // Then check user level permissions
      if (hasAccess('superadmin')) {
        return item;
      }
      
      if (item.module) {
        const hasModuleAccess = hasAccess(item.module);
        // Return null instead of disabling to hide the item
        return hasModuleAccess ? item : null;
      }

      return item;
    })
    .filter(Boolean); // Remove null items

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden bg-white shadow-lg"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X className="w-4 h-4" /> : <AlignJustify className="w-4 h-4" />}
      </Button>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              This will end your current session and you'll need to log in again to access the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
              {isLoggingOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                'Logout'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16 bg-[#474258]' : 'w-64 bg-white'} border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-all duration-300 ease-in-out z-30 shadow-lg`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isCollapsed ? 'border-gray-500' : 'border-gray-200'}`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <img src={ENTTLEVO_LOGO_SMALL} alt="Enttlevo Logo" className="ml-4 w-26 h-8" />
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={`hidden md:flex ${isCollapsed ? 'hover:bg-gray-600 text-white' : 'hover:bg-gray-100'}`}
          >
            <AlignJustify className="w-4 h-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <TooltipProvider>
            {filteredSideBarItems.map((item, index) => {
              const IconComponent = item?.icon
              const isActive = location.pathname === item?.rootPath || 
                             (item?.subRoutes && item?.subRoutes.some(route => location.pathname === route.childPath))
              const isExpanded = expandedItems.includes(item?.title || '')
              
              if (!IconComponent) {
                return null;
              }

              return (
                <div key={index}>
                  {isCollapsed ? (
                    // Collapsed Sidebar - Dark theme with white text/icons
                    item?.subRoutes ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="relative">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={`w-full justify-center px-2 h-12 transition-colors ${
                                    isActive
                                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                                      : 'text-white hover:bg-gray-600'
                                  }`}
                                >
                                  <IconComponent className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="pointer-events-none">
                                <p className="text-base font-medium">{item.title}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          side="right" 
                          align="start" 
                          className="min-w-48 max-w-48 w-48"
                          sideOffset={8}
                          onCloseAutoFocus={(e) => e.preventDefault()}
                        >
                          {/* Main item in dropdown */}
                          <DropdownMenuItem
                            className={`cursor-pointer ${
                              location.pathname === item.rootPath
                                ? 'bg-orange-50 text-orange-600 focus:bg-orange-50'
                                : 'text-gray-600 focus:bg-gray-50 focus:text-gray-900'
                            }`}
                            onClick={() => navigate(item.rootPath)}
                          >
                            <IconComponent className="w-4 h-4 mr-3" />
                            <span className="font-medium text-sm">{item?.title}</span>
                          </DropdownMenuItem>
                          
                          {/* Separator */}
                          <DropdownMenuSeparator />
                          
                          {/* Subroutes */}
                          {item?.subRoutes?.map((subRoute, subIndex) => {
                            const SubIconComponent = subRoute?.childIcon
                            const isSubActive = location?.pathname === subRoute?.childPath
                            
                            if (!SubIconComponent) {
                              return null;
                            }

                            return (
                              <DropdownMenuItem
                                key={subIndex}
                                className={`cursor-pointer ${
                                  isSubActive
                                    ? 'bg-orange-50 text-orange-600 focus:bg-orange-50'
                                    : 'text-gray-600 focus:bg-gray-50 focus:text-gray-900'
                                }`}
                                onClick={() => navigate(subRoute?.childPath || '')}
                              >
                                <SubIconComponent className="w-4 h-4 mr-3" />
                                <span className="font-medium text-sm truncate">{subRoute?.name}</span>
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      // Regular main item without subroutes - Dark theme
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`w-full justify-center px-2 h-12 transition-colors ${
                              isActive
                                ? 'bg-orange-500 text-white hover:bg-orange-600'
                                : 'text-white hover:bg-gray-600'
                            }`}
                            onClick={() => navigate(item?.rootPath || '')}
                          >
                            <IconComponent className="w-5 h-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="pointer-events-none">
                          <p className="text-base font-medium">{item?.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  ) : (
                    // Expanded Sidebar - Original light theme
                    <>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start h-10 px-3 transition-colors ${
                          isActive
                            ? 'bg-[#FF8000] text-white hover:text-white border-orange-800 hover:bg-[#e07100]'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => {
                          if (item?.subRoutes) {
                            toggleExpand(item?.title);
                          } else {
                            navigate(item?.rootPath);
                          }
                        }}
                      >
                        <IconComponent className="w-5 h-5 mr-3" />
                        <span className="font-medium flex-1 text-left text-base">{item?.title}</span>
                        {item?.subRoutes && (
                          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </Button>
                      
                      {item?.subRoutes && isExpanded && (
                        <div className="ml-4 mt-1 space-y-1">
                          {item?.subRoutes.map((subRoute, subIndex) => {
                            const SubIconComponent = subRoute?.childIcon
                            const isSubActive = location.pathname === subRoute?.childPath
                            
                            if (!SubIconComponent) {
                              return null;
                            }

                            return (
                              <Button
                                key={subIndex}
                                variant="ghost"
                                className={`w-full justify-start h-10 px-3 transition-colors ${
                                  isSubActive
                                    ? 'bg-[#474258] text-white hover:text-white border-orange-800 hover:bg-[#3d394c]'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                                onClick={() => navigate(subRoute.childPath)}
                              >
                                <SubIconComponent className="w-4 h-4 mr-3" />
                                <span className="font-medium text-base">{subRoute.name}</span>
                              </Button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </TooltipProvider>
        </nav>

        {/* User Profile */}
        <div className={`p-4 border-t ${isCollapsed ? 'border-gray-500' : 'border-gray-200'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className={`w-full ${isCollapsed ? 'justify-center px-0 hover:bg-gray-600' : 'justify-start hover:bg-gray-50'} h-12`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-base">
                      {loginResponse?.first_name?.charAt(0) || 'E'}
                    </span>
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 text-base truncate">
                          {loginResponse?.first_name + " " + loginResponse?.last_name || 'admin@enttlevo.com'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{loginResponse?.role_id || 'Admin'}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem className="cursor-default">
                <div className="flex flex-col space-y-1">
                  <p className="font-medium">{loginResponse?.first_name + " " + loginResponse?.last_name}</p>
                  <p className="text-sm text-gray-500">{loginResponse?.email}</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings/profile')} className="text-gray-700 focus:text-gray-900 text-base">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogoutConfirm} className="text-red-600 focus:text-red-600 text-base">
                {isLoggingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        {showHeader && (
          <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900 md:ml-0 ml-12">
                  {location.pathname === '/' ? 'Dashboard' : 
                    SIDE_BAR_ITEMS.reduce((acc, item) => {
                      if (item?.rootPath === location.pathname) return item?.title
                      if (item?.subRoutes) {
                        const subRoute = item?.subRoutes.find(sub => sub?.childPath === location.pathname)
                        if (subRoute) return subRoute?.name
                      }
                      return acc
                    }, 'Dashboard')
                  }
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="w-5 h-5 text-gray-600" />
                      {notificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                          {notificationsCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications?.length > 0 ? (
                        <>
                          {notifications?.slice(0, 3).reverse().map((notification) => (
                            <div key={notification?.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-full">
                                  <Calendar className="w-4 h-4 text-blue-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification?.type} with {notification?.lead_name}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {notification?.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <p className="text-xs text-gray-400">
                                      {formatDate(notification?.date)} at {formatTime(notification?.time)}
                                    </p>
                                    {!notification?.is_complete && (
                                      <span className="px-2 py-1 text-xs font-medium bg-yellow-50 text-yellow-800 rounded-full">
                                        Pending
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {notifications.length > 1 && (
                            <div className="p-4 text-center">
                              <Button 
                                variant="ghost" 
                                className="text-blue-600 hover:text-blue-700"
                                onClick={handleViewAllNotifications}
                              >
                                View All Notifications
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="p-2 w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  )
}