import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PassSSEEvent, PassSSEEventType } from "@/domain/SSEEvents";

// Progress state type
export interface CreatePassesProgress {
    processed: number;
    total: number;
    percentage: number;
    errors: Array<{
        uniqueIdentifier: string;
        careerId: string;
        error: string;
    }>;
    isComplete: boolean;
}

// Options for the mutation
export interface CreateManyPassesOptions {
    onProgress?: (progress: CreatePassesProgress) => void;
    onEvent?: (event: PassSSEEvent) => void;
}

const createManyPasses = async (
    universityId: string, 
    file: File,
    options?: CreateManyPassesOptions
): Promise<number> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use fetch directly for SSE support (axios doesn't handle SSE streams well)
    const response = await fetch(`/api/university/${universityId}/pass`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary for FormData
    });

    if (!response.ok) {
        // Handle non-SSE errors (validation errors, etc.)
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
        throw new Error('No response body');
    }

    // Parse SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let progress: CreatePassesProgress = {
        processed: 0,
        total: 0,
        percentage: 0,
        errors: [],
        isComplete: false,
    };
    let totalCreated = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }

            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete SSE messages (they end with \n\n)
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            let currentEvent: string | null = null;
            let currentData: string | null = null;

            for (const line of lines) {
                if (line.startsWith('event: ')) {
                    currentEvent = line.slice(7).trim();
                } else if (line.startsWith('data: ')) {
                    currentData = line.slice(6).trim();
                } else if (line === '') {
                    // Empty line indicates end of message
                    if (currentEvent && currentData) {
                        try {
                            const eventData = JSON.parse(currentData);
                            const event: PassSSEEvent = {
                                type: currentEvent as PassSSEEventType,
                                data: eventData,
                            } as PassSSEEvent;

                            // Call the onEvent callback if provided
                            options?.onEvent?.(event);
                            console.log(event);

                            // Update progress based on event type
                            switch (event.type) {
                                case PassSSEEventType.START:
                                    progress.total = event.data.total;
                                    progress.processed = 0;
                                    progress.percentage = 0;
                                    break;

                                case PassSSEEventType.PROGRESS:
                                    progress.processed = event.data.processed;
                                    progress.total = event.data.total;
                                    progress.percentage = Math.round(
                                        (event.data.processed / event.data.total) * 100
                                    );
                                    break;

                                case PassSSEEventType.ERROR:
                                    if (event.data.itemError) {
                                        progress.errors.push({
                                            uniqueIdentifier: event.data.itemError.uniqueIdentifier,
                                            careerId: event.data.itemError.careerId,
                                            error: event.data.error,
                                        });
                                    }
                                    break;

                                case PassSSEEventType.ERROR_SUMMARY:
                                    progress.errors = event.data.errors.map(err => ({
                                        uniqueIdentifier: err.uniqueIdentifier,
                                        careerId: err.careerId,
                                        error: err.error,
                                    }));
                                    break;

                                case PassSSEEventType.COMPLETE:
                                    progress.isComplete = true;
                                    totalCreated = event.data.total;
                                    break;
                            }

                            // Call the onProgress callback if provided
                            options?.onProgress?.(progress);
                        } catch (parseError) {
                            console.error('Error parsing SSE event:', parseError, { currentEvent, currentData });
                        }
                    }
                    // Reset for next message
                    currentEvent = null;
                    currentData = null;
                }
            }
        }

        // Mark as complete if stream ended
        if (!progress.isComplete) {
            progress.isComplete = true;
            // Use processed count as total created if COMPLETE event wasn't sent
            totalCreated = progress.processed - progress.errors.length;
        }

        return totalCreated;
    } finally {
        reader.releaseLock();
    }
};

export const useCreateManyPasses = (
    universityId: string,
    options?: CreateManyPassesOptions
) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => createManyPasses(universityId, file, options),
        onSuccess: () => {
            // Invalidate and refetch passes list
            queryClient.invalidateQueries({ queryKey: ['passes'] });
        },
    });
};

