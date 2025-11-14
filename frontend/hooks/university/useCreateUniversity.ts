import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateUniversity, University } from "pases-universitarios";

const createUniversity = async (data: CreateUniversity): Promise<University> => {
    const response = await apiClient.post('/university', data);
    return response.data;
}

export const useCreateUniversity = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: (data: CreateUniversity) => createUniversity(data),
        onSuccess: () => {
            // Invalidate and refetch universities list
            queryClient.invalidateQueries({ queryKey: ['universities'] });
        },
    });
}