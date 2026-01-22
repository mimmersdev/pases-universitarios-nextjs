import QRCode from "qrcode";
import { S3Service, S3_Folders } from "../s3/s3";

export class QRCodeService {
    public static async generateAndUploadQRCode(url: string): Promise<string> {
        const qrCodeBuffer = await this.generateQRCode(url);
        const qrCodeUrl = await S3Service.uploadBuffer(qrCodeBuffer, 'image/png', S3_Folders.QR_CODES);
        return qrCodeUrl;
    }

    private static async generateQRCode(url: string): Promise<Buffer> {
        try {
            // Generate QR code as PNG buffer using qrcode library (pure JS, serverless compatible)
            const qrBuffer = await QRCode.toBuffer(url, {
                errorCorrectionLevel: 'Q',
                type: 'png',
                width: 300,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });

            return qrBuffer;
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
