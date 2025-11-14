import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { CreateNumericTag, NumericTag, UpdateNumericTag } from "pases-universitarios";
import { db } from "../config";
import { numericTags } from "../schema";
import { and, eq } from "drizzle-orm";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.TAG_NUMERIC);

export class TagNumericRepository {
    public static async createTagNumeric(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string, req: CreateNumericTag): Promise<NumericTag> {
        try {
            const [tagNumeric] = await db.insert(numericTags).values({
                value: req.value.toString(),
                universityId,
                careerId,
                uniqueIdentifier,
                tagId,
            }).returning();
            return this.mapToDomain(tagNumeric);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async updateTagNumeric(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string, req: UpdateNumericTag): Promise<NumericTag> {
        try {
            const [tagNumeric] = await db.update(numericTags).set({
                value: req.value.toString(),
            }).where(and(eq(numericTags.uniqueIdentifier, uniqueIdentifier), eq(numericTags.careerId, careerId), eq(numericTags.universityId, universityId), eq(numericTags.tagId, tagId))).returning();
            return this.mapToDomain(tagNumeric);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async deleteTagNumeric(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string): Promise<void> {
        try {
            await db.delete(numericTags).where(and(eq(numericTags.uniqueIdentifier, uniqueIdentifier), eq(numericTags.careerId, careerId), eq(numericTags.universityId, universityId), eq(numericTags.tagId, tagId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.DELETE, error);
        }
    }

    public static mapToDomain(tagNumeric: typeof numericTags.$inferSelect): NumericTag {
        return {
            uniqueIdentifier: tagNumeric.uniqueIdentifier,
            careerId: tagNumeric.careerId,
            universityId: tagNumeric.universityId,
            tagId: tagNumeric.tagId,
            value: Number(tagNumeric.value),
            createdAt: tagNumeric.createdAt,
            updatedAt: tagNumeric.updatedAt,
        }
    }
}