import { Career, CreateCareer, UpdateCareer } from "pases-universitarios";
import { db } from "../config";
import { careers } from "../schema";
import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { and, count, eq } from "drizzle-orm";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { PaginationRequest, PaginationResponse } from "mimmers-core-nodejs";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.CAREERS);

export class CareerRepository {
    public static async createCareer(universityId: string, req: CreateCareer): Promise<Career> {
        try {

            const [career] = await db.insert(careers).values({
                ...req,
                universityId,
            }).returning();
            return this.mapToDomain(career);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async getCareerByCode(universityId: string, code: string): Promise<Career> {
        try {
            const career = await db.query.careers.findFirst({
                where: and(eq(careers.code, code), eq(careers.universityId, universityId))
            });
            if (career === undefined) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
            return this.mapToDomain(career);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getPaginatedCareers(universityId: string, pRequest: PaginationRequest): Promise<PaginationResponse<Career>> {
        try {
            const [result, total] = await Promise.all([
                db.select().from(careers).where(eq(careers.universityId, universityId)).limit(pRequest.size).offset(pRequest.page * pRequest.size),
                db.select({ count: count() }).from(careers).where(eq(careers.universityId, universityId))
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

    public static async getCareers(universityId: string): Promise<Career[]> {
        try {
            const result = await db.select().from(careers).where(eq(careers.universityId, universityId));
            return result.map(this.mapToDomain);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async updateCareer(universityId: string, code: string, req: UpdateCareer): Promise<Career> {
        try {
            const [career] = await db.update(careers).set(req).where(and(eq(careers.code, code), eq(careers.universityId, universityId))).returning();
            return this.mapToDomain(career);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static mapToDomain(career: typeof careers.$inferSelect): Career {
        return {
            code: career.code,
            universityId: career.universityId,
            name: career.name,
            createdAt: career.createdAt,
            updatedAt: career.updatedAt,
        }
    }
    
}