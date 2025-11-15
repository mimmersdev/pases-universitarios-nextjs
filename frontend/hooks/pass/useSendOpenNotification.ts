import apiClient from "@/app/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FilteredPaginationRequest } from "@/domain/FilteredPagination";

interface SendNotificationRequest extends FilteredPaginationRequest {
    header: string;
    body: string;
}

const sendOpenNotification = async (
    universityId: string,
    data: SendNotificationRequest
): Promise<void> => {
    await apiClient.post(`/university/${universityId}/pass/notifications`, data);
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

