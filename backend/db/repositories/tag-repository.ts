import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { CreateTag, Tag, UpdateTag } from "pases-universitarios";
import { db } from "../config";
import { tags } from "../schema";
import { and, asc, count, eq, ilike, SQL } from "drizzle-orm";
import { PaginationRequest, PaginationResponse } from "mimmers-core-nodejs";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.TAGS);

export class TagRepository {
    public static async createTag(universityId: string, req: CreateTag): Promise<Tag> {
        try {
            const [tag] = await db.insert(tags).values({
                ...req,
                universityId,
            }).returning();
            return this.mapToDomain(tag);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async getTagById(id: string): Promise<Tag> {
        try {
            const tag = await db.query.tags.findFirst({
                where: eq(tags.id, id),
            });
            if (tag === undefined) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
            return this.mapToDomain(tag);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async getPaginatedTags(pRequest: PaginationRequest, name?: string): Promise<PaginationResponse<Tag>> {
        try {
            const conditions: SQL[] = [];
            // Find tags with name like
            if(name && name.length > 0) {
                conditions.push(ilike(tags.name, `%${name}%`));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
            
            const [result, total] = await Promise.all([
                db.select().from(tags).where(whereClause).limit(pRequest.size).offset(pRequest.page * pRequest.size),
                db.select({ count: count() }).from(tags).where(whereClause)
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

    public static async getTags(): Promise<Tag[]> {
        try {
            const result = await db.select().from(tags);
            return result.map(this.mapToDomain);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async updateTag(id: string, req: UpdateTag): Promise<Tag> {
        try {
            const [tag] = await db.update(tags).set(req).where(eq(tags.id, id)).returning();
            return this.mapToDomain(tag);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static mapToDomain(tag: typeof tags.$inferSelect): Tag {
        return {
            id: tag.id,
            universityId: tag.universityId,
            name: tag.name,
            type: tag.type,
            description: tag.description,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt,
        }
    }
}
