import { ServiceErrorOrigin, ServiceErrorType } from "@/domain/Error";
import { ErrorHandler_Service } from "./ErrorHandler";
import { Career, City, CreatePass, getPassStatusLabel, getPaymentStatusLabel, Pass, SimplePass, University } from "pases-universitarios";
import { PassRepository } from "../db/repositories/pass-repository";
import { FilteredPaginationRequest } from "@/domain/FilteredPagination";
import { PaginationResponse } from "mimmers-core-nodejs";
import { GoogleWallet_FrontFieldPaths, GoogleWalletCredentials, GoogleWalletManager, LinkModuleData } from "pases-universitarios/wallet";
import { ConfigRepository } from "../db/repositories/config-repository";
import { UniversityRepository } from "../db/repositories/university-repository";
import { CareerRepository } from "../db/repositories/career-repository";
import { CityRepository } from "../db/repositories/city-repository";
import { InstallData_Google } from "@/domain/InstallData";
import { AppleManagerService } from "./apple/apple-manager-service";

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
        const linksModuleData: LinkModuleData[] = [];
        if(data.onlinePaymentLink !== null) {
            linksModuleData.push({
                id: "onlinePaymentLink",
                uri: data.onlinePaymentLink,
                description: "Pagar Pase",
            });
        }
        if(data.academicCalendarLink !== null) {
            linksModuleData.push({
                id: "academicCalendarLink",
                uri: data.academicCalendarLink,
                description: "Calendario Académico",
            });
        }

        const installLink = await googleWalletManager.createPass(objectId, classId, {
            cardTitle: universityData.name,
            header: data.name,
            subheader: "Nombre",
            heroUri: "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/google-io-hero-demo-only.png",
            hexBackgroundColor: "#000000",
            logoUri: "https://storage.googleapis.com/wallet-lab-tools-codelab-artifacts-public/pass_google_logo.jpg",
            barcode: {
                value: data.paymentReference,
                alternativeText: data.paymentReference,
            },
            textModulesData: [
                {
                    id: GoogleWallet_FrontFieldPaths.PRIMARY_LEFT,
                    header: "Universidad",
                    body: universityData.name,
                },
                {
                    id: GoogleWallet_FrontFieldPaths.PRIMARY_RIGHT,
                    header: "Estado",
                    body: getPassStatusLabel(data.status),
                },
                {
                    id: GoogleWallet_FrontFieldPaths.SECONDARY_LEFT,
                    header: "Año de Ingreso",
                    body: data.enrollmentYear.toString(),
                },
                {
                    id: GoogleWallet_FrontFieldPaths.SECONDARY_RIGHT,
                    header: "Estado de Pago",
                    body: getPaymentStatusLabel(data.paymentStatus),
                },
                {
                    id: "totalToPay",
                    header: "Total a Pagar",
                    body: data.totalToPay.toString(),
                },
                {
                    id: "endDueDate",
                    header: "Fecha de Vencimiento",
                    body: data.endDueDate.toLocaleDateString(),
                },
                {
                    id: "cashback",
                    header: "Cashback",
                    body: data.cashback.toString(),
                },
                {
                    id: "career",
                    header: "Carrera",
                    body: careerData.name,
                },
                {
                    id: "semester",
                    header: "Semestre",
                    body: data.semester.toString(),
                },
                {
                    id: "city",
                    header: "Ciudad",
                    body: cityData.name,
                },
                {
                    id: "enrollmentYear",
                    header: "Año de Ingreso",
                    body: data.enrollmentYear.toString(),
                }
            ],
            linksModuleData: linksModuleData
        }, process.env.NEXT_PUBLIC_ORIGIN!);

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