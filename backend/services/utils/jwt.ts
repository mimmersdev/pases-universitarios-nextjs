import { JWTPayload, SignJWT, jwtVerify } from "jose";
import { User } from "pases-universitarios";

interface AuthTokenPayload extends User, JWTPayload { }
type VerificationResult = {
    valid: true;
    payload: User
} | {
    valid: false;
    error: unknown
}


const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export class JWT_Utils {
    public static async generateToken(
        payload: AuthTokenPayload,
        expiresIn = "60m"
    ) {
        return await new SignJWT(payload)
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime(expiresIn)
            .setIssuedAt()
            .sign(secret);
    }

    public static async verifyToken(token: string): Promise<VerificationResult> {
        try {
            const { payload } = await jwtVerify<AuthTokenPayload>(token, secret);

            return {
                valid: true,
                payload: {
                    id: payload.id,
                    username: payload.username
                }
            }
        } catch (error) {
            return {
                valid: false,
                error: error
            }
        }
    }
}