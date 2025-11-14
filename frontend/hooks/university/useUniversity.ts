import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";
import { University } from "pases-universitarios";

const fetchUniversity = async (id: string): Promise<University> => {
    const response = await apiClient.get(`/university/${id}`);
    return response.data;
}

export const useUniversity = (id: string) => {
    return useQuery({
        queryKey: ['university', id],
        queryFn: () => fetchUniversity(id),
    });
}