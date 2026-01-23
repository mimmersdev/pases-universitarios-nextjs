"use client";

import React, { useEffect } from "react";
import { useLoader } from "./loader-provider";
import { useAuth } from "@/frontend/hooks/auth/useAuth";
import { usePathname, useRouter } from "next/navigation";
import { useValidateUser } from "@/frontend/hooks/auth/useValidate";
import { toast } from "sonner";

interface AuthProviderProps {
    children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { setUser, logout } = useAuth();
    const validateMutation = useValidateUser();

    const { isLoading, setLoading } = useLoader();

    useEffect(() => {
        setLoading(true);

        validateMutation.mutate(undefined, {
            onError: () => {
                toast.error("Sesión Expirada", {
                    description: "Tu sesión ha expirado o es inválida. Inicia sesión nuevamente.",
                });

                logout();
                router.replace("/auth/login");
            },
            onSuccess: (user) => {
                setUser(user);
            },
            onSettled: () => {
                setLoading(false);
            },
        });
    }, [pathname]);

    if (isLoading === false) {
        return <>{children}</>;
    }

    return null;
}
