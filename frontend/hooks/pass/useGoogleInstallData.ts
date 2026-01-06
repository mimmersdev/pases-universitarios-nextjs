import apiClient from "@/app/api-client";
import { useMutation } from "@tanstack/react-query";

interface GoogleInstallData {
    installLink: string;
}

interface GoogleInstallParams {
    universityId: string;
    uniqueIdentifier: string;
    careerCode: string;
    installClient: boolean;
}

const fetchGoogleInstallData = async ({
    universityId,
    uniqueIdentifier,
    careerCode,
    installClient
}: GoogleInstallParams): Promise<GoogleInstallData> => {
    const response = await apiClient.get(
        `/university/${universityId}/pass/${encodeURIComponent(uniqueIdentifier)}/${encodeURIComponent(careerCode)}/pass-info/google`,
        {
            params: {
                installClient: installClient,
            }
        }
    );
    return response.data;
};

export const useGoogleInstallData = () => {
    return useMutation({
        mutationFn: fetchGoogleInstallData,
    });
};

