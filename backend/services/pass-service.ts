import { ServiceErrorOrigin } from "@/domain/Error";
import { ErrorHandler_Service } from "./ErrorHandler";
import { Career, CreatePass, CreatePassBackend, InstallationStatus, Pass, SimplePass, University, UpdateCashbackRequest, UpdatePassDueRequest, UpdatePassPaidRequest } from "pases-universitarios";
import { PassRepository } from "../db/repositories/pass-repository";
import { PassPaginationRequest } from "@/domain/FilteredPagination";
import { PaginationResponse, processChunksInParallel, processChunksInParallelWithSum } from "mimmers-core-nodejs";
import { AppleWalletManager, GoogleWalletCredentials, GoogleWalletManager } from "pases-universitarios/wallet";
import { ConfigRepository } from "../db/repositories/config-repository";
import { UniversityRepository } from "../db/repositories/university-repository";
import { CareerRepository } from "../db/repositories/career-repository";
import { InstallData_Google } from "@/domain/InstallData";
import { AppleManagerService } from "./apple/apple-manager-service";
import { GoogleManagerService } from "./google/google-manager-service";
import apn from '@parse/node-apn';
import { AppleDeviceRepository } from "../db/repositories/apple-device-repository";
import { ImageService } from "./utils/image-service";
import { DB_CONFIGURATION, WALLET_CONFIGURATION } from "@/config/database";
import { ZeptoManager } from "./zepto/zepto-manager";
import { PassSSEEvent, PassSSEEvents } from "@/domain/SSEEvents";
import { QRCodeService } from "./qrCode/qr-code-service";
import fs from 'fs/promises';
import { S3Service } from "./s3/s3";

