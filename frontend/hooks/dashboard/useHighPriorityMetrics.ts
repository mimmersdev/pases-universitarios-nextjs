import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { HighPriorityMetrics } from "@/domain/Dashboard";

const fetchHighPriorityMetrics = async (): Promise<HighPriorityMetrics> => {
    const response = await apiClient.get('/dashboard/high-priority');
    return response.data;
}

export const useHighPriorityMetrics = () => {
    return useQuery({
        queryKey: ['dashboard', 'high-priority'],
        queryFn: fetchHighPriorityMetrics,
        placeholderData: (previousData) => previousData,
        staleTime: 5 * 60 * 1000, // 5 minutes - dashboard data doesn't change frequently
    });
}

