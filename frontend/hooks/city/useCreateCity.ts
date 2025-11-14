import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { City, CreateCity } from "pases-universitarios";

const createCity = async (universityId: string, data: CreateCity): Promise<City> => {
    const response = await apiClient.post(`/university/${universityId}/city`, data);
    return response.data;
}

export const useCreateCity = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCity) => createCity(universityId, data),
        onSuccess: () => {
            // Invalidate and refetch cities list
            queryClient.invalidateQueries({ queryKey: ['cities', universityId] });
        },
    });
}