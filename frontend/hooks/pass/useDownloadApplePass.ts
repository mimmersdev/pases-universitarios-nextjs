import apiClient from "@/app/api-client";
import { useMutation } from "@tanstack/react-query";

const downloadApplePass = async (
    universityId: string,
    uniqueIdentifier: string,
    careerCode: string,
    installClient: boolean
): Promise<void> => {
    const response = await apiClient.get(
        `/university/${universityId}/pass/${encodeURIComponent(uniqueIdentifier)}/${encodeURIComponent(careerCode)}/pass-info/apple`,
        {
            responseType: 'blob', // Important: tell axios to handle as blob
            params: {
                installClient: installClient,
            }
        }
    );

    // response.data is already a Blob when responseType is 'blob'
    // Use it directly to preserve the binary data integrity
    const blob = response.data instanceof Blob 
        ? response.data 
        : new Blob([response.data], { type: 'application/vnd.apple.pkpass' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `pass-${uniqueIdentifier}.pkpass`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
};

export const useDownloadApplePass = () => {
    return useMutation({
        mutationFn: ({
            universityId,
            uniqueIdentifier,
            careerCode,
            installClient,
        }: {
            universityId: string;
            uniqueIdentifier: string;
            careerCode: string;
            installClient: boolean;
        }) => downloadApplePass(universityId, uniqueIdentifier, careerCode, installClient),
    });
};