const errorHandler = new ErrorHandler_Service(ServiceErrorOrigin.PASSES);
export class PassService {
    public static async createMany(universityId: string, req: CreatePass[], onEvent?: (event: PassSSEEvent) => void): Promise<number> {
        const total = req.length;
        let processed = 0;
        let successful = 0;
        let failed = 0;
        const errors: Array<{ universityId: string; uniqueIdentifier: string; careerId: string; error: string }> = [];

        onEvent?.(PassSSEEvents.start(total));

        // First check if the passes already exist
        const existingIds = await PassRepository.getIdsInList(universityId, req.map(i => ({ uniqueIdentifier: i.uniqueIdentifier, careerId: i.careerId })));
        console.log("Existing IDs:", existingIds.length);

        if (existingIds.length > 0) {
            // Add them to the list of errors
            errors.push(...existingIds.map(i => ({ universityId: universityId, uniqueIdentifier: i.uniqueIdentifier, careerId: i.careerId, error: "El identificador único y la carrera ya existen. Pase ignorado." })));
        }

        // Filter incoming requests to only include those that do not exist
        // Mark ignored passes as processed
        const filteredReq = req.filter(i => !existingIds.some(e => e.uniqueIdentifier === i.uniqueIdentifier && e.careerId === i.careerId));
        console.log("Filtered requests:", filteredReq.length);
        if (existingIds.length > 0) {
            processed += existingIds.length;
            onEvent?.(PassSSEEvents.progress(processed, total));
        }

        const processImages = async (photoUrl: string) => {
            try {
                return await ImageService.getAndProcessImage(photoUrl);

            } catch {
                throw new Error("Error al procesar la imagen. ¿Si está disponible la imagen?")
            }
        }

        const generateQR = async (qrUrl: string) => {
            try {
                return await QRCodeService.generateAndUploadQRCode(qrUrl);
            } catch {
                throw new Error("Error al generar el QR.")
            }
        }

        const count = await processChunksInParallelWithSum(
            filteredReq,
            DB_CONFIGURATION.CHUNK_SIZES.COMPLEX_INSERT,
            async (chunk) => {
                const results = await Promise.allSettled(
                    chunk.map(async (i) => {
                        try {
                            const imageUrls = await processImages(i.photoUrl);

                            const qrCodeUrl = `${process.env.NEXT_PUBLIC_ORIGIN!}/install/${universityId}/${i.uniqueIdentifier}/${i.careerId}`;
                            const qrCodeUrlS3 = await generateQR(qrCodeUrl);

                            const result: CreatePassBackend = {
                                ...i,
                                photo1Url: imageUrls.reducedBy3Url,
                                photo2Url: imageUrls.reducedBy2Url,
                                photo3Url: imageUrls.originalUrl,
                                photoGoogleHeroUrl: imageUrls.googleHeroUrl,
                                qrCodeUrl: qrCodeUrlS3,
                            };

                            return { success: true, data: result };
                        } catch (error) {
                            // TODO: Search and delete images related to this pass. Have to think how to since the URLs generated are random
                            console.error(error);

                            const errorMessage = (() => {
                                if (error instanceof Error) {
                                    return error.message
                                }
                                return "Error desconocido. Por favor contactar administración."
                            })();

                            errors.push({
                                universityId: universityId,
                                uniqueIdentifier: i.uniqueIdentifier,
                                careerId: i.careerId,
                                error: errorMessage,
                            })

                            onEvent?.(PassSSEEvents.error(errorMessage, universityId, i.uniqueIdentifier, i.careerId));

                            return { success: false, universityId: universityId, uniqueIdentifier: i.uniqueIdentifier, careerId: i.careerId, error: errorMessage };
                        }
                    })
                );

                // Separate successful and failed items
                const successfulItems = results
                    .filter((r): r is PromiseFulfilledResult<{ success: true; data: CreatePassBackend }> =>
                        r.status === 'fulfilled' && r.value.success === true
                    )
                    .map(r => r.value.data);

                const failedItems = results
                    .filter((r): r is PromiseFulfilledResult<{ success: false; universityId: string; uniqueIdentifier: string; careerId: string; error: string }> =>
                        r.status === 'fulfilled' && r.value.success === false
                    );

                // Send emails for passes without errors
                await processChunksInParallel(
                    successfulItems,
                    100,
                    async (chunk) => {
                        try {
                            const data = chunk.map(d => ({
                                email: d.email,
                                name: d.name,
                                install_url: `${process.env.NEXT_PUBLIC_ORIGIN!}/install/${universityId}/${d.uniqueIdentifier}/${d.careerId}`,
                                qr_url: S3Service.getImageUrl(d.qrCodeUrl)
                            }))
                            await ZeptoManager.sendTestEmail(data);
                        } catch (error) {
                            console.error(error);
                        }
                    },
                    3
                );

                const dbResults = successfulItems.length > 0 ? await PassRepository.createMany(universityId, successfulItems) : 0;
                processed += chunk.length;
                successful += dbResults;
                failed += failedItems.length;
                onEvent?.(PassSSEEvents.progress(processed, total));

                return dbResults;
            },
            DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
        );
        if (failed > 0) {
            onEvent?.(PassSSEEvents.errorSummary(errors));
        }
        onEvent?.(PassSSEEvents.complete(total, failed === 0));
        return count;
    }

    public static async getPass(universityId: string, uniqueIdentifier: string, careerId: string): Promise<Pass> {
        const pass = await PassRepository.getPass(universityId, uniqueIdentifier, careerId);
        return pass;
    }

    public static async getSimplePass(universityId: string, uniqueIdentifier: string, careerId: string): Promise<SimplePass> {
        const pass = await PassRepository.getSimplePass(universityId, uniqueIdentifier, careerId);
        return pass;
    }

    public static async getPaginatedPasses(universityId: string, pRequest: PassPaginationRequest): Promise<PaginationResponse<Pass>> {
        const passes = await PassRepository.getPaginatedPasses(universityId, pRequest);
        return passes;
    }

