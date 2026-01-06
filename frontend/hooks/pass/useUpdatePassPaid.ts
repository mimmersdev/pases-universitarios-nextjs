import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const updatePassPaid = async (universityId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // The api-client interceptor will automatically remove Content-Type for FormData
    // so axios can set it with the correct boundary
    const response = await apiClient.post(`/university/${universityId}/pass/update-paid`, formData);
    return response.data;
}

export const useUpdatePassPaid = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => updatePassPaid(universityId, file),
        onSuccess: () => {
            // Invalidate and refetch passes list
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });
}

