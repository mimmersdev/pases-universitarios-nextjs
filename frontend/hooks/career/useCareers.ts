import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "mimmers-core-nodejs";
import { Career } from "pases-universitarios";

interface UseCareersProps {
    universityId: string;
    page: number;
    size: number;
    getAll?: boolean;
}

const fetchCareers = async ({ universityId, page, size, getAll = false }: UseCareersProps): Promise<PaginationResponse<Career>> => {
    const response = await apiClient.get(`/university/${universityId}/career`, {
        params: {
            page,
            size,
            getAll
        }
    });
    return response.data;
}

export const useCareers = ({ universityId, page, size, getAll = false }: UseCareersProps) => {
    return useQuery({
        queryKey: ['careers', universityId, page, size, getAll],
        queryFn: () => fetchCareers({ universityId, page, size, getAll }),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
}