    public static async sendOpenNotification(universityId: string, filters: PassPaginationRequest, header: string, body: string): Promise<void> {
        // Get all passes that match the filters
        const passes = await PassRepository.getPassesByFilters(universityId, filters);

        if (passes.length === 0) {
            return; // No passes to notify
        }

        // Extract ids from passes
        const ids = passes.map(pass => ({ uniqueIdentifier: pass.uniqueIdentifier, careerId: pass.careerId }));

        // Update all passes with the notification data
        await PassRepository.update_InformationFieldParallel(universityId, ids, body);

        const universityData = await UniversityRepository.getUniversityById(universityId);

        const appleDevices = await AppleDeviceRepository.getDevicesByIds(ids.map((id) => ({ universityId, uniqueIdentifier: id.uniqueIdentifier, careerId: id.careerId })));
        // send notifications to all passes
        // TODO: Change to use parallel processing

        const credentials: GoogleWalletCredentials = {
            project_id: process.env.GOOGLE_PROJECT_ID!,
            private_key: process.env.GOOGLE_PRIVATE_KEY!,
            client_email: process.env.GOOGLE_CLIENT_EMAIL!,
            client_id: process.env.GOOGLE_CLIENT_ID!,
            auth_uri: process.env.GOOGLE_AUTH_URI!,
            token_uri: process.env.GOOGLE_TOKEN_URI!,
            auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL!,
            client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL!,
        };
        const googleWalletManager = new GoogleWalletManager(process.env.GOOGLE_ISSUER_ID!, credentials);
        const apnProvider = new apn.Provider({
            token: {
                key: process.env.APPLE_APN_KEY!,
                keyId: process.env.APPLE_APN_KEY_ID!,
                teamId: process.env.APPLE_TEAM_ID!,
            },
            production: true
        });


        // Parallel processing for Google Wallet
        await processChunksInParallel(
            passes,
            WALLET_CONFIGURATION.CHUNK_SIZES.UPDATE_PASS,
            async (chunk) => {
                await Promise.all(chunk.map(async (pass) => {
                    if (pass.googleWalletObjectID !== null) {
                        try {
                            const googleProps = await GoogleManagerService.getGoogleWalletIssuePropsFromPass(universityData, pass.careerName, pass);
                            await googleWalletManager.updatePass(pass.googleWalletObjectID, googleProps);
                            await googleWalletManager.sendPassNotification(pass.googleWalletObjectID, header, body);
                        } catch (error) {
                            console.error('Error updating Google Wallet pass:', error);
                        }
                    }
                }))
            },
            WALLET_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
        )

        // Parallel processing for Apple Wallet
        await processChunksInParallel(
            appleDevices,
            WALLET_CONFIGURATION.CHUNK_SIZES.UPDATE_PASS,
            async (chunk) => {
                try {
                    await AppleWalletManager.sendSilentPushNotification(apnProvider, chunk.map((device) => ({
                        passSerialNumber: device.serialNumber,
                        pushToken: device.pushToken,
                        passTypeIdentifier: device.passTypeIdentifier,
                    })));

                } catch (error) {
                    console.error('Error sending Apple Wallet push notification:', error);
                }
            },
            WALLET_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
        )
    }

    // Google Wallet methods
    public static async getInstallationData_Google(universityId: string, uniqueIdentifier: string, careerId: string, installClient: boolean): Promise<InstallData_Google> {
        const data = await PassRepository.getPass(universityId, uniqueIdentifier, careerId);
        const universityData = await UniversityRepository.getUniversityById(universityId);
        const careerData = await CareerRepository.getCareerByCode(universityId, careerId);

        const credentials: GoogleWalletCredentials = {
            project_id: process.env.GOOGLE_PROJECT_ID!,
            private_key: process.env.GOOGLE_PRIVATE_KEY!,
            client_email: process.env.GOOGLE_CLIENT_EMAIL!,
            client_id: process.env.GOOGLE_CLIENT_ID!,
            auth_uri: process.env.GOOGLE_AUTH_URI!,
            token_uri: process.env.GOOGLE_TOKEN_URI!,
            auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL!,
            client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL!,
        };
        const googleWalletManager = new GoogleWalletManager(process.env.GOOGLE_ISSUER_ID!, credentials);
        const config = await ConfigRepository.getConfig();

        let classId: string;
        if (config === null) {
            // Create class ID
            classId = await googleWalletManager.createPassClass(process.env.CLIENT_NAME!);
            // Create config
            await ConfigRepository.createConfig({ googleWalletClassId: classId });
        } else {
            // Get class ID
            classId = config.googleWalletClassId;
        }

        if (installClient) {
            // Mark this pass as google installed
            await PassRepository.update_InstallationStatus(uniqueIdentifier, careerId, universityId, {
                googleInstallationStatus: InstallationStatus.Installed,
                appleInstallationStatus: undefined,
            });
        }

        if (data.googleWalletObjectID === null) {
            // Create object ID and get install link
            // Create random string of 15 characters
            const objectId = Math.random().toString(36).substring(2, 15);
            // Update pass with object ID
            await PassRepository.update_GoogleWalledIdentication(universityId, uniqueIdentifier, careerId, objectId);
            // Get install link
            const installLink = await this.getInstallLink_Google(googleWalletManager, universityData, data, careerData, objectId, classId);
            return { installLink };
        } else {
            // Get install link
            const installLink = await this.getInstallLink_Google(googleWalletManager, universityData, data, careerData, data.googleWalletObjectID, classId);
            return { installLink };
        }
    }

