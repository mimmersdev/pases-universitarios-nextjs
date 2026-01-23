import { CreateUser, UpdateUser, User } from "pases-universitarios";
import { UserRepository } from "../db/repositories/user-repository";
import bcrypt from "bcryptjs";
import { JWT_Utils } from "./utils/jwt";

const SALT_ROUNDS = 10;

export class UserService {
    /**
     * Create a new user with hashed password
     */
    public static async create(req: CreateUser): Promise<User> {
        // Check if username already exists
        const exists = await UserRepository.existsByUsername(req.username);
        if (exists) {
            throw new Error("El nombre de usuario ya existe");
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(req.password, SALT_ROUNDS);

        const user = await UserRepository.create({
            username: req.username,
            password: hashedPassword,
        });

        return user;
    }

    /**
     * Get user by ID
     */
    public static async getById(id: string): Promise<User> {
        const user = await UserRepository.getById(id);
        return user;
    }

    /**
     * Get all users (without passwords)
     */
    public static async getAll(): Promise<Omit<User, 'password'>[]> {
        const users = await UserRepository.getAll();
        return users;
    }

    /**
     * Update user (username only)
     */
    public static async update(id: string, req: UpdateUser): Promise<User> {
        // If updating username, check it doesn't already exist
        if (req.username) {
            const existingUser = await UserRepository.getByUsername(req.username);
            if (existingUser && existingUser.id !== id) {
                throw new Error("El nombre de usuario ya existe");
            }
        }

        const user = await UserRepository.update(id, req);
        return user;
    }

    /**
     * Update password
     */
    public static async updatePassword(id: string, newPassword: string): Promise<void> {
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await UserRepository.updatePassword(id, hashedPassword);
    }

    /**
     * Delete user
     */
    public static async delete(id: string): Promise<void> {
        await UserRepository.delete(id);
    }

    /**
     * Validate credentials for login
     * Returns token if valid
     */
    public static async validateCredentials(username: string, password: string): Promise<{ token: string, user: User } | null> {
        const user = await UserRepository.getByUsername(username);

        if (!user) {
            return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        const token = await JWT_Utils.generateToken({
            id: user.id,
            username: user.username
        });

        return {
            user: {
                id: user.id,
                username: user.username
            },
            token: token
        };
    }
}
