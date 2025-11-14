import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { University, UpdateUniversity } from "pases-universitarios";

interface UseUpdateUniversityProps {
    id: string;
    data: UpdateUniversity;
}

const updateUniversity = async ({ id, data }: UseUpdateUniversityProps): Promise<University> => {
    const response = await apiClient.put(`/university/${id}`, data);
    return response.data;
}

export const useUpdateUniversity = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateUniversity) => updateUniversity({ id, data }),
        onSuccess: () => {
            // Invalidate and refetch universities list
            queryClient.invalidateQueries({ queryKey: ['universities'] });
            queryClient.invalidateQueries({ queryKey: ['university', id] });
        },
        onError: (error) => {
            console.error(error);
        },
    });
}