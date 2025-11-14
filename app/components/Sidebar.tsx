"use client";

import { Button } from "@heroui/react";
import { ChartBarSquareIcon } from "@heroicons/react/24/solid";
import { BuildingOfficeIcon } from "@heroicons/react/24/solid";
import { DocumentDuplicateIcon } from "@heroicons/react/24/solid";
import { usePathname, useRouter } from "next/navigation";
import { GlobeAltIcon } from "@heroicons/react/24/solid";

export const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const routes = [
        {
            label: "Dashboard",
            icon: ChartBarSquareIcon,
            href: "/",
        },
        {
            label: "Universidades",
            icon: BuildingOfficeIcon,
            href: "/universities",
        },
        // {
        //     label: "Ciudades",
        //     icon: GlobeAltIcon,
        //     href: "/cities",
        // },
        // {
        //     label: "Carreras",
        //     icon: BuildingOfficeIcon,
        //     href: "/careers",
        // },
        // {
        //     label: "Pases",
        //     icon: DocumentDuplicateIcon,
        //     href: "/passes",
        // }
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
        <div className="flex h-screen">
            <div className="w-70 h-full border-r border-gray-200">
                <img src="/vercel.svg" alt="logo" width={100} height={100} />
                <div className="flex flex-col gap-2 px-4">
                    {routes.map((route) => (
                        <Button size="lg" style={{ justifyContent: "flex-start" }} key={route.href} variant={isActive(route.href) ? "solid" : "light"} color="primary" startContent={<route.icon className="w-6 h-6" />} onClick={() => router.push(route.href)}>
                            {route.label}
                        </Button>
                    ))}
                </div>
            </div>
            <div className="flex-1">
                {children}
            </div>
        </div>

    );
}