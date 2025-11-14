import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { config } from "../schema";
import { Config, CreateConfig } from "@/domain/Config";
import { db } from "../config";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.CONFIG);

export class ConfigRepository {
    public static async getConfig(): Promise<Config | null> {
        try {
            // Get first config
            const [result] = await db.select().from(config).limit(1);
            return result ? this.mapToDomain(result) : null;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    public static async createConfig(req: CreateConfig): Promise<Config> {
        try {
            const [result] = await db.insert(config).values(req).returning();
            return this.mapToDomain(result);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    public static mapToDomain(dto: typeof config.$inferSelect): Config {
        return {
            googleWalletClassId: dto.googleWalletClassId,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
        }
    }
}