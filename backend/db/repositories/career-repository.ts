import { Career, CreateCareer, UpdateCareer } from "pases-universitarios";
import { db } from "../config";
import { careers } from "../schema";
import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { and, asc, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { PaginationResponse } from "mimmers-core-nodejs";
import { CareerPaginationRequest, SortType } from "@/domain/FilteredPagination";

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

    public static async getPaginatedCareers(universityId: string, pRequest: CareerPaginationRequest): Promise<PaginationResponse<Career>> {
        try {
            const sortContiditions: SQL[] = [];
            if(pRequest.sortCode) {
                if(pRequest.sortCode === SortType.ASC) {
                    sortContiditions.push(asc(careers.code));
                } else {
                    sortContiditions.push(desc(careers.code));
                }
            }
            if(pRequest.sortName) {
                if(pRequest.sortName === SortType.ASC) {
                    sortContiditions.push(asc(careers.name));
                } else {
                    sortContiditions.push(desc(careers.name));
                }
            }
            if(pRequest.sortCreatedAt) {
                if(pRequest.sortCreatedAt === SortType.ASC) {
                    sortContiditions.push(asc(careers.createdAt));
                } else {
                    sortContiditions.push(desc(careers.createdAt));
                }
            }
            if(pRequest.sortUpdatedAt) {
                if(pRequest.sortUpdatedAt === SortType.ASC) {
                    sortContiditions.push(asc(careers.updatedAt));
                } else {
                    sortContiditions.push(desc(careers.updatedAt));
                }
            }

            // If there are no sort conditions, default to createdAt ascending
            if(sortContiditions.length === 0) {
                sortContiditions.push(asc(careers.createdAt));
            }

            // Filters
            const filtersConditions: SQL[] = [];
            if(pRequest.searchName) {
                // Search in both name and code
                filtersConditions.push(
                    or(
                        ilike(careers.name, `%${pRequest.searchName}%`),
                        ilike(careers.code, `%${pRequest.searchName}%`)
                    )!
                );
            }

            const whereClause = and(eq(careers.universityId, universityId), ...filtersConditions);

            const [result, total] = await Promise.all([
                db.select().from(careers).where(whereClause).orderBy(...sortContiditions).limit(pRequest.size).offset(pRequest.page * pRequest.size),
                db.select({ count: count() }).from(careers).where(whereClause)
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