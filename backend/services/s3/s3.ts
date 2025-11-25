import { DeleteObjectCommand, DeleteObjectCommandInput, GetObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client } from "@aws-sdk/client-s3";
import { S3Error, S3ErrorType } from "@/domain/Error";

export enum S3_Folders {
    PASSES_IMAGES = 'passes-images',
}

class ErrorHandler_S3 {
    constructor() { }

    public handleError(errorType: S3ErrorType, error?: unknown): S3Error {
        return new S3Error(errorType, error);
    }
}

const errorHandler = new ErrorHandler_S3();

// Helper function to check if error is a rate limit error (503 Slow Down)
const isRateLimitError = (error: unknown): boolean => {
    if (error && typeof error === 'object' && 'name' in error) {
        // AWS SDK v3 uses 'name' property for error types
        return error.name === 'SlowDown' || error.name === 'ServiceUnavailable';
    }
    if (error && typeof error === 'object' && '$metadata' in error) {
        const metadata = (error as any).$metadata;
        return metadata?.httpStatusCode === 503;
    }
    return false;
};

// Exponential backoff retry helper
const retryWithBackoff = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> => {
    let lastError: unknown;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Only retry on rate limit errors (503)
            if (!isRateLimitError(error) || attempt === maxRetries) {
                throw error;
            }
            
            // Exponential backoff: 1s, 2s, 4s
            const delayMs = baseDelayMs * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    
    throw lastError;
};

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    // Configure retry strategy for rate limits
    maxAttempts: 3,
})

const putParams = (fileName: string, contentType: string, body: Buffer<ArrayBufferLike>): PutObjectCommandInput => {
    const requestsOptions: PutObjectCommandInput = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: fileName,
        Body: body,
        ContentType: contentType
    }
    return requestsOptions;
}

const delParams = (bucket: string, filePath: string) => {
    const requestsOptions: DeleteObjectCommandInput = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: filePath
    };
    return requestsOptions;
}

const getRandomFileName = (extension: string) => {
    const fileName = crypto.randomUUID().replace(/-/g, '');
    return {
        fileName,
        fileNameWithExtension: `${fileName}.${extension}`
    };
}

export class S3Service {
    public static getImageUrl(filePath: string): string {
        return `https://avex-rutapro.s3.us-east-1.amazonaws.com/${this.getEnvironmentFolder()}/${filePath}`;
    }
    /**
     * Uploads a buffer to S3 and returns the file path
     * @param buffer - The buffer to upload
     * @param mimetype - The mimetype of the file
     * @param folder - The folder to upload the file to
     * @returns The file path
     */
    public static async uploadBuffer(buffer: Buffer, mimetype: string, folder: S3_Folders): Promise<string> {
        try {
            // Create the file name
            const { fileNameWithExtension } = getRandomFileName(mimetype);
            const filePath = `${folder}/${fileNameWithExtension}`;
            // Create the file path
            const fullFilePath = `${this.getEnvironmentFolder()}/${folder}/${fileNameWithExtension}`;
            // Upload the file with retry logic for rate limits
            await retryWithBackoff(async () => {
                const command = new PutObjectCommand(putParams(fullFilePath, mimetype, buffer));
                await s3Client.send(command);
            });
            
            return filePath;
        } catch (error) {
            throw errorHandler.handleError(S3ErrorType.UPLOAD_FAILED, error);
        }
    }

    /**
     * Deletes a file from S3
     * @param filePath - The file path to delete
     */
    public static async deleteFile(filePath: string): Promise<void> {
        try {
            const command = new DeleteObjectCommand(delParams(process.env.AWS_BUCKET!, filePath));
            await s3Client.send(command);
        } catch (error) {
            console.error(error);
            throw errorHandler.handleError(S3ErrorType.DELETE_FAILED, error);
        }
    }

    /**
     * Gets a file from S3
     * @param filePath - The file path to get
     * @returns The file buffer
     */
    public static async getFile(filePath: string): Promise<Buffer> {
        const fullFilePath = `${this.getEnvironmentFolder()}/${filePath}`;
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: fullFilePath
        });
        const response = await s3Client.send(command);

        if (!response.Body) {
            throw errorHandler.handleError(S3ErrorType.GET_FAILED);
        }

        return Buffer.from(await response.Body.transformToByteArray());
    }

    private static getEnvironmentFolder() {
        if (process.env.NODE_ENV === 'production') {
            return 'production';
        } else {
            return 'development';
        }
    }
}