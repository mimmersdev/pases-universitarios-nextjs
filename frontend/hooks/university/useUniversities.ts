import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "mimmers-core-nodejs";
import { University } from "pases-universitarios";

interface UseUniversitiesProps {
    page: number;
    size: number;
}

const fetchUniversities = async ({ page, size }: UseUniversitiesProps): Promise<PaginationResponse<University>> => {
    const response = await apiClient.get('/university', {
        params: {
            page,
            size
        }
    });
    return response.data;
}

export const useUniversities = ({ page, size }: UseUniversitiesProps) => {
    return useQuery({
        queryKey: ['universities', page, size],
        queryFn: () => fetchUniversities({ page, size }),
        placeholderData: (previousData) => previousData,
    });
}