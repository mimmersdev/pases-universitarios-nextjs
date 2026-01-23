import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { db } from "../config";
import { users } from "../schema";
import { eq } from "drizzle-orm";
import { CreateUser, UpdateUser, User, UserBackend } from "pases-universitarios";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.USERS);

export class UserRepository {
    /**
     * Create a new user
     */
    public static async create(req: CreateUser): Promise<User> {
        try {
            const [user] = await db.insert(users).values(req).returning();
            return this.mapToDomain(user);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.CREATE, error);
        }
    }

    /**
     * Get user by ID
     */
    public static async getById(id: string): Promise<User> {
        try {
            const user = await db.query.users.findFirst({
                where: eq(users.id, id),
            });
            if (user === undefined) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
            return this.mapToDomain(user);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Get user by username (for login)
     */
    public static async getByUsername(username: string): Promise<UserBackend | null> {
        try {
            const user = await db.query.users.findFirst({
                where: eq(users.username, username),
            });
            return user ? this.mapToDomain_Bakcend(user) : null;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Check if username exists
     */
    public static async existsByUsername(username: string): Promise<boolean> {
        try {
            const user = await db.query.users.findFirst({
                where: eq(users.username, username),
                columns: { id: true },
            });
            return user !== undefined;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Get all users (without passwords for listing purposes)
     */
    public static async getAll(): Promise<User[]> {
        try {
            const result = await db.select({
                id: users.id,
                username: users.username,
            }).from(users);
            return result;
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET_ALL, error);
        }
    }

    /**
     * Update user by ID
     */
    public static async update(id: string, req: UpdateUser): Promise<User> {
        try {
            const [user] = await db.update(users).set(req).where(eq(users.id, id)).returning();
            if (!user) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
            return this.mapToDomain(user);
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    /**
     * Update password by ID
     */
    public static async updatePassword(id: string, hashedPassword: string): Promise<void> {
        try {
            const result = await db.update(users)
                .set({ password: hashedPassword })
                .where(eq(users.id, id))
                .returning();
            if (result.length === 0) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.UPDATE, error);
        }
    }

    /**
     * Delete user by ID
     */
    public static async delete(id: string): Promise<void> {
        try {
            const result = await db.delete(users).where(eq(users.id, id)).returning();
            if (result.length === 0) {
                throw errorHandler.handleError(RepositoryErrorType.NOT_FOUND);
            }
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.DELETE, error);
        }
    }

    private static mapToDomain(user: typeof users.$inferSelect): User {
        return {
            id: user.id,
            username: user.username,
        };
    }

    private static mapToDomain_Bakcend(user: typeof users.$inferSelect): UserBackend {
        return {
            id: user.id,
            username: user.username,
            password: user.password
        }
    }
}
