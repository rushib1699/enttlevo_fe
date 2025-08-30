import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Menu, MoveRight, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {SESSION_COOKIE_NAME } from "@/constants";

export const Navbar = () => {
    const navigationItems = [
        {
            title: "Home",
            href: "/",
            description: "",
        },
    ];

    const [isOpen, setOpen] = useState(false);
    const navigate = useNavigate();
    
    const isLoggedIn = () => {
        return !!localStorage.getItem(SESSION_COOKIE_NAME);
    };

    const handleAuthNavigation = (path: string) => {
        if (isLoggedIn() && path === '/dashboard') {
            navigate('/dashboard');
        } else if (!isLoggedIn() && (path === '/signin' || path === '/login')) {
            navigate(path);
        }
    };

    return (
        <header className="w-full z-40 fixed top-0 left-0 bg-background">
            <div className="container max-w-7xl relative mx-auto min-h-20 flex gap-4 flex-row lg:grid lg:grid-cols-3 items-center">
                <div className="justify-start items-center gap-4 lg:flex hidden flex-row">
                    <NavigationMenu className="flex justify-start items-start">
                        <NavigationMenuList className="flex justify-start gap-4 flex-row">
                            {navigationItems.map((item) => (
                                <NavigationMenuItem key={item.title}>
                                    {item.href ? (
                                        <>
                                            <NavigationMenuLink>
                                                <Button variant="ghost">{item.title}</Button>
                                            </NavigationMenuLink>
                                        </>
                                    ) : (
                                        <>
                                            <NavigationMenuTrigger className="font-medium text-sm">
                                                {item.title}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="!w-[450px] p-4">
                                                <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                                                    <div className="flex flex-col h-full justify-between">
                                                        <div className="flex flex-col">
                                                            <p className="text-base">{item.title}</p>
                                                            <p className="text-muted-foreground text-sm">
                                                                {item.description}
                                                            </p>
                                                        </div>
                                                        <Button size="sm" className="mt-10">
                                                            Book a call today
                                                        </Button>
                                                    </div>
                                                </div>
                                            </NavigationMenuContent>
                                        </>
                                    )}
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>
                <div className="flex lg:justify-center">
                    <p className="font-semibold">TWBlocks</p>
                </div>
                <div className="flex justify-end w-full gap-4">
                    {isLoggedIn() ? (
                        <Button 
                            onClick={() => handleAuthNavigation('/dashboard')}
                        >
                            Dashboard
                        </Button>
                    ) : (
                        <>
                            <Button 
                                variant="outline"
                                onClick={() => handleAuthNavigation('/signin')}
                            >
                                Sign in
                            </Button>
                            <Button
                                onClick={() => handleAuthNavigation('/login')}
                            >
                                Login
                            </Button>
                        </>
                    )}
                </div>
                <div className="flex w-12 shrink lg:hidden items-end justify-end">
                    <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
                        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                    {isOpen && (
                        <div className="absolute top-20 border-t flex flex-col w-full right-0 bg-background shadow-lg py-4 container gap-8">
                            {navigationItems.map((item) => (
                                <div key={item.title}>
                                    <div className="flex flex-col gap-2">
                                        {item.href ? (
                                            <Link
                                                to={item.href}
                                                className="flex justify-between items-center"
                                            >
                                                <span className="text-lg">{item.title}</span>
                                                <MoveRight className="w-4 h-4 stroke-1 text-muted-foreground" />
                                            </Link>
                                        ) : (
                                            <p className="text-lg">{item.title}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};