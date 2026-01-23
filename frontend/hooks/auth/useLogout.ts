import apiClient from "@/app/api-client";
import { useMutation } from "@tanstack/react-query";

const BASE_URL = "/auth/logout";

const logout = async (): Promise<void> => {
    const response = await apiClient.post(BASE_URL);
    return response.data;
};

export const useLogout = () => {
    return useMutation({
        mutationFn: logout,
    });
};
