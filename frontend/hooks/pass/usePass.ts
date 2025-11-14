import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { Pass } from "pases-universitarios";

const fetchPass = async (universityId: string, uniqueIdentifier: string, careerCode: string): Promise<Pass> => {
    const response = await apiClient.get(
        `/university/${universityId}/pass/${encodeURIComponent(uniqueIdentifier)}/${encodeURIComponent(careerCode)}`
    );
    return response.data;
}

export const usePass = (universityId: string, uniqueIdentifier: string, careerCode: string) => {
    return useQuery({
        queryKey: ['pass', universityId, uniqueIdentifier, careerCode],
        queryFn: () => fetchPass(universityId, uniqueIdentifier, careerCode),
        enabled: !!universityId && !!uniqueIdentifier && !!careerCode, // Only fetch if all params exist
    });
}

