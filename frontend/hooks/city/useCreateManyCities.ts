import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateManyCities } from "pases-universitarios";

const createManyCities = async (universityId: string, data: CreateManyCities): Promise<number> => {
    const response = await apiClient.post(`/university/${universityId}/city/many`, data);
    return response.data;
}

export const useCreateManyCities = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateManyCities) => createManyCities(universityId, data),
        onSuccess: () => {
            // Invalidate and refetch cities list
            queryClient.invalidateQueries({ queryKey: ['cities', universityId] });
        },
    });
}