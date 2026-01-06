import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const updatePassDue = async (universityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // The api-client interceptor will automatically remove Content-Type for FormData
    // so axios can set it with the correct boundary
    const response = await apiClient.post(`/university/${universityId}/pass/update-due`, formData);
    return response.data;
}

export const useUpdatePassDue = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => updatePassDue(universityId, file),
        onSuccess: () => {
            // Invalidate and refetch passes list
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });
}

