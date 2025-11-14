import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { CreateListTagOption, ListTag, ListTagOption, UpdateListTagOption } from "pases-universitarios";
import { db } from "../config";
import { listTags, listTagsOptions } from "../schema";
import { PaginationRequest, PaginationResponse } from "mimmers-core-nodejs";
import { and, count, eq, ilike, SQL } from "drizzle-orm";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.TAG_LIST);

export class TagListRepository {
    // Tag List Options
    public static async createTagListOption(tagId: string, req: CreateListTagOption): Promise<ListTagOption> {
        try {
            const [listTagOption] = await db.insert(listTagsOptions).values({
                ...req,
                tagId,
            }).returning();
            return this.mapToDomain_ListTagOption(listTagOption);

        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async getPaginatedTagListOptions(tagId: string, pRequest: PaginationRequest, value?: string): Promise<PaginationResponse<ListTagOption>> {
        try {
            const conditions: SQL[] = [
                eq(listTagsOptions.tagId, tagId)
            ];
            // Find options with value like
            if(value && value.length > 0) {
                conditions.push(ilike(listTagsOptions.value, `%${value}%`));
            }
            const whereClause = and(...conditions);
            
            const [result, total] = await Promise.all([
                db.select().from(listTagsOptions).where(whereClause).limit(pRequest.size).offset(pRequest.page * pRequest.size),
                db.select({ count: count() }).from(listTagsOptions).where(whereClause)
            ]);
            return {
                content: result.map(this.mapToDomain_ListTagOption),
                total: total[0].count,
                page: pRequest.page,
                size: pRequest.size
            };
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }

    }

    public static async updateTagListOption(tagId: string, optionId: string, req: UpdateListTagOption): Promise<ListTagOption> {
        try {
            const [listTagOption] = await db.update(listTagsOptions).set({
                ...req,
            }).where(and(eq(listTagsOptions.tagId, tagId), eq(listTagsOptions.id, optionId))).returning();
            return this.mapToDomain_ListTagOption(listTagOption);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async deleteTagListOption(tagId: string, optionId: string): Promise<void> {
        try {
            await db.delete(listTagsOptions).where(and(eq(listTagsOptions.tagId, tagId), eq(listTagsOptions.id, optionId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.DELETE, error);
        }
    }

    // Tag List

    public static async createTagList(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string, tagOptionId: string): Promise<ListTag> {
        try {
            const [listTag] = await db.insert(listTags).values({
                universityId,
                careerId,
                uniqueIdentifier,
                tagOptionId,
            }).returning();
            return this.mapToDomain_ListTag(listTag);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async deleteTagList(universityId: string, careerId: string, uniqueIdentifier: string, tagOptionId: string): Promise<void> {
        try {
            await db.delete(listTags).where(and(eq(listTags.universityId, universityId), eq(listTags.careerId, careerId), eq(listTags.uniqueIdentifier, uniqueIdentifier), eq(listTags.tagOptionId, tagOptionId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.DELETE, error);
        }
    }

    public static mapToDomain_ListTagOption(listTagOption: typeof listTagsOptions.$inferSelect): ListTagOption {
        return {
            id: listTagOption.id,
            tagId: listTagOption.tagId,
            value: listTagOption.value,
            createdAt: listTagOption.createdAt,
            updatedAt: listTagOption.updatedAt,
        }
    }

    public static mapToDomain_ListTag(listTag: typeof listTags.$inferSelect): ListTag {
        return {
            uniqueIdentifier: listTag.uniqueIdentifier,
            careerId: listTag.careerId,
            universityId: listTag.universityId,
            tagOptionId: listTag.tagOptionId,
            createdAt: listTag.createdAt,
            updatedAt: listTag.updatedAt,
        }
    }
}