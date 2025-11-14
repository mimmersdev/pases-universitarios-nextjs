import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { City, UpdateCity } from "pases-universitarios";

interface UseUpdateCityProps {
    universityId: string;
    code: string;
    data: UpdateCity;
}

const updateCity = async ({ universityId, code, data }: UseUpdateCityProps): Promise<City> => {
    const response = await apiClient.put(`/university/${universityId}/city/${encodeURIComponent(code)}`, data);
    return response.data;
}

export const useUpdateCity = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ code, data }: UseUpdateCityProps) => updateCity({ universityId, code, data }),
        onSuccess: () => {
            // Invalidate and refetch cities list
            queryClient.invalidateQueries({ queryKey: ['cities', universityId] });
        },
        onError: (error) => {
            console.error(error);
        },
    });
}