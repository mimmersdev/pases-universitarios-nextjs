import { AppleDeviceRepository } from "@/backend/db/repositories/apple-device-repository";
import { PassRepository } from "@/backend/db/repositories/pass-repository";
import { UniversityRepository } from "@/backend/db/repositories/university-repository";
import { getPassStatusLabel, getPaymentStatusLabel, Pass } from "pases-universitarios";
import { AppleWalletCredentials, AppleWalletImages, AppleWalletIssueProps, AppleWalletManager, PassFieldContent } from "pases-universitarios/wallet";
import path from "path";
import fs from "fs/promises";
import axios from "axios";
import { S3Service } from "../s3/s3";


export class AppleManagerService {
    public static async registerDevice(deviceLibraryIdentifier: string, passTypeIdentifier: string, serialNumber: string, pushToken: string): Promise<void> {
        const pass = await PassRepository.getPassByAppleSerialNumber(serialNumber);
        if (pass === null) {
            throw new Error('Pass not found with serial number: ' + serialNumber);
        }
        await AppleDeviceRepository.registerDevice(
            serialNumber,
            pass.universityId,
            pass.uniqueIdentifier,
            pass.careerId,
            deviceLibraryIdentifier,
            passTypeIdentifier,
            pushToken
        );
    }

    public static async unregisterDevice(deviceLibraryIdentifier: string, passTypeIdentifier: string, serialNumber: string): Promise<void> {
        await AppleDeviceRepository.unregisterDevice(deviceLibraryIdentifier, passTypeIdentifier, serialNumber);
    }

    public static async generatePass(pass: Pass, careerName: string): Promise<Buffer> {
        const serialNumber = pass.appleWalletSerialNumber;
        if(serialNumber === null) {
            throw new Error('Serial number not found for pass: ' + pass.uniqueIdentifier);
        }

        const universityData = await UniversityRepository.getUniversityById(pass.universityId);

        const credentials: AppleWalletCredentials = {
            teamIdentifier: process.env.APPLE_TEAM_ID!,
            organizationName: process.env.APPLE_ORG_NAME!,
            passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID!,
            wwdr: process.env.APPLE_WWDR!,
            signerCert: process.env.APPLE_SIGNER_CERTIFICATE!,
            signerKey: process.env.APPLE_SIGNER_KEY!,
        }

        const backFields: PassFieldContent[] = [
            {
                key: "totalToPay",
                value: pass.totalToPay.toString(),
                label: "Total a pagar",
            },
            {
                key: "endDueDate",
                value: pass.endDueDate.toLocaleDateString(),
                label: "Fecha de vencimiento",
            },
            {
                key: "entryDate",
                value: pass.enrollmentYear.toString(),
                label: "Fecha de ingreso",
            },
            {
                key: "informationField",
                value: pass.informationField,
                label: "Información Extra",
                changeMessage: "Nueva Notificación: %@",
            }
        ];
        if(pass.onlinePaymentLink !== null) {
            backFields.push({
                key: "onlinePaymentLink",
                value: pass.onlinePaymentLink,
                dataDetectorTypes: ["PKDataDetectorTypeLink"],
                label: "Pago en línea",
                attributedValue: `<a href='${pass.onlinePaymentLink}'>Click Aquí</a>`
            });
        }
        if(pass.academicCalendarLink !== null) {
            backFields.push({
                key: "academicCalendarLink",
                value: pass.academicCalendarLink,
                dataDetectorTypes: ["PKDataDetectorTypeLink"],
                label: "Calendario académico",
                attributedValue: `<a href='${pass.academicCalendarLink}'>Click Aquí</a>`
            });
        }

        const passProps: AppleWalletIssueProps = {
            description: "Pase Universitario",
            backgroundColorRgb: "rgb(22,22,22)",
            foregroundColorRgb: "rgb(255,255,255)",
            labelColorRgb: "rgb(219,255,85)",
            serialNumber: pass.appleWalletSerialNumber!,
            header: {
                value: pass.uniqueIdentifier,
                key: "id",
                label: "ID",
            },
            barcode: {
                value: pass.paymentReference,
                alternativeText: pass.paymentReference,
            },
            primaryField: {
                value: pass.name,
                key: "name",
                label: careerName,
            },
            secondaryFields: [
                {
                    key: "university",
                    label: "Institución",
                    value: universityData.name,
                    textAlignment: "PKTextAlignmentLeft"
                },
                {
                    key: "status",
                    label: "Estado",
                    value: getPassStatusLabel(pass.status),
                    textAlignment: "PKTextAlignmentRight"
                }
            ],
            auxiliaryFields: [
                {
                    key: "cashback",
                    value: pass.cashback.toString(),
                    label: "Cashback",
                    textAlignment: "PKTextAlignmentLeft"
                },
                {
                    key: "paymentStatus",
                    value: getPaymentStatusLabel(pass.paymentStatus),
                    label: "Estado de pago",
                    textAlignment: "PKTextAlignmentRight"
                }
            ],
            backFields: backFields
        }

        const image1Response = await axios.get(S3Service.getImageUrl(pass.photo1Url), {
            responseType: 'arraybuffer'
        });
        const image2Response = await axios.get(S3Service.getImageUrl(pass.photo2Url), {
            responseType: 'arraybuffer'
        });
        const image3Response = await axios.get(S3Service.getImageUrl(pass.photo3Url), {
            responseType: 'arraybuffer'
        });
        
        // Convert the arraybuffer to a Buffer
        const image1Buffer = Buffer.from(image1Response.data);
        const image2Buffer = Buffer.from(image2Response.data);
        const image3Buffer = Buffer.from(image3Response.data);

        const images: AppleWalletImages = {
            logo: Buffer.from(await fs.readFile(path.join(process.cwd(), 'backend', 'services', 'apple', 'images', 'logo1.png'))),
            logoX2: Buffer.from(await fs.readFile(path.join(process.cwd(), 'backend', 'services', 'apple', 'images', 'logo2.png'))),
            logoX3: Buffer.from(await fs.readFile(path.join(process.cwd(), 'backend', 'services', 'apple', 'images', 'logo3.png'))),
            icon: Buffer.from(await fs.readFile(path.join(process.cwd(), 'backend', 'services', 'apple', 'images', 'icon1.png'))),
            iconX2: Buffer.from(await fs.readFile(path.join(process.cwd(), 'backend', 'services', 'apple', 'images', 'icon2.png'))),
            iconX3: Buffer.from(await fs.readFile(path.join(process.cwd(), 'backend', 'services', 'apple', 'images', 'icon3.png'))),
            thumbnail: image1Buffer,
            thumbnailX2: image2Buffer,
            thumbnailX3: image3Buffer,
        }

        const origin = `${process.env.NEXT_PUBLIC_ORIGIN!}/api/apple-passes`;
        const passBuffer = await AppleWalletManager.generatePass(passProps, images, credentials, origin, process.env.APPLE_TOKEN_SECRET!);
        return passBuffer;
    }
}