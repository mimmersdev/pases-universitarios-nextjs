import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Career, CreateCareer } from "pases-universitarios";

const createCareer = async (universityId: string, data: CreateCareer): Promise<Career> => {
    const response = await apiClient.post(`/university/${universityId}/career`, data);
    return response.data;
}

export const useCreateCareer = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateCareer) => createCareer(universityId, data),
        onSuccess: () => {
            // Invalidate and refetch careers list
            queryClient.invalidateQueries({ queryKey: ['careers', universityId] });
        },
    });
}

