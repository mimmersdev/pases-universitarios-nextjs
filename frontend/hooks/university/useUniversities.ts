import apiClient from "@/app/api-client";
import { UniversityPaginationRequest } from "@/domain/FilteredPagination";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "mimmers-core-nodejs";
import { University } from "pases-universitarios";

const fetchUniversities = async (pRequest: UniversityPaginationRequest): Promise<PaginationResponse<University>> => {
    const response = await apiClient.get('/university', {
        params: {
            page: pRequest.page,
            size: pRequest.size,
            sortName: pRequest.sortName,
            sortCreatedAt: pRequest.sortCreatedAt,
            sortUpdatedAt: pRequest.sortUpdatedAt
        }
    });
    return response.data;
}

export const useUniversities = (pRequest: UniversityPaginationRequest) => {
    return useQuery({
        queryKey: [
            'universities',
            pRequest.page,
            pRequest.size,
            pRequest.sortName,
            pRequest.sortCreatedAt,
            pRequest.sortUpdatedAt
        ],
        queryFn: () => fetchUniversities(pRequest),
        placeholderData: (previousData) => previousData,
    });
}