    private static async getInstallLink_Google(googleWalletManager: GoogleWalletManager, universityData: University, data: Pass, careerData: Career, objectId: string, classId: string): Promise<string> {
        const googleProps = await GoogleManagerService.getGoogleWalletIssuePropsFromPass(universityData, careerData.name, data);

        console.log('=== Google Wallet Debug ===');
        console.log('classId:', classId);
        console.log('objectId:', objectId);
        console.log('origin:', process.env.NEXT_PUBLIC_ORIGIN);
        console.log('heroUri:', googleProps.heroUri);
        console.log('logoUri:', googleProps.logoUri);
        console.log('barcode:', googleProps.barcode);
        console.log('===========================');

        const installLink = await googleWalletManager.createPass(objectId, classId, googleProps, process.env.NEXT_PUBLIC_ORIGIN!);

        return installLink;
    }

    // Apple Wallet methods
    public static async getApplePassBuffer_PassTypeAndSerial(passTypeIdentifier: string, serialNumber: string): Promise<Buffer> {
        const pass = await PassRepository.getApplePassBySerialNumberAndPassTypeIdentifier(serialNumber, passTypeIdentifier);
        if (pass === null) {
            throw new Error('Pass not found with serial number: ' + serialNumber);
        }
        const careerData = await CareerRepository.getCareerByCode(pass.universityId, pass.careerId);
        const passBuffer = await AppleManagerService.generatePass(pass, careerData.name);
        return passBuffer;
    }

    public static async getApplePassInfo(universityId: string, uniqueIdentifier: string, careerCode: string, installClient: boolean): Promise<Buffer> {
        const data = await PassRepository.getPass(universityId, uniqueIdentifier, careerCode);
        if (data.appleWalletSerialNumber === null) {
            // Create new serial number
            const serialNumber = crypto.randomUUID();
            const serialNumberWithoutDashes = serialNumber.replace(/-/g, '');
            data.appleWalletSerialNumber = serialNumberWithoutDashes;

            await PassRepository.update_AppleWalletSerialNumber(uniqueIdentifier, careerCode, universityId, serialNumberWithoutDashes);
        }
        const careerData = await CareerRepository.getCareerByCode(data.universityId, data.careerId);
        const passBuffer = await AppleManagerService.generatePass(data, careerData.name);

        if (installClient) {
            // Mark this pass as apple installed
            await PassRepository.update_InstallationStatus(uniqueIdentifier, careerCode, universityId, {
                googleInstallationStatus: undefined,
                appleInstallationStatus: InstallationStatus.Installed,
            });
        }

        return passBuffer;
    }

    public static async updateCashback(universityId: string, updateRequest: UpdateCashbackRequest): Promise<number> {
        const result = await PassRepository.updateMany_Cashback(universityId, updateRequest.data);
        return result;
    }

    public static async updatePassDue(universityId: string, updateRequest: UpdatePassDueRequest): Promise<number> {
        const result = await PassRepository.updateMany_PaymentStatus_Due(universityId, updateRequest.data);
        return result;
    }

    public static async updatePassPaid(universityId: string, updateRequest: UpdatePassPaidRequest): Promise<number> {
        const result = await PassRepository.updateMany_PaymentStatus_Paid(updateRequest.data.map(item => ({ uniqueIdentifier: item.uniqueIdentifier, careerId: item.careerId, universityId })));
        return result;
    }
}