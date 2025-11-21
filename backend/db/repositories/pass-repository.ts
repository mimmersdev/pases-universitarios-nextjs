import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { appleDevices, passes, passUpdates } from "../schema";
import { CreatePass, CreatePassBackend, InstallationStatus, ListComparation, Pass, PassStatus, PaymentStatus, SimplePass, SimplePass_Extra, UpdatePassDue } from "pases-universitarios";
import { db } from "../config";
import { PaginationResponse, processChunksInParallel, processChunksInParallelWithSum, processPaginatedWithProgress } from "mimmers-core-nodejs";
import { DB_CONFIGURATION } from "@/config/database";
import { and, asc, between, count, eq, gt, gte, inArray, lt, lte, notInArray, or, SQL, sql } from "drizzle-orm";
import { FilteredPaginationRequest } from "@/domain/FilteredPagination";
import { buildComparison } from "../utils";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.PASSES);

type SimplePassSelectType = {
    uniqueIdentifier: string;
    careerId: string;
    universityId: string;
    cashback: string;
    createdAt: Date;
    updatedAt: Date;
    passStatus: PassStatus;
    googleWalletObjectId: string | null;
    appleWalletSerialNumber: string | null;
    googleInstallationStatus: InstallationStatus;
    appleInstallationStatus: InstallationStatus;
    notificationCount: number;
    lastNotificationDate: Date | null;
}

export class PassRepository {

