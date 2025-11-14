import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { CreateBooleanTag, BooleanTag, UpdateBooleanTag } from "pases-universitarios";
import { db } from "../config";
import { booleanTags } from "../schema";
import { and, eq } from "drizzle-orm";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.TAG_BOOLEAN);

export class TagBooleanRepository {
    public static async createTagBoolean(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string, req: CreateBooleanTag): Promise<BooleanTag> {
        try {
            const [tagBoolean] = await db.insert(booleanTags).values({
                value: req.value,
                universityId,
                careerId,
                uniqueIdentifier,
                tagId,
            }).returning();
            return this.mapToDomain(tagBoolean);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async updateTagBoolean(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string, req: UpdateBooleanTag): Promise<BooleanTag> {
        try {
            const [tagBoolean] = await db.update(booleanTags).set({
                value: req.value,
            }).where(and(eq(booleanTags.uniqueIdentifier, uniqueIdentifier), eq(booleanTags.careerId, careerId), eq(booleanTags.universityId, universityId), eq(booleanTags.tagId, tagId))).returning();
            return this.mapToDomain(tagBoolean);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async deleteTagBoolean(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string): Promise<void> {
        try {
            await db.delete(booleanTags).where(and(eq(booleanTags.uniqueIdentifier, uniqueIdentifier), eq(booleanTags.careerId, careerId), eq(booleanTags.universityId, universityId), eq(booleanTags.tagId, tagId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.DELETE, error);
        }
    }

    public static mapToDomain(tagBoolean: typeof booleanTags.$inferSelect): BooleanTag {
        return {
            uniqueIdentifier: tagBoolean.uniqueIdentifier,
            careerId: tagBoolean.careerId,
            universityId: tagBoolean.universityId,
            tagId: tagBoolean.tagId,
            value: tagBoolean.value,
            createdAt: tagBoolean.createdAt,
            updatedAt: tagBoolean.updatedAt,
        }
    }
}
