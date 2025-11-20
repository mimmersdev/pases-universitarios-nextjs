import { ImageProcessingService } from "@/backend/services/utils/image-processing";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
    try {
        const testImagePath = path.join(process.cwd(), 'app', 'api', 'image-test', 'test.jpg');
        
        // Read the test image
        const inputBuffer = await fs.readFile(testImagePath);

        // Resize the image to square
        const resizedImage = await ImageProcessingService.resizeImage_ToSquare(inputBuffer);
        
        // Process the image with circular stencil and white border
        const processedImage = await ImageProcessingService.createCircularImageWithBorder(
            resizedImage,
            20 // 20px white border
        );
        
        // Generate 3 different sizes from the circular image
        const { original, reducedBy2, reducedBy3 } = await ImageProcessingService.resizeImages_ReduceFromOriginal(processedImage);
        
        // Save all outputs
        const outputDir = path.join(process.cwd(), 'app', 'api', 'image-test');
        await fs.writeFile(path.join(outputDir, 'test-output-original.png'), original);
        await fs.writeFile(path.join(outputDir, 'test-output-reducedBy2.png'), reducedBy2);
        await fs.writeFile(path.join(outputDir, 'test-output-reducedBy3.png'), reducedBy3);
        
        return NextResponse.json({
            success: true,
            message: 'Image processed successfully',
            outputs: {
                original: 'app/api/image-test/test-output-original.png',
                reducedBy2: 'app/api/image-test/test-output-reducedBy2.png',
                reducedBy3: 'app/api/image-test/test-output-reducedBy3.png'
            }
        });
    } catch (error) {
        console.error('Error processing image:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            },
            { status: 500 }
        );
    }
}

