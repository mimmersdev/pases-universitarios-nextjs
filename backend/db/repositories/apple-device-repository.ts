import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { AppleDeviceRegistration } from "@/domain/Apple";
import { db } from "../config";
import { appleDevices, passes } from "../schema";
import { and, eq, sql } from "drizzle-orm";
import { processChunksInParallel } from "mimmers-core-nodejs";
import { DB_CONFIGURATION } from "@/config/database";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.APPLE_DEVICE);

export class AppleDeviceRepository {
    public static async registerDevice(serialNumber: string, universityId: string, uniqueIdentifier: string, careerId: string, deviceLibraryIdentifier: string, passTypeIdentifier: string, pushToken: string): Promise<AppleDeviceRegistration> {
        try {
            const [device] = await db.insert(appleDevices).values({
                universityId,
                uniqueIdentifier,
                careerId,
                deviceLibraryIdentifier,
                passTypeIdentifier,
                pushToken,
            }).returning();
            return this.mapToDomain({ ...device, serialNumber });
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async getDevicesForPass(universityId: string, uniqueIdentifier: string, careerId: string): Promise<AppleDeviceRegistration[]> {
        try {
            const devices = await db.query.appleDevices.findMany({
                where: and(eq(appleDevices.universityId, universityId), eq(appleDevices.uniqueIdentifier, uniqueIdentifier), eq(appleDevices.careerId, careerId)),
                with: {
                    pass: {
                        columns: {
                            appleWalletSerialNumber: true,
                        }
                    },
                },
            });
            return devices.map((device) => this.mapToDomain({ ...device, serialNumber: device.pass.appleWalletSerialNumber }));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getDevicesByIds(ids: { universityId: string, uniqueIdentifier: string, careerId: string }[]): Promise<AppleDeviceRegistration[]> {
        try {
            const results = await processChunksInParallel(
                ids,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_QUERY,
                async (chunk) => {
                    // Build tuples for composite key matching
                    const tuples = chunk.map(id => sql`(${id.uniqueIdentifier}, ${id.careerId}, ${id.universityId})`);

                    const results = await db.query.appleDevices.findMany({
                        where: sql`(${appleDevices.uniqueIdentifier}, ${appleDevices.careerId}, ${appleDevices.universityId}) IN (${sql.join(tuples, sql`, `)})`,
                        with: {
                            pass: {
                                columns: {
                                    appleWalletSerialNumber: true,
                                }
                            }
                        }
                    });
                    return results.map((device) => this.mapToDomain({ ...device, serialNumber: device.pass.appleWalletSerialNumber }));
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );

            return results.flat();
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async listAppleSerialByDeviceAndPass(deviceLibraryIdentifier: string, passTypeIdentifier: string): Promise<string[]> {
        try {
            const devices = await db.query.appleDevices.findMany({
                where: and(eq(appleDevices.deviceLibraryIdentifier, deviceLibraryIdentifier), eq(appleDevices.passTypeIdentifier, passTypeIdentifier)),
                with: {
                    pass: {
                        columns: {
                            appleWalletSerialNumber: true,
                        }
                    }
                }
            });
            return devices.map((device) => device.pass.appleWalletSerialNumber).filter((serialNumber) => serialNumber !== null);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async unregisterDevice(deviceLibraryIdentifier: string, passTypeIdentifier: string, serialNumber: string): Promise<void> {
        try {
            // Find pass based on passTypeIdentifier and serialNumber
            const pass = await db
                .select()
                .from(passes)
                .innerJoin(appleDevices, and(eq(passes.uniqueIdentifier, appleDevices.uniqueIdentifier), eq(passes.careerId, appleDevices.careerId), eq(passes.universityId, appleDevices.universityId)))
                .where(and(eq(passes.appleWalletSerialNumber, serialNumber), eq(appleDevices.passTypeIdentifier, passTypeIdentifier)))
                .limit(1);
            if (pass.length === 0) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }

            const passData = pass[0].passes;

            // Unregister device
            await db
                .delete(appleDevices)
                .where(and(
                    eq(appleDevices.deviceLibraryIdentifier, deviceLibraryIdentifier),
                    eq(appleDevices.passTypeIdentifier, passTypeIdentifier),
                    eq(appleDevices.universityId, passData.universityId),
                    eq(appleDevices.uniqueIdentifier, passData.uniqueIdentifier),
                    eq(appleDevices.careerId, passData.careerId),
                ));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.DELETE, error);
        }
    }

    public static mapToDomain(dto: typeof appleDevices.$inferSelect & { serialNumber: string | null }): AppleDeviceRegistration {
        if (dto.serialNumber === null) {
            throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
        }
        return {
            universityId: dto.universityId,
            uniqueIdentifier: dto.uniqueIdentifier,
            careerId: dto.careerId,
            deviceLibraryIdentifier: dto.deviceLibraryIdentifier,
            passTypeIdentifier: dto.passTypeIdentifier,
            serialNumber: dto.serialNumber,
            pushToken: dto.pushToken,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
        }
    }
}