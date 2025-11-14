import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { CreateDateTag, DateTag, UpdateDateTag } from "pases-universitarios";
import { db } from "../config";
import { dateTags } from "../schema";
import { and, eq } from "drizzle-orm";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.TAG_DATE);

export class TagDateRepository {
    public static async createTagDate(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string, req: CreateDateTag): Promise<DateTag> {
        try {
            const [tagDate] = await db.insert(dateTags).values({
                ...req,
                universityId,
                careerId,
                uniqueIdentifier,
                tagId,
            }).returning();
            return this.mapToDomain(tagDate);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static async updateTagDate(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string, req: UpdateDateTag): Promise<DateTag> {
        try {
            const [tagDate] = await db.update(dateTags).set({
                ...req,
            }).where(and(eq(dateTags.uniqueIdentifier, uniqueIdentifier), eq(dateTags.careerId, careerId), eq(dateTags.universityId, universityId), eq(dateTags.tagId, tagId))).returning();
            return this.mapToDomain(tagDate);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    public static async deleteTagDate(universityId: string, careerId: string, uniqueIdentifier: string, tagId: string): Promise<void> {
        try {
            await db.delete(dateTags).where(and(eq(dateTags.uniqueIdentifier, uniqueIdentifier), eq(dateTags.careerId, careerId), eq(dateTags.universityId, universityId), eq(dateTags.tagId, tagId)));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.DELETE, error);
        }
    }


    public static mapToDomain(tagDate: typeof dateTags.$inferSelect): DateTag {
        return {
            uniqueIdentifier: tagDate.uniqueIdentifier,
            careerId: tagDate.careerId,
            universityId: tagDate.universityId,
            tagId: tagDate.tagId,
            value: tagDate.value,
            createdAt: tagDate.createdAt,
            updatedAt: tagDate.updatedAt,
        }
    }
}
