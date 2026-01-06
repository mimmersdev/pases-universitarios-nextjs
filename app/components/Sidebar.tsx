"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"
import { IconDashboard, IconBuildings } from "@tabler/icons-react"

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const routes = [
        {
            label: "Dashboard",
            icon: IconDashboard,
            href: "/internal/dashboard",
        },
        {
            label: "Universidades",
            icon: IconBuildings,
            href: "/internal/universities",
        }
    ];

    const router = useRouter();
    const pathname = usePathname();
    const isActive = (href: string) => {
        // Special case for root path - must match exactly
        if (href === '/') {
            return pathname === '/';
        }
        // For other paths, check if pathname starts with href followed by '/' or end of string
        // This prevents partial matches (e.g., /university matching /universities)
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <div className="flex h-full overflow-hidden">
            <aside className="w-70 h-screen fixed left-0 top-0 border-r border-divider bg-background z-10 overflow-y-auto">
                <div className="flex items-center justify-start mb-6 border-b border-divider border-dashed">
                    <img src="/logo.svg" alt="logo" className="w-50 h-auto p-4 " />
                </div>

                <div className="flex flex-col gap-2 px-4">
                    {routes.map((route) => (
                        <Button key={route.href} variant={isActive(route.href) ? "default" : "outline"} onClick={() => router.push(route.href)}>
                            <route.icon />
                            {route.label}
                        </Button>
                    ))}
                </div>
            </aside>
            <main className="flex-1 ml-[280px] h-screen overflow-y-auto">
                {children}
            </main>
        </div>

    );
}