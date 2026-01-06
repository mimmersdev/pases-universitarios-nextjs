import apiClient from "@/app/api-client";
import { PassPaginationRequest } from "@/domain/FilteredPagination";
import { useQuery } from "@tanstack/react-query";
import { PaginationResponse } from "mimmers-core-nodejs";
import { Pass } from "pases-universitarios";

const fetchPaginatedPasses = async (universityId: string, pRequest: PassPaginationRequest): Promise<PaginationResponse<Pass>> => {
    const params: Record<string, any> = {
        page: pRequest.page,
        size: pRequest.size,
    };

    // Include/Exclude filters
    if (pRequest.career) {
        params.careerType = pRequest.career.type;
        params.careerValues = pRequest.career.values;
    }
    if (pRequest.semester) {
        params.semesterType = pRequest.semester.type;
        params.semesterValues = pRequest.semester.values;
    }
    if (pRequest.paymentStatus) {
        params.paymentStatusType = pRequest.paymentStatus.type;
        params.paymentStatusValues = pRequest.paymentStatus.values;
    }
    if (pRequest.studentStatus) {
        params.studentStatusType = pRequest.studentStatus.type;
        params.studentStatusValues = pRequest.studentStatus.values;
    }
    if (pRequest.passStatus) {
        params.passStatusType = pRequest.passStatus.type;
        params.passStatusValues = pRequest.passStatus.values;
    }

    // Range filters
    if (pRequest.enrollmentYear) {
        params.enrollmentYearMin = pRequest.enrollmentYear.min;
        params.enrollmentYearMax = pRequest.enrollmentYear.max;
    }
    if (pRequest.totalToPay) {
        params.totalToPayMin = pRequest.totalToPay.min;
        params.totalToPayMax = pRequest.totalToPay.max;
    }
    if (pRequest.cashback) {
        params.cashbackMin = pRequest.cashback.min;
        params.cashbackMax = pRequest.cashback.max;
    }

    // Date filter
    if (pRequest.endDueDate) {
        if ('value' in pRequest.endDueDate) {
            params.endDueDateType = 'singleDate';
            params.endDueDateValue = pRequest.endDueDate.value;
            params.endDueDateComparation = pRequest.endDueDate.comparation;
        } else {
            params.endDueDateType = 'range';
            params.endDueDateStart = pRequest.endDueDate.startDate;
            params.endDueDateEnd = pRequest.endDueDate.endDate;
        }
    }

    const response = await apiClient.get(`/university/${universityId}/pass`, { params });
    return response.data;
}

export const usePaginatedPasses = (universityId: string, pRequest: PassPaginationRequest) => {
    return useQuery({
        queryKey: [
            'passes',
            'paginated',
            universityId,
            pRequest.page,
            pRequest.size,
            pRequest.career,
            pRequest.semester,
            pRequest.enrollmentYear,
            pRequest.paymentStatus,
            pRequest.studentStatus,
            pRequest.passStatus,
            pRequest.totalToPay,
            pRequest.cashback,
            pRequest.endDueDate,
        ],
        queryFn: () => fetchPaginatedPasses(universityId, pRequest),
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
}