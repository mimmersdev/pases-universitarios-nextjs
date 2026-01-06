import { ServiceErrorOrigin, ServiceErrorType } from "@/domain/Error";
import sharp from "sharp";
import { ErrorHandler_Service } from "../ErrorHandler";

const errorHandler = new ErrorHandler_Service(ServiceErrorOrigin.IMAGE_PROCESSING);

export class ImageProcessingService {
    public static async resizeImage_ToSquare(inputBuffer: Buffer): Promise<Buffer> {
        const metadata = await sharp(inputBuffer).metadata();

        if (!metadata.width || !metadata.height) {
            throw errorHandler.handleError(ServiceErrorType.INVALID_SIZE);
        }

        return await sharp(inputBuffer).resize(1200, 1200, {
            fit: 'cover',
            position: 'center'
        }).toBuffer();

    }
    /**
     * Creates two reduced resolution versions of an image:
     * - One at 1/2 the original resolution (reduced by 2)
     * - One at 1/3 the original resolution (reduced by 3)
     * 
     * @param inputBuffer - The original image buffer
     * @returns Object containing the original, half-size, and third-size image buffers
     */
    public static async resizeImages_ReduceFromOriginal(inputBuffer: Buffer): Promise<{
        original: Buffer;
        reducedBy2: Buffer;
        reducedBy3: Buffer;
    }> {
        const metadata = await sharp(inputBuffer).metadata();
        
        // Validate that the image is PNG format
        if (metadata.format !== 'png') {
            throw errorHandler.handleError(ServiceErrorType.INVALID_FORMAT);
        }
        
        if (!metadata.width || !metadata.height) {
            throw errorHandler.handleError(ServiceErrorType.INVALID_SIZE);
        }

        const originalWidth = metadata.width;
        const originalHeight = metadata.height;

        if (originalWidth !== originalHeight) {
            throw errorHandler.handleError(ServiceErrorType.NO_SQUARE_IMAGE);
        }

        // Create half-size version (reduced by 2)
        const reducedBy2 = await sharp(inputBuffer)
            .resize(
                Math.floor(originalWidth / 2),
                Math.floor(originalHeight / 2),
                {
                    fit: 'inside',
                    withoutEnlargement: true
                }
            )
            .png({
                quality: 90,
                palette: true,
            })
            .toBuffer();

        // Create third-size version (reduced by 3)
        const reducedBy3 = await sharp(inputBuffer)
            .resize(
                Math.floor(originalWidth / 3),
                Math.floor(originalHeight / 3),
                {
                    fit: 'inside',
                    withoutEnlargement: true
                }
            )
            .png({
                quality: 90,
                palette: true,
            })
            .toBuffer();

        return {
            original: inputBuffer,
            reducedBy2,
            reducedBy3
        };
    }

    /**
     * Creates a circular image with a circular white border from any input image format.
     * The image is converted to PNG, made circular with a circular white border ring.
     * The result has transparency outside the border and maintains the original image size.
     * 
     * @param inputBuffer - The input image buffer (can be JPG, PNG, WebP, etc.)
     * @param borderWidth - Width of the white border ring in pixels (default: 20)
     * @returns PNG buffer with circular image, circular white border, and same dimensions as input
     */
    public static async createCircularImageWithBorder(
        inputBuffer: Buffer,
        borderWidth: number = 20
    ): Promise<Buffer> {
        const metadata = await sharp(inputBuffer).metadata();
        
        if (!metadata.width || !metadata.height) {
            throw errorHandler.handleError(ServiceErrorType.INVALID_SIZE);
        }

        // Use the smaller dimension to ensure we have a square
        const outerSize = Math.min(metadata.width, metadata.height);
        const innerSize = outerSize - (borderWidth * 2);
        
        // Resize to square and center crop to inner size (leaving room for border)
        const squareImage = await sharp(inputBuffer)
            .resize(innerSize, innerSize, {
                fit: 'cover',
                position: 'center'
            })
            .toBuffer();

        // Create circular mask for inner image
        const innerCircleSvg = `
            <svg width="${innerSize}" height="${innerSize}">
                <circle cx="${innerSize / 2}" cy="${innerSize / 2}" r="${innerSize / 2}" fill="white"/>
            </svg>
        `;

        // Apply circular mask to inner image
        const circularImage = await sharp(squareImage)
            .composite([
                {
                    input: Buffer.from(innerCircleSvg),
                    blend: 'dest-in'
                }
            ])
            .png()
            .toBuffer();

        // Create a white circle background of outer size
        const whiteCircleSvg = `
            <svg width="${outerSize}" height="${outerSize}">
                <circle cx="${outerSize / 2}" cy="${outerSize / 2}" r="${outerSize / 2}" fill="white"/>
            </svg>
        `;

        // Create outer circular mask (for transparency outside)
        const outerCircleSvg = `
            <svg width="${outerSize}" height="${outerSize}">
                <circle cx="${outerSize / 2}" cy="${outerSize / 2}" r="${outerSize / 2}" fill="white"/>
            </svg>
        `;

        // Composite: white circle + centered inner circular image + outer mask
        const imageWithBorder = await sharp(Buffer.from(whiteCircleSvg))
            .composite([
                {
                    input: circularImage,
                    top: borderWidth,
                    left: borderWidth
                }
            ])
            .toBuffer();

        // Apply outer circular mask to create transparency outside
        const finalImage = await sharp(imageWithBorder)
            .composite([
                {
                    input: Buffer.from(outerCircleSvg),
                    blend: 'dest-in'
                }
            ])
            .png({
                quality: 90,
                palette: true,
            })
            .toBuffer();

        return finalImage;
    }

    /**
     * Places an image in the center of a 1032x500 PNG canvas.
     * The input image is scaled to 430x430 and centered on the canvas.
     * 
     * @param inputBuffer - The input image buffer (any format)
     * @returns PNG buffer with dimensions 1032x500 containing the centered 430x430 image
     */
    public static async placeImageInCenterCanvas(
        inputBuffer: Buffer
    ): Promise<Buffer> {
        const metadata = await sharp(inputBuffer).metadata();
        
        if (!metadata.width || !metadata.height) {
            throw errorHandler.handleError(ServiceErrorType.INVALID_SIZE);
        }

        // Canvas dimensions
        const canvasWidth = 1032;
        const canvasHeight = 500;
        
        // Image dimensions to scale to
        const imageWidth = 430;
        const imageHeight = 430;

        // Calculate center position
        const left = Math.floor((canvasWidth - imageWidth) / 2);
        const top = Math.floor((canvasHeight - imageHeight) / 2);

        // Resize input image to 430x430
        const resizedImage = await sharp(inputBuffer)
            .resize(imageWidth, imageHeight, {
                fit: 'cover',
                position: 'center'
            })
            .toBuffer();

        // Create transparent canvas and composite the resized image
        const finalImage = await sharp({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .png()
            .composite([
                {
                    input: resizedImage,
                    left: left,
                    top: top
                }
            ])
            .png({
                quality: 90,
                palette: true,
            })
            .toBuffer();

        return finalImage;
    }
}