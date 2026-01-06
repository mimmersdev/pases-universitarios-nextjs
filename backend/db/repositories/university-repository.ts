import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { CreateUniversity, University, UpdateUniversity } from "pases-universitarios";
import { db } from "../config";
import { universities } from "../schema";
import { asc, count, desc, eq, and, SQL } from "drizzle-orm";
import { PaginationRequest, PaginationResponse } from "mimmers-core-nodejs";
import { SortType, UniversityPaginationRequest } from "@/domain/FilteredPagination";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.UNIVERSITIES);

export class UniversityRepository {
    public static async createUniversity(req: CreateUniversity): Promise<University> {
        try {
            const [university] = await db.insert(universities).values(req).returning();
            return this.mapToDomain(university);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async getUniversityById(id: string): Promise<University> {
        try {
            const university = await db.query.universities.findFirst({
                where: eq(universities.id, id),
            });
            if (university === undefined) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
            return this.mapToDomain(university);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getPaginatedUniversities(pRequest: UniversityPaginationRequest): Promise<PaginationResponse<University>> {
        try {
            const sortContiditions: SQL[] = [];
            if(pRequest.sortName) {
                if(pRequest.sortName === SortType.ASC) {
                    sortContiditions.push(asc(universities.name));
                } else {
                    sortContiditions.push(desc(universities.name));
                }
            }
            if(pRequest.sortCreatedAt) {
                if(pRequest.sortCreatedAt === SortType.ASC) {
                    sortContiditions.push(asc(universities.createdAt));
                } else {
                    sortContiditions.push(desc(universities.createdAt));
                }
            }
            if(pRequest.sortUpdatedAt) {
                if(pRequest.sortUpdatedAt === SortType.ASC) {
                    sortContiditions.push(asc(universities.updatedAt));
                } else {
                    sortContiditions.push(desc(universities.updatedAt));
                }
            }

            // If there are no sort conditions, default to createdAt ascending
            if(sortContiditions.length === 0) {
                sortContiditions.push(asc(universities.createdAt));
            }

            const [result, total] = await Promise.all([
                db.select().from(universities).orderBy(...sortContiditions).limit(pRequest.size).offset(pRequest.page * pRequest.size),
                db.select({ count: count() }).from(universities)
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

    public static async getUniversities(): Promise<University[]> {
        try {
            const result = await db.select().from(universities);
            return result.map(this.mapToDomain);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async updateUniversity(id: string, req: UpdateUniversity): Promise<University> {
        try {
            const [university] = await db.update(universities).set(req).where(eq(universities.id, id)).returning();
            return this.mapToDomain(university);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static mapToDomain(university: typeof universities.$inferSelect): University {
        return {
            id: university.id,
            name: university.name,
            createdAt: university.createdAt,
            updatedAt: university.updatedAt,
        }
    }
}