    public static async createPass(universityId: string, req: CreatePassBackend,): Promise<Pass> {
        try {
            const [pass] = await db.insert(passes).values({
                ...req,
                universityId,
                passStatus: PassStatus.Active,
                totalToPay: String(req.totalToPay),
                cashback: String(req.cashback),
                photo1Url: req.photo1Url,
                photo2Url: req.photo2Url,
                photo3Url: req.photo3Url,
            }).returning();
            return this.mapToDomain(pass);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async createMany(universityId: string, req: CreatePassBackend[]): Promise<number> {
        try {
            const result = await db.insert(passes).values(req.map(pass => ({
                ...pass,
                universityId,
                passStatus: PassStatus.Active,
                totalToPay: String(pass.totalToPay),
                cashback: String(pass.cashback),
                photo1Url: pass.photo1Url,
                photo2Url: pass.photo2Url,
                photo3Url: pass.photo3Url,
            })))
            return result.rowCount || 0;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async getPass(universityId: string, uniqueIdentifier: string, careerId: string): Promise<Pass> {
        try {
            const pass = await db.query.passes.findFirst({
                where: and(eq(passes.uniqueIdentifier, uniqueIdentifier), eq(passes.careerId, careerId), eq(passes.universityId, universityId)),
            });
            if (pass === undefined) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
            return this.mapToDomain(pass);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getPassByAppleSerialNumber(serialNumber: string): Promise<Pass | null> {
        try {
            const pass = await db.query.passes.findFirst({
                where: eq(passes.appleWalletSerialNumber, serialNumber),
            });
            if (pass === undefined) {
                return null;
            }
            return this.mapToDomain(pass);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getApplePassBySerialNumberAndPassTypeIdentifier(serialNumber: string, passTypeIdentifier: string): Promise<Pass | null> {
        try {
            const pass = await db.
                select()
                .from(passes)
                .innerJoin(appleDevices, and(eq(passes.uniqueIdentifier, appleDevices.uniqueIdentifier), eq(passes.careerId, appleDevices.careerId), eq(passes.universityId, appleDevices.universityId)))
                .where(and(eq(passes.appleWalletSerialNumber, serialNumber), eq(appleDevices.passTypeIdentifier, passTypeIdentifier)))
                .limit(1);
            if (pass.length === 0) {
                return null;
            }
            return this.mapToDomain(pass[0].passes);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getSimplePass(universityId: string, uniqueIdentifier: string, careerId: string): Promise<SimplePass> {
        try {
            const pass = await db.query.passes.findFirst({
                where: and(eq(passes.universityId, universityId), eq(passes.uniqueIdentifier, uniqueIdentifier), eq(passes.careerId, careerId)),
                columns: {
                    uniqueIdentifier: true,
                    careerId: true,
                    universityId: true,
                    cashback: true,
                    passStatus: true,
                    googleWalletObjectId: true,
                    appleWalletSerialNumber: true,
                    googleInstallationStatus: true,
                    appleInstallationStatus: true,
                    notificationCount: true,
                    lastNotificationDate: true,
                    createdAt: true,
                    updatedAt: true
                }
            })

            if (pass === undefined) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }

            return this.mapToDomain_SimplePass(pass);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getPaginatedPasses(universityId: string, pRequest: FilteredPaginationRequest): Promise<PaginationResponse<Pass>> {
        try {
            const conditions: SQL[] = [
                eq(passes.universityId, universityId),
            ];

            if (pRequest.filters) {
                const { filters } = pRequest;

                // IN filters
                if (filters.paymentStatus && filters.paymentStatus.length > 0) {
                    conditions.push(inArray(passes.paymentStatus, filters.paymentStatus));
                }

                // Boolean filters
                if (filters.graduated !== undefined) {
                    conditions.push(eq(passes.graduated, filters.graduated));
                }
                if (filters.currentlyStudying !== undefined) {
                    conditions.push(eq(passes.currentlyStudying, filters.currentlyStudying));
                }

                // Complex filters
                if (filters.careerId && filters.careerId.values.length > 0) {
                    if (filters.careerId.comparation === ListComparation.Include) {
                        conditions.push(inArray(passes.careerId, filters.careerId.values));
                    } else {
                        conditions.push(notInArray(passes.careerId, filters.careerId.values));
                    }
                }

                if (filters.semester) {
                    if ('singleValue' in filters.semester) {
                        const condition = buildComparison(passes.semester, filters.semester.singleValue, filters.semester.comparation);
                        conditions.push(condition);
                    } else {
                        conditions.push(inArray(passes.semester, filters.semester.list));
                    }
                }

                if (filters.enrollmentYear) {
                    if ('singleValue' in filters.enrollmentYear) {
                        const condition = buildComparison(passes.enrollmentYear, filters.enrollmentYear.singleValue, filters.enrollmentYear.comparation);
                        conditions.push(condition);
                    } else {
                        conditions.push(inArray(passes.enrollmentYear, filters.enrollmentYear.list));
                    }
                }

                if (filters.totalToPay) {
                    const condition = buildComparison(passes.totalToPay, String(filters.totalToPay.singleValue), filters.totalToPay.comparation);
                    conditions.push(condition);
                }

                if (filters.endDueDate) {
                    if ('singleDate' in filters.endDueDate) {
                        filters.endDueDate
                        const condition = buildComparison(passes.endDueDate, filters.endDueDate.singleDate, filters.endDueDate.comparation);
                        conditions.push(condition);
                    } else {
                        conditions.push(between(passes.endDueDate, filters.endDueDate.startDate, filters.endDueDate.endDate));
                    }
                }
            }

            const whereClause = and(...conditions);

            const [result, total] = await Promise.all([
                db.select().from(passes).where(whereClause).limit(pRequest.size).offset(pRequest.page * pRequest.size),
                db.select({ count: count() }).from(passes).where(whereClause)
            ]);
            return {
                content: result.map(this.mapToDomain),
                total: total[0].count,
                page: pRequest.page,
                size: pRequest.size
            };
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    private static async getPassesToBeDueInDaysPage(
        daysFromNow: number,
        offset: number,
        limit: number
    ): Promise<SimplePass[]> {
        try {
            if (daysFromNow < 0) {
                throw new Error('Days from now must be a positive number');
            }

            const targetDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
            const nextDay = new Date(Date.now() + (daysFromNow + 1) * 24 * 60 * 60 * 1000);

            const passesResult = await db.query.passes.findMany({
                columns: {
                    uniqueIdentifier: true,
                    careerId: true,
                    universityId: true,
                    cashback: true,
                    passStatus: true,
                    googleWalletObjectId: true,
                    appleWalletSerialNumber: true,
                    googleInstallationStatus: true,
                    appleInstallationStatus: true,
                    notificationCount: true,
                    lastNotificationDate: true,
                    createdAt: true,
                    updatedAt: true
                },
                where: and(
                    eq(passes.paymentStatus, PaymentStatus.Due),
                    eq(passes.passStatus, PassStatus.Active),
                    or(eq(passes.googleInstallationStatus, InstallationStatus.Installed), eq(passes.appleInstallationStatus, InstallationStatus.Installed)),
                    gte(passes.endDueDate, targetDate),
                    lt(passes.endDueDate, nextDay)
                ),
                limit,
                offset,
                orderBy: [asc(passes.endDueDate)] // Consistent ordering for pagination
            });
            return passesResult.map(this.mapToDomain_SimplePass);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    private static async countPassesToBeDueInDays(daysFromNow: number): Promise<number> {
        try {
            if (daysFromNow < 0) {
                throw new Error('Days from now must be a positive number');
            }

            const targetDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
            const nextDay = new Date(Date.now() + (daysFromNow + 1) * 24 * 60 * 60 * 1000);

            const result = await db.select({ count: sql<number>`count(*)` })
                .from(passes)
                .where(and(
                    eq(passes.paymentStatus, PaymentStatus.Due),
                    eq(passes.passStatus, PassStatus.Active),
                    or(eq(passes.googleInstallationStatus, InstallationStatus.Installed), eq(passes.appleInstallationStatus, InstallationStatus.Installed)),
                    gte(passes.endDueDate, targetDate),
                    lt(passes.endDueDate, nextDay)
                ));

            return result[0]?.count || 0;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    // This method DOES NOT filter by installation status
    // Since users could not have installed the pass, but we still need to know which passes expired yesterday
    // Not only for sending notifications but also for updating those passes as overdue
    private static async countPassesThatExpiredYesterday(): Promise<number> {
        try {
            // Calculate yesterday's date range (start of yesterday to end of yesterday)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const endOfYesterday = new Date(yesterday);
            endOfYesterday.setHours(23, 59, 59, 999);

            const result = await db.select({ count: sql<number>`count(*)` })
                .from(passes)
                .where(and(
                    eq(passes.paymentStatus, PaymentStatus.Due),
                    eq(passes.passStatus, PassStatus.Active),
                    gte(passes.endDueDate, yesterday),
                    lte(passes.endDueDate, endOfYesterday)
                ));

            return result[0]?.count || 0;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    private static async getPassesThatExpiredYesterdayPage(
        offset: number,
        limit: number
    ): Promise<SimplePass[]> {
        try {
            // Calculate yesterday's date range (start of yesterday to end of yesterday)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);

            const endOfYesterday = new Date(yesterday);
            endOfYesterday.setHours(23, 59, 59, 999);

            const passesResult = await db.query.passes.findMany({
                columns: {
                    uniqueIdentifier: true,
                    careerId: true,
                    universityId: true,
                    cashback: true,
                    passStatus: true,
                    googleWalletObjectId: true,
                    appleWalletSerialNumber: true,
                    googleInstallationStatus: true,
                    appleInstallationStatus: true,
                    notificationCount: true,
                    lastNotificationDate: true,
                    createdAt: true,
                    updatedAt: true
                },
                where: and(
                    eq(passes.paymentStatus, PaymentStatus.Due),
                    eq(passes.passStatus, PassStatus.Active),
                    gte(passes.endDueDate, yesterday),
                    lte(passes.endDueDate, endOfYesterday)
                ),
                limit,
                offset,
                orderBy: [asc(passes.endDueDate)] // Consistent ordering for pagination
            });
            return passesResult.map(this.mapToDomain_SimplePass);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Gets ALL digital passes that are going to expire in exactly N days using parallel processing
     * @param daysFromNow - Number of days from now when passes will expire
     * @param onProgress - Progress callback function
     * @returns All digital passes that are going to expire
     */
    public static async getAllPassesToBeDueInDays(
        daysFromNow: number,
        onProgress?: (currentPage: number, totalPages: number, recordsProcessed: number) => void
    ): Promise<SimplePass[]> {
        try {
            if (daysFromNow < 0) {
                throw new Error('Days from now must be a positive number');
            }

            // First, count total records
            const totalCount = await this.countPassesToBeDueInDays(daysFromNow);

            if (totalCount === 0) {
                return [];
            }

            console.log(`Found ${totalCount} passes expiring in ${daysFromNow} days, processing in parallel...`);

            // Use parallel processing with progress tracking
            return await processPaginatedWithProgress(
                totalCount,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_QUERY,
                (offset: number, limit: number) => this.getPassesToBeDueInDaysPage(daysFromNow, offset, limit),
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS,
                onProgress
            );
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Gets ALL digital passes that expired yesterday using parallel processing
     * @param clientId - The client ID
     * @param onProgress - Progress callback function
     * @returns All digital passes that expired yesterday
     */
    public static async getAllPassesThatExpiredYesterday(
        onProgress?: (currentPage: number, totalPages: number, recordsProcessed: number) => void
    ): Promise<SimplePass[]> {
        try {
            // First, count total records
            const totalCount = await this.countPassesThatExpiredYesterday();

            if (totalCount === 0) {
                return [];
            }

            console.log(`Found ${totalCount} passes that expired yesterday, processing in parallel...`);

            // Use parallel processing with progress tracking
            return await processPaginatedWithProgress(
                totalCount,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_QUERY,
                (offset: number, limit: number) => this.getPassesThatExpiredYesterdayPage(offset, limit),
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS,
                onProgress
            );
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async update_GoogleWalledIdentication(universityId: string, uniqueIdentifier: string, careerId: string, googleWalletObjectId: string): Promise<void> {
        try {
            await db.update(passes).set({
                googleWalletObjectId,
                updatedAt: new Date()
            }).where(and(eq(passes.uniqueIdentifier, uniqueIdentifier), eq(passes.careerId, careerId), eq(passes.universityId, universityId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async update_AppleWalledIdentication(universityId: string, uniqueIdentifier: string, careerId: string, appleWalletSerialNumber: string): Promise<void> {
        try {
            await db.update(passes).set({
                appleWalletSerialNumber,
                updatedAt: new Date()
            }).where(and(eq(passes.uniqueIdentifier, uniqueIdentifier), eq(passes.careerId, careerId), eq(passes.universityId, universityId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async getPassesByFilters(universityId: string, pRequest: FilteredPaginationRequest): Promise<(Pass & { careerName: string, cityName: string })[]> {
        try {
            const conditions: SQL[] = [
                eq(passes.universityId, universityId),
            ];

            if (pRequest.filters) {
                const { filters } = pRequest;

                // IN filters
                if (filters.paymentStatus && filters.paymentStatus.length > 0) {
                    conditions.push(inArray(passes.paymentStatus, filters.paymentStatus));
                }

                // Boolean filters
                if (filters.graduated !== undefined) {
                    conditions.push(eq(passes.graduated, filters.graduated));
                }
                if (filters.currentlyStudying !== undefined) {
                    conditions.push(eq(passes.currentlyStudying, filters.currentlyStudying));
                }

                // Complex filters
                if (filters.careerId && filters.careerId.values.length > 0) {
                    if (filters.careerId.comparation === ListComparation.Include) {
                        conditions.push(inArray(passes.careerId, filters.careerId.values));
                    } else {
                        conditions.push(notInArray(passes.careerId, filters.careerId.values));
                    }
                }

                if (filters.semester) {
                    if ('singleValue' in filters.semester) {
                        const condition = buildComparison(passes.semester, filters.semester.singleValue, filters.semester.comparation);
                        conditions.push(condition);
                    } else {
                        conditions.push(inArray(passes.semester, filters.semester.list));
                    }
                }

                if (filters.enrollmentYear) {
                    if ('singleValue' in filters.enrollmentYear) {
                        const condition = buildComparison(passes.enrollmentYear, filters.enrollmentYear.singleValue, filters.enrollmentYear.comparation);
                        conditions.push(condition);
                    } else {
                        conditions.push(inArray(passes.enrollmentYear, filters.enrollmentYear.list));
                    }
                }

                if (filters.totalToPay) {
                    const condition = buildComparison(passes.totalToPay, String(filters.totalToPay.singleValue), filters.totalToPay.comparation);
                    conditions.push(condition);
                }

                if (filters.endDueDate) {
                    if ('singleDate' in filters.endDueDate) {
                        const condition = buildComparison(passes.endDueDate, filters.endDueDate.singleDate, filters.endDueDate.comparation);
                        conditions.push(condition);
                    } else {
                        conditions.push(between(passes.endDueDate, filters.endDueDate.startDate, filters.endDueDate.endDate));
                    }
                }
            }

            const whereClause = and(...conditions);

            const passesResult = await db.query.passes.findMany({
                where: whereClause,
                with: {
                    career: {
                        columns: {
                            name: true
                        }
                    },
                    city: {
                        columns: {
                            name: true
                        }
                    }
                }
            });

            return passesResult.map((pass) => ({
                ...this.mapToDomain(pass),
                careerName: pass.career.name,
                cityName: pass.city.name
            }));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getPassesByIds(universityId: string, ids: { uniqueIdentifier: string, careerId: string }[]): Promise<(Pass & { careerName: string, cityName: string })[]> {
        try {
            if (ids.length === 0) {
                return [];
            }

            const results = await processChunksInParallel(
                ids,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_QUERY,
                async (chunk) => {
                    // Build tuples for composite key matching (uniqueIdentifier, careerId, universityId)
                    const tuples = chunk.map(id => sql`(${id.uniqueIdentifier}, ${id.careerId}, ${universityId})`);

                    const passesResult = await db.query.passes.findMany({
                        where: sql`(${passes.uniqueIdentifier}, ${passes.careerId}, ${passes.universityId}) IN (${sql.join(tuples, sql`, `)})`,
                        with: {
                            career: {
                                columns: {
                                    name: true
                                }
                            },
                            city: {
                                columns: {
                                    name: true
                                }
                            }
                        }
                    });

                    return passesResult.map((pass) => ({
                        ...this.mapToDomain(pass),
                        careerName: pass.career.name,
                        cityName: pass.city.name
                    }));
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );

            return results.flat();
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async updateMany_Status(ids: { uniqueIdentifier: string, careerId: string, universityId: string }[], status: PassStatus): Promise<number> {
        try {
            return await processChunksInParallelWithSum(
                ids,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_UPDATE,
                async (chunk) => {
                    // Build tuples for composite key matching
                    const tuples = chunk.map(id => sql`(${id.uniqueIdentifier}, ${id.careerId}, ${id.universityId})`);

                    const result = await db.update(passes).set({
                        passStatus: status,
                        updatedAt: new Date()
                    }).where(sql`(${passes.uniqueIdentifier}, ${passes.careerId}, ${passes.universityId}) IN (${sql.join(tuples, sql`, `)})`);
                    return result.rowCount || 0;
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async updateMany_PaymentStatus_Paid(ids: { uniqueIdentifier: string, careerId: string, universityId: string }[]): Promise<number> {
        try {
            return await processChunksInParallelWithSum(
                ids,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_UPDATE,
                async (chunk) => {
                    const tuples = chunk.map(id => sql`(${id.uniqueIdentifier}, ${id.careerId}, ${id.universityId})`);
                    const result = await db.update(passes).set({
                        paymentStatus: PaymentStatus.Paid,
                        totalToPay: '0',
                        updatedAt: new Date()
                    }).where(sql`(${passes.uniqueIdentifier}, ${passes.careerId}) IN (${sql.join(tuples, sql`, `)})`);
                    return result.rowCount || 0;
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async updateMany_PaymentStatus_Due(universityId: string, req: UpdatePassDue[]): Promise<number> {
        try {
            const result = await processChunksInParallelWithSum(
                req,
                DB_CONFIGURATION.CHUNK_SIZES.COMPLEX_UPDATE,
                async (chunk) => {
                    // Insert update data into the auxiliary table
                    const updateData = chunk.map(item => ({
                        uniqueIdentifier: item.uniqueIdentifier,
                        careerId: item.careerId,
                        totalToPay: String(item.totalToPay),
                        endDueDate: item.endDueDate
                    }))
                    await db.insert(passUpdates).values(updateData.map(item => ({
                        ...item,
                        universityId,
                    })));

                    // Perform bulk update using JOIN with the auxiliary table
                    const result = await db.update(passes).set({
                        paymentStatus: PaymentStatus.Due,
                        totalToPay: passUpdates.totalToPay,
                        endDueDate: passUpdates.endDueDate,
                        updatedAt: new Date()
                    }).from(passUpdates).where(
                        and(
                            eq(passUpdates.uniqueIdentifier, passes.uniqueIdentifier),
                            eq(passUpdates.careerId, passes.careerId),
                            eq(passUpdates.universityId, passes.universityId)
                        )
                    )
                    return result.rowCount || 0;
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );

            // Clean THE WHOLE auxiliary table
            await db.delete(passUpdates);

            return result;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async updateMany_PaymentStatus_Overdue(ids: { uniqueIdentifier: string, careerId: string, universityId: string }[]): Promise<number> {
        try {
            return await processChunksInParallelWithSum(
                ids,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_UPDATE,
                async (chunk) => {
                    const tuples = chunk.map(id => sql`(${id.uniqueIdentifier}, ${id.careerId}, ${id.universityId})`);

                    const result = await db.update(passes).set({
                        paymentStatus: PaymentStatus.Overdue,
                        updatedAt: new Date()
                    }).where(sql`(${passes.uniqueIdentifier}, ${passes.careerId}, ${passes.universityId}) IN (${sql.join(tuples, sql`, `)})`);
                    return result.rowCount || 0;
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async update_InstallationStatus(
        uniqueIdentifier: string,
        careerId: string,
        universityId: string,
        installationData: {
            googleInstallationStatus: InstallationStatus,
            appleInstallationStatus: undefined,
        } | {
            googleInstallationStatus: undefined,
            appleInstallationStatus: InstallationStatus,
        } | {
            googleInstallationStatus: InstallationStatus,
            appleInstallationStatus: InstallationStatus,
        }
    ): Promise<void> {
        try {
            await db.update(passes).set({
                googleInstallationStatus: installationData.googleInstallationStatus,
                appleInstallationStatus: installationData.appleInstallationStatus,
                updatedAt: new Date()
            }).where(and(eq(passes.uniqueIdentifier, uniqueIdentifier), eq(passes.careerId, careerId), eq(passes.universityId, universityId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async updateNotificationCount(ids: { uniqueIdentifier: string, careerId: string, universityId: string }[]): Promise<number> {
        try {
            const now = new Date();
            return await processChunksInParallelWithSum(
                ids,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_UPDATE,
                async (chunk) => {
                    const tuples = chunk.map(id => sql`(${id.uniqueIdentifier}, ${id.careerId}, ${id.universityId})`);
                    const result = await db.update(passes).set({
                        notificationCount: sql`${passes.notificationCount} + 1`,
                        lastNotificationDate: now
                    }).where(sql`(${passes.uniqueIdentifier}, ${passes.careerId}) IN (${sql.join(tuples, sql`, `)})`);
                    return result.rowCount || 0;
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async resetNotificationCount(): Promise<number> {
        try {
            const now = new Date();
            const result = await db.update(passes).set({
                notificationCount: 0,
                lastNotificationDate: now
            }).where(and(
                gte(passes.lastNotificationDate, sql`${now} - INTERVAL '24 hours'`),
                gt(passes.notificationCount, 0)
            ));
            return result.rowCount || 0;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async update_AppleWalletSerialNumber(uniqueIdentifier: string, careerId: string, universityId: string, appleWalletSerialNumber: string): Promise<void> {
        try {
            await db.update(passes).set({
                appleWalletSerialNumber,
                updatedAt: new Date()
            }).where(and(eq(passes.uniqueIdentifier, uniqueIdentifier), eq(passes.careerId, careerId), eq(passes.universityId, universityId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async update_InformationField(universityId: string, ids: { uniqueIdentifier: string, careerId: string }[], informationField: string): Promise<number> {
        try {
            return await processChunksInParallelWithSum(
                ids,
                DB_CONFIGURATION.CHUNK_SIZES.SIMPLE_UPDATE,
                async (chunk) => {
                    // Build tuples for composite key matching
                    const tuples = chunk.map(id => sql`(${id.uniqueIdentifier}, ${id.careerId}, ${universityId})`);

                    const result = await db.update(passes).set({
                        informationField,
                    }).where(sql`(${passes.uniqueIdentifier}, ${passes.careerId}, ${universityId}) IN (${sql.join(tuples, sql`, `)})`);
                    return result.rowCount || 0;
                },
                DB_CONFIGURATION.CONNECTION.MAX_CONCURRENT_CHUNKS
            );
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static mapToDomain(pass: typeof passes.$inferSelect): Pass {
        return {
            uniqueIdentifier: pass.uniqueIdentifier,
            name: pass.name,
            email: pass.email,
            universityId: pass.universityId,
            cityId: pass.cityId,
            careerId: pass.careerId,
            semester: pass.semester,
            enrollmentYear: pass.enrollmentYear,
            paymentReference: pass.paymentReference,
            paymentStatus: pass.paymentStatus,
            status: pass.passStatus,
            totalToPay: Number(pass.totalToPay),
            startDueDate: pass.startDueDate,
            endDueDate: pass.endDueDate,
            cashback: Number(pass.cashback),
            onlinePaymentLink: pass.onlinePaymentUrl,
            academicCalendarLink: pass.academicCalendarUrl,
            graduated: pass.graduated,
            currentlyStudying: pass.currentlyStudying,
            googleWalletObjectID: pass.googleWalletObjectId,
            appleWalletSerialNumber: pass.appleWalletSerialNumber,
            googleWalletInstallationStatus: pass.googleInstallationStatus,
            appleWalletInstallationStatus: pass.appleInstallationStatus,
            notificationCount: pass.notificationCount,
            lastNotificationDate: pass.lastNotificationDate,
            informationField: pass.informationField,
            photo1Url: pass.photo1Url,
            photo2Url: pass.photo2Url,
            photo3Url: pass.photo3Url,
            createdAt: pass.createdAt,
            updatedAt: pass.updatedAt,
        }
    }

    public static mapToDomain_SimplePass(pass: SimplePassSelectType): SimplePass {
        return {
            uniqueIdentifier: pass.uniqueIdentifier,
            careerId: pass.careerId,
            universityId: pass.universityId,
            cashback: Number(pass.cashback),
            status: pass.passStatus,
            googleWalletObjectID: pass.googleWalletObjectId,
            appleWalletSerialNumber: pass.appleWalletSerialNumber,
            googleWalletInstallationStatus: pass.googleInstallationStatus,
            appleWalletInstallationStatus: pass.appleInstallationStatus,
            notificationCount: pass.notificationCount,
            lastNotificationDate: pass.lastNotificationDate,
            createdAt: pass.createdAt,
            updatedAt: pass.updatedAt,
        }
    }

    public static mapToDomain_SimplePass_Extra(pass: SimplePassSelectType & { careerName: string, cityName: string }): SimplePass_Extra {
        return {
            uniqueIdentifier: pass.uniqueIdentifier,
            careerId: pass.careerId,
            universityId: pass.universityId,
            cashback: Number(pass.cashback),
            status: pass.passStatus,
            googleWalletObjectID: pass.googleWalletObjectId,
            appleWalletSerialNumber: pass.appleWalletSerialNumber,
            googleWalletInstallationStatus: pass.googleInstallationStatus,
            appleWalletInstallationStatus: pass.appleInstallationStatus,
            notificationCount: pass.notificationCount,
            lastNotificationDate: pass.lastNotificationDate,
            createdAt: pass.createdAt,
            updatedAt: pass.updatedAt,
            careerName: pass.careerName,
            cityName: pass.cityName,
        }
    }
}