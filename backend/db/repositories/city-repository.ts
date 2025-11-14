import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { City, CreateCity, UpdateCity } from "pases-universitarios";
import { db } from "../config";
import { cities } from "../schema";
import { PaginationRequest, PaginationResponse } from "mimmers-core-nodejs";
import { and, count, eq } from "drizzle-orm";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.CITIES);

export class CityRepository {
    public static async createCity(universityId: string, req: CreateCity): Promise<City> {
        try {
            const [city] = await db.insert(cities).values({
                ...req,
                universityId,
            }).returning();
            return this.mapToDomain(city);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async createMany(universityId: string, req: CreateCity[]): Promise<number> {
        try {
            const result = await db.insert(cities).values(req.map(r => ({
                ...r,
                universityId,
            }))).returning();
            return result.length;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }
    
    public static async getCityByCode(universityId: string, code: string): Promise<City> {
        try {
            const city = await db.query.cities.findFirst({
                where: and(eq(cities.code, code), eq(cities.universityId, universityId)),
            });
            if (city === undefined) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
            return this.mapToDomain(city);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getPaginatedCities(universityId: string, pRequest: PaginationRequest): Promise<PaginationResponse<City>> {
        try {
            const [result, total] = await Promise.all([
                db.select().from(cities).where(eq(cities.universityId, universityId)).limit(pRequest.size).offset(pRequest.page * pRequest.size),
                db.select({ count: count() }).from(cities).where(eq(cities.universityId, universityId))
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

    public static async getCities(universityId: string): Promise<City[]> {
        try {
            const result = await db.select().from(cities).where(eq(cities.universityId, universityId));
            return result.map(this.mapToDomain);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async updateCity(universityId: string, code: string, req: UpdateCity): Promise<City> {
        try {
            const [city] = await db.update(cities).set(req).where(and(eq(cities.code, code), eq(cities.universityId, universityId))).returning();
            return this.mapToDomain(city);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static mapToDomain(city: typeof cities.$inferSelect): City {
        return {
            code: city.code,
            universityId: city.universityId,
            name: city.name,
            createdAt: city.createdAt,
            updatedAt: city.updatedAt,
        }
    }
}