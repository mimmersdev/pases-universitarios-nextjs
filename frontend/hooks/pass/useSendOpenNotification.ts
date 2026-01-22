import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PassPaginationRequest } from "@/domain/FilteredPagination";

interface SendNotificationRequest extends PassPaginationRequest {
    header: string;
    body: string;
}

const sendOpenNotification = async (
    universityId: string,
    pRequest: SendNotificationRequest,
): Promise<void> => {
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

    await apiClient.post(
        `/university/${universityId}/pass/notifications`,
        {
            header: pRequest.header,
            body: pRequest.body,
        },
        {
            params: params
        }
    );
};

export const useSendOpenNotification = (universityId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SendNotificationRequest) => sendOpenNotification(universityId, data),
        onSuccess: () => {
            // Invalidate passes queries to refresh the data
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });
};

