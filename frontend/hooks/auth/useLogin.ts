import apiClient from "@/app/api-client";
import { useMutation } from "@tanstack/react-query";
import { loginUser, User } from "pases-universitarios";
import { z } from "zod/v4";

const BASE_URL = "/auth/login";

type LoginRequest = z.infer<typeof loginUser>;

const login = async (data: LoginRequest): Promise<User> => {
    const response = await apiClient.post(BASE_URL, data);
    return response.data;
};

export const useLogin = () => {
    return useMutation({
        mutationFn: login,
    });
};
