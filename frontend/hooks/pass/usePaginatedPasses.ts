import apiClient from "@/app/api-client";
import { FilteredPaginationRequest } from "@/domain/FilteredPagination";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "mimmers-core-nodejs";
import { Pass } from "pases-universitarios";

const fetchPaginatedPasses = async (universityId: string, pRequest: FilteredPaginationRequest): Promise<PaginationResponse<Pass>> => {
    const response = await apiClient.post(`/university/${universityId}/pass/paginated`, pRequest);
    return response.data;
}

export const usePaginatedPasses = (universityId: string, pRequest: FilteredPaginationRequest) => {
    return useQuery({
        queryKey: ['passes', 'paginated', pRequest],
        queryFn: () => fetchPaginatedPasses(universityId, pRequest),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
}

