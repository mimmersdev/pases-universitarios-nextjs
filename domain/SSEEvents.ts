export enum PassSSEEventType {
    START = 'pass:start',
    PROGRESS = 'pass:progress',
    COMPLETE = 'pass:complete',
    ERROR = 'pass:error',
    ERROR_SUMMARY = 'pass:error-summary'
}
export interface PassStartEvent {
    type: PassSSEEventType.START;
    data: {
        total: number;
    }
}
export interface PassProgressEvent {
    type: PassSSEEventType.PROGRESS;
    data: {
        processed: number;
        total: number;
    }
}
export interface PassCompleteEvent {
    type: PassSSEEventType.COMPLETE;
    data: {
        total: number;
        success: boolean;
    }
}

export interface PassErrorEvent {
    type: PassSSEEventType.ERROR;
    data: {
        error: string;
        itemError?: {
            universityId: string;
            uniqueIdentifier: string;
            careerId: string;
        }
    }
}

export interface PassErrorSummaryEvent {
    type: PassSSEEventType.ERROR_SUMMARY;
    data: {
        errors: {
            universityId: string;
            uniqueIdentifier: string;
            careerId: string;
            error: string;
        }[];
    }
}

export type PassSSEEvent =
    | PassStartEvent
    | PassProgressEvent
    | PassCompleteEvent
    | PassErrorEvent
    | PassErrorSummaryEvent;

export type SSEResponse<T extends PassSSEEvent> = {
    event: T['type'];
    data: T['data'];
}

// Factory
export const PassSSEEvents = {
    start: (total: number): PassStartEvent => ({
        type: PassSSEEventType.START,
        data: {
            total
        }
    }),
    progress: (processed: number, total: number): PassProgressEvent => ({
        type: PassSSEEventType.PROGRESS,
        data: {
            processed,
            total
        }
    }),
    complete: (total: number, success: boolean): PassCompleteEvent => ({
        type: PassSSEEventType.COMPLETE,
        data: {
            total,
            success
        }
    }),
    error: (error: string, universityId: string, uniqueIdentifier: string, careerId: string): PassErrorEvent => ({
        type: PassSSEEventType.ERROR,
        data: {
            error,
            itemError: {
                universityId,
                uniqueIdentifier,
                careerId
            }
        }
    }),
    errorSummary: (errors: { universityId: string; uniqueIdentifier: string; careerId: string; error: string; }[]): PassErrorSummaryEvent => ({
        type: PassSSEEventType.ERROR_SUMMARY,
        data: {
            errors
        }
    })
}