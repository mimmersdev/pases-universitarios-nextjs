import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Career, UpdateCareer } from "pases-universitarios";

interface UseUpdateCareerProps {
    universityId: string;
    code: string;
    data: UpdateCareer;
}

const updateCareer = async ({ universityId, code, data }: UseUpdateCareerProps): Promise<Career> => {
    const response = await apiClient.put(`/university/${universityId}/career/${encodeURIComponent(code)}`, data);
    return response.data;
}

export const useUpdateCareer = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ code, data }: UseUpdateCareerProps) => updateCareer({ universityId, code, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['careers', universityId] });
        },
        onError: (error) => {
            console.error(error);
        },
    });
}
