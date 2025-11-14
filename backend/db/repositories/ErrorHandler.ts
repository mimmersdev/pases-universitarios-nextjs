import { RepositoryError, RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";

export class ErrorHandler_Repository {
    constructor(private readonly errorOrigin: RepositoryErrorOrigin) {}

    public handleError(errorType: RepositoryErrorType, error?: unknown): RepositoryError {
        return new RepositoryError(this.errorOrigin, errorType, error);
    }
}