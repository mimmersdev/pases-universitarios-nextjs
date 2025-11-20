interface UserReadableError {
    getError(): string;
}

// Repository Errors
export enum RepositoryErrorType {
    NOT_FOUND = '0',
    GET = '1',
    GET_MANY = '2',
    GET_ALL = '3',
    CREATE = '4',
    CREATE_MANY = '5',
    UPDATE = '6',
    UPDATE_MANY = '7',
    DELETE = '8',
    DELETE_MANY = '9'
}

export enum RepositoryErrorOrigin {
   CAREERS = '001',
   PASSES = '002',
   CITIES = '003',
   UNIVERSITIES = '004',
   TAGS = '005',
   TAG_NUMERIC = '006',
   TAG_DATE = '007',
   TAG_BOOLEAN = '008',
   TAG_LIST = '009',
   CONFIG = '010',
   APPLE_DEVICE = '011'
}

export class RepositoryError extends Error implements UserReadableError {
    constructor(
        public readonly origin: RepositoryErrorOrigin,
        public readonly type: RepositoryErrorType,
        public readonly cause?: unknown
    ) {
        super(`Repository error: ${origin} - ${type}`);
        // Log code
        console.error(`Repository error: ${this.getError()}`);
        // Log original error
        if (this.cause) {
            console.error('Details:');
            console.error(this.cause);
        }
    }

    getError(): string {
        return `${this.origin} - ${this.type}`;
    }
}

// Service Errors
export enum ServiceErrorType {
    NOT_ACTIVE = '0',
    INVALID_SIZE = '1',
    CANT_RESIZE_IMAGE = '2',
    NO_SQUARE_IMAGE = '3',
    INVALID_FORMAT = '4'
}

export enum ServiceErrorOrigin {
    CAREERS = '001',
    PASSES = '002',
    IMAGE_PROCESSING = '003'
}

export class ServiceError extends Error implements UserReadableError {
    constructor(
        public readonly origin: ServiceErrorOrigin,
        public readonly type: ServiceErrorType,
        public readonly cause?: unknown
    ) {
        super(`Service error: ${origin} - ${type}`);
        // Log code
        console.error(`Service error: ${this.getError()}`);
        // Log original error
        if (this.cause) {
            console.error('Details:');
            console.error(this.cause);
        }
    }

    getError(): string {
        return `${this.origin} - ${this.type}`;
    }
}
