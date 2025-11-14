import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { City } from "pases-universitarios";

const fetchCity = async (universityId: string, code: string): Promise<City> => {
    const response = await apiClient.get(`/university/${universityId}/city/${encodeURIComponent(code)}`);
    return response.data;
}

export const useCity = (universityId: string, code: string) => {
    return useQuery({
        queryKey: ['city', universityId, code],
        queryFn: () => fetchCity(universityId, code),
    });
}