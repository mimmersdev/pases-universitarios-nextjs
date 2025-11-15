import { ServiceErrorOrigin, ServiceErrorType } from "@/domain/Error";
import { ErrorHandler_Service } from "./ErrorHandler";
import { Career, City, CreatePass, getPassStatusLabel, getPaymentStatusLabel, Pass, SimplePass, University } from "pases-universitarios";
import { PassRepository } from "../db/repositories/pass-repository";
import { FilteredPaginationRequest } from "@/domain/FilteredPagination";
import { PaginationResponse } from "mimmers-core-nodejs";
import { AppleWalletManager, GoogleWallet_FrontFieldPaths, GoogleWalletCredentials, GoogleWalletManager, LinkModuleData } from "pases-universitarios/wallet";
import { ConfigRepository } from "../db/repositories/config-repository";
import { UniversityRepository } from "../db/repositories/university-repository";
import { CareerRepository } from "../db/repositories/career-repository";
import { CityRepository } from "../db/repositories/city-repository";
import { InstallData_Google } from "@/domain/InstallData";
import { AppleManagerService } from "./apple/apple-manager-service";
import { GoogleManagerService } from "./google/google-manager-service";
import apn from '@parse/node-apn';
import { AppleDeviceRepository } from "../db/repositories/apple-device-repository";

const errorHandler = new ErrorHandler_Service(ServiceErrorOrigin.PASSES);
export class PassService {
    public static async createPass(universityId: string, req: CreatePass): Promise<Pass> {
        const pass = await PassRepository.createPass(universityId, req);
        return pass;
    }

    public static async createMany(universityId: string, req: CreatePass[]): Promise<number> {
        const count = await PassRepository.createMany(universityId, req);
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

    public static async getPaginatedPasses(universityId: string, pRequest: FilteredPaginationRequest): Promise<PaginationResponse<Pass>> {
        const passes = await PassRepository.getPaginatedPasses(universityId, pRequest);
        return passes;
    }

    public static async sendOpenNotification(universityId: string, filters: FilteredPaginationRequest, header: string, body: string): Promise<void> {
        // Get all passes that match the filters
        const passes = await PassRepository.getPassesByFilters(universityId, filters);
        
        if (passes.length === 0) {
            return; // No passes to notify
        }

        // Extract ids from passes
        const ids = passes.map(pass => ({ uniqueIdentifier: pass.uniqueIdentifier, careerId: pass.careerId }));

        // Update all passes with the notification data
        await PassRepository.update_InformationField(universityId, ids, body);
        
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


        for(const pass of passes) {
            if(pass.googleWalletObjectID !== null) {
                const googleProps = await GoogleManagerService.getGoogleWalletIssuePropsFromPass(universityData, pass.careerName, pass.cityName, pass);
                await googleWalletManager.updatePass(pass.googleWalletObjectID, googleProps);
                await googleWalletManager.sendPassNotification(pass.googleWalletObjectID, header, body);               
            }
        }

        await AppleWalletManager.sendSilentPushNotification(apnProvider, appleDevices.map((device) => ({
            passSerialNumber: device.serialNumber,
            pushToken: device.pushToken,
            passTypeIdentifier: device.passTypeIdentifier,
        })));
    }

    // Google Wallet methods
    public static async getInstallationData_Google(universityId: string, uniqueIdentifier: string, careerId: string): Promise<InstallData_Google> {
        const data = await PassRepository.getPass(universityId, uniqueIdentifier, careerId);
        const universityData = await UniversityRepository.getUniversityById(universityId);
        const careerData = await CareerRepository.getCareerByCode(universityId, careerId);
        const cityData = await CityRepository.getCityByCode(universityId, data.cityId);

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
        if(config === null) {
            // Create class ID
            classId = await googleWalletManager.createPassClass(process.env.CLIENT_NAME!);
            // Create config
            await ConfigRepository.createConfig({ googleWalletClassId: classId });
        } else {
            // Get class ID
            classId = config.googleWalletClassId;
        }

        if(data.googleWalletObjectID === null) {
            // Create object ID and get install link
            // Create random string of 15 characters
            const objectId = Math.random().toString(36).substring(2, 15);
            // Update pass with object ID
            await PassRepository.update_GoogleWalledIdentication(universityId, uniqueIdentifier, careerId, objectId);
            // Get install link
            const installLink = await this.getInstallLink_Google(googleWalletManager, universityData, data, careerData, cityData, objectId, classId);
            return { installLink };
        } else {
            // Get install link
            const installLink = await this.getInstallLink_Google(googleWalletManager, universityData, data, careerData, cityData, data.googleWalletObjectID, classId);
            return { installLink };
        }
    }

    private static async getInstallLink_Google(googleWalletManager: GoogleWalletManager, universityData: University, data: Pass, careerData: Career, cityData: City, objectId: string, classId: string): Promise<string> {
        const googleProps = await GoogleManagerService.getGoogleWalletIssuePropsFromPass(universityData, careerData.name, cityData.name, data);

        const installLink = await googleWalletManager.createPass(objectId, classId, googleProps, process.env.NEXT_PUBLIC_ORIGIN!);

        return installLink;
    }

    // Apple Wallet methods
    public static async getApplePassBuffer_PassTypeAndSerial(passTypeIdentifier: string, serialNumber: string): Promise<Buffer> {
        const pass = await PassRepository.getApplePassBySerialNumberAndPassTypeIdentifier(serialNumber, passTypeIdentifier);
        if(pass === null) {
            throw new Error('Pass not found with serial number: ' + serialNumber);
        }
        const passBuffer = await AppleManagerService.generatePass(pass);
        return passBuffer;
    }

    public static async getApplePassInfo(universityId: string, uniqueIdentifier: string, careerCode: string): Promise<Buffer> {
        const data = await PassRepository.getPass(universityId, uniqueIdentifier, careerCode);
        if(data.appleWalletSerialNumber === null) {
            // Create new serial number
            const serialNumber = crypto.randomUUID();
            const serialNumberWithoutDashes = serialNumber.replace(/-/g, '');
            data.appleWalletSerialNumber = serialNumberWithoutDashes;

            await PassRepository.update_AppleWalletSerialNumber(uniqueIdentifier, careerCode, universityId, serialNumberWithoutDashes);
        }
        const passBuffer = await AppleManagerService.generatePass(data);
        return passBuffer;
    }
}