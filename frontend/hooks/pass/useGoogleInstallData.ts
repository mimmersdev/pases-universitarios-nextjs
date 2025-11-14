import apiClient from "@/app/api-client";
import { useQuery } from "@tanstack/react-query";

interface GoogleInstallData {
    installLink: string;
}

const fetchGoogleInstallData = async (
    universityId: string,
    uniqueIdentifier: string,
    careerCode: string
): Promise<GoogleInstallData> => {
    const response = await apiClient.get(
        `/university/${universityId}/pass/${encodeURIComponent(uniqueIdentifier)}/${encodeURIComponent(careerCode)}/pass-info/google`
    );
    return response.data;
};

export const useGoogleInstallData = (
    universityId: string,
    uniqueIdentifier: string,
    careerCode: string
) => {
    return useQuery({
        queryKey: ['pass', 'google-install', universityId, uniqueIdentifier, careerCode],
        queryFn: () => fetchGoogleInstallData(universityId, uniqueIdentifier, careerCode),
        enabled: !!universityId && !!uniqueIdentifier && !!careerCode, // Only fetch if all params exist
    });
};

