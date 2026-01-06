import QRCodeStyling, { Options } from "qr-code-styling"
import { JSDOM } from "jsdom"
import nodeCanvas from "canvas"
import { S3Service, S3_Folders } from "../s3/s3";

export class QRCodeService {
    public static async generateAndUploadQRCode(url: string): Promise<string> {
        const qrCodeBuffer = await this.generateQRCode(url);
        const qrCodeUrl = await S3Service.uploadBuffer(qrCodeBuffer, 'image/png', S3_Folders.QR_CODES);
        return qrCodeUrl;
    }
    
    private static async generateQRCode(url: string): Promise<Buffer> {
        try {
            const qrCode = new QRCodeStyling({
                jsdom: JSDOM,
                nodeCanvas,
                type: "canvas",
                shape: "square",
                width: 300,
                height: 300,
                data: url,
                margin: 0,
                qrOptions: {
                    typeNumber: 0,
                    mode: "Byte",
                    errorCorrectionLevel: "Q"
                },
                imageOptions: {
                    saveAsBlob: true,
                    hideBackgroundDots: true,
                    imageSize: 0.4,
                    margin: 5,
                    crossOrigin: "anonymous"
                },
                dotsOptions: {
                    type: "rounded",
                    color: "#000000",
                    roundSize: true,
                },
                backgroundOptions: {
                    round: 0,
                    color: "#ffffff"
                },
                image: process.env.QR_CODE_LOGO_URL!,
                cornersSquareOptions: {
                    type: "rounded",
                    color: "#fd673f"
                },
                cornersDotOptions: {
                    type: "rounded",
                    color: "#000000"
                }
            });

            const rawData = await qrCode.getRawData("png");

            if (!rawData) {
                throw new Error("Failed to generate QR code: no data returned");
            }

            // In Node.js, getRawData returns a Buffer when using nodeCanvas
            if (Buffer.isBuffer(rawData)) {
                return rawData;
            }

            // If it's a Blob (browser environment), convert to Buffer
            if (rawData instanceof Blob) {
                const arrayBuffer = await rawData.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }

            throw new Error(`Unexpected data type returned from QR code generator: ${typeof rawData}`);
        } catch (error) {
            console.log(error);
            throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}