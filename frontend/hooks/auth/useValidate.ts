import { User } from "pases-universitarios";
import apiClient from "@/app/api-client";
import { useMutation } from "@tanstack/react-query";

const BASE_URL = "/auth/validate";

const validateUser = async (): Promise<User> => {
    const response = await apiClient.post(BASE_URL);
    return response.data;
};

export const useValidateUser = () => {
    return useMutation({
        mutationFn: validateUser,
    });
};
