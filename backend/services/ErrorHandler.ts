import { ServiceError, ServiceErrorOrigin, ServiceErrorType } from "@/domain/Error";

export class ErrorHandler_Service {
    constructor(private readonly errorOrigin: ServiceErrorOrigin) {}

    public handleError(errorType: ServiceErrorType, error?: unknown): ServiceError {
        return new ServiceError(this.errorOrigin, errorType, error);
    }
}