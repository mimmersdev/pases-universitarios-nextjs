import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "mimmers-core-nodejs";
import { City } from "pases-universitarios";

interface UseCitiesProps {
    universityId: string;
    page: number;
    size: number;
    getAll?: boolean;
}

const fetchCities = async ({ universityId, page, size, getAll = false }: UseCitiesProps): Promise<PaginationResponse<City>> => {
    const response = await apiClient.get(`/university/${universityId}/city`, {
        params: {
            page,
            size,
            getAll
        }
    });
    return response.data;
}

export const useCities = ({ universityId, page, size, getAll = false }: UseCitiesProps) => {
    return useQuery({
        queryKey: ['cities', universityId, page, size, getAll],
        queryFn: () => fetchCities({ universityId, page, size, getAll }),
        placeholderData: (previousData) => previousData,
    });
}