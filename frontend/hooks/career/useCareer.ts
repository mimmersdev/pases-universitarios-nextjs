import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { Career } from "pases-universitarios";

const fetchCareer = async (universityId: string, code: string): Promise<Career> => {
    const response = await apiClient.get(`/university/${universityId}/career/${encodeURIComponent(code)}`);
    return response.data;
}

export const useCareer = (universityId: string, code: string) => {
    return useQuery({
        queryKey: ['career', universityId, code],
        queryFn: () => fetchCareer(universityId, code),
    });
}