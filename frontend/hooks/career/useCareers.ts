import apiClient from "@/app/api-client";
import { CareerPaginationRequest } from "@/domain/FilteredPagination";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "mimmers-core-nodejs";
import { Career } from "pases-universitarios";

const fetchCareers = async (universityId: string, pRequest: CareerPaginationRequest, getAll?: boolean): Promise<PaginationResponse<Career>> => {
    const response = await apiClient.get(`/university/${universityId}/career`, {
        params: {
            page: pRequest.page,
            size: pRequest.size,
            sortCode: pRequest.sortCode,
            sortName: pRequest.sortName,
            sortCreatedAt: pRequest.sortCreatedAt,
            sortUpdatedAt: pRequest.sortUpdatedAt,
            searchName: pRequest.searchName,
            getAll
        }
    });
    return response.data;
}

export const useCareers = (universityId: string, pRequest: CareerPaginationRequest, getAll?: boolean) => {
    return useQuery({
        queryKey: [
            'careers',
            universityId,
            pRequest.page,
            pRequest.size,
            pRequest.sortCode,
            pRequest.sortName,
            pRequest.sortCreatedAt,
            pRequest.sortUpdatedAt,
            pRequest.searchName,
            getAll
        ],
        queryFn: () => fetchCareers(universityId, pRequest, getAll),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
}

// Infinite query hook for infinite scrolling
export const useInfiniteCareers = (
    universityId: string,
    baseRequest: Omit<CareerPaginationRequest, 'page'>,
    getAll?: boolean
) => {
    return useInfiniteQuery({
        queryKey: [
            'careers',
            'infinite',
            universityId,
            baseRequest.size,
            baseRequest.sortCode,
            baseRequest.sortName,
            baseRequest.sortCreatedAt,
            baseRequest.sortUpdatedAt,
            baseRequest.searchName,
            getAll
        ],
        queryFn: ({ pageParam = 0 }) => 
            fetchCareers(universityId, { ...baseRequest, page: pageParam }, getAll),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            // Check if there are more pages
            const totalPages = Math.ceil(lastPage.total / lastPage.size);
            const currentPage = allPages.length - 1;
            
            // Return next page number if there are more pages, otherwise undefined
            return currentPage + 1 < totalPages ? currentPage + 1 : undefined;
        },
        placeholderData: (previousData) => previousData, // Keep previous data while fetching
    });
}