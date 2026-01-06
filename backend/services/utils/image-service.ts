import { ErrorHandler_Service } from "../ErrorHandler";
import { ServiceErrorOrigin, ServiceErrorType } from "@/domain/Error";
import axios from "axios";
import { ImageProcessingService } from "./image-processing";
import { S3_Folders, S3Service } from "../s3/s3";

const errorHandler = new ErrorHandler_Service(ServiceErrorOrigin.IMAGE_SERVICE);

export class ImageService {
    public static async getAndProcessImage(imageUrl: string): Promise<{
        originalUrl: string;
        reducedBy2Url: string;
        reducedBy3Url: string;
        googleHeroUrl: string;
    }> {
        try {
            // Fetch the image with arraybuffer response type to get raw binary data
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer'
            });
            
            // Convert the arraybuffer to a Buffer
            const imageBuffer = Buffer.from(response.data);

            // Resize image to square
            const resizedImage = await ImageProcessingService.resizeImage_ToSquare(imageBuffer);
            // Process the image with circular stencil and white border
            const imageWithCircularStencil = await ImageProcessingService.createCircularImageWithBorder(resizedImage);
            // Generate 3 different sizes from the circular image
            const { original, reducedBy2, reducedBy3 } = await ImageProcessingService.resizeImages_ReduceFromOriginal(imageWithCircularStencil);

            // Generate image with padding for google wallet
            const googleHeroImage = await ImageProcessingService.placeImageInCenterCanvas(imageWithCircularStencil);

            const [originalUrl, reducedBy2Url, reducedBy3Url, googleHeroUrl] = await Promise.all([
                S3Service.uploadBuffer(original, 'image/png', S3_Folders.PASSES_IMAGES),
                S3Service.uploadBuffer(reducedBy2, 'image/png', S3_Folders.PASSES_IMAGES),
                S3Service.uploadBuffer(reducedBy3, 'image/png', S3_Folders.PASSES_IMAGES),
                S3Service.uploadBuffer(googleHeroImage, 'image/png', S3_Folders.PASSES_IMAGES)
            ]);
            return { originalUrl, reducedBy2Url, reducedBy3Url, googleHeroUrl };
        } catch (error) {
            throw errorHandler.handleError(ServiceErrorType.IMAGE_NOT_FOUND, error);
        }
    }
}