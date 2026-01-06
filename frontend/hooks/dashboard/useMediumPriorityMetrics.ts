import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { MediumPriorityMetrics } from "@/domain/Dashboard";

const fetchMediumPriorityMetrics = async (): Promise<MediumPriorityMetrics> => {
    const response = await apiClient.get('/dashboard/medium-priority');
    return response.data;
}

export const useMediumPriorityMetrics = () => {
    return useQuery({
        queryKey: ['dashboard', 'medium-priority'],
        queryFn: fetchMediumPriorityMetrics,
        placeholderData: (previousData) => previousData,
        staleTime: 5 * 60 * 1000, // 5 minutes - dashboard data doesn't change frequently
    });
}

