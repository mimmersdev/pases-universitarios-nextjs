import { NextRequest } from "next/server";
import { getAppleAuthenticationToken } from "pases-universitarios/wallet";

export function verifyAppleAuthToken(request: NextRequest, serialNumber: string): boolean {
    let authHeader: string | null = null;

    // First, try to get the authorization header directly
    authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    // If not found, check Vercel's x-vercel-sc-headers (contains original headers as JSON)
    if (!authHeader) {
        const vercelHeaders = request.headers.get('x-vercel-sc-headers');
        if (vercelHeaders) {
            try {
                const parsedHeaders = JSON.parse(vercelHeaders);
                authHeader = parsedHeaders.Authorization || parsedHeaders.authorization || null;
            } catch (error) {
                console.error("Error parsing x-vercel-sc-headers:", error);
            }
        }
    }
    
    console.log("Authorization header value:", authHeader);
    console.log("Serial number:", serialNumber);
    
    if (!authHeader) {
        console.log("No authorization header found in direct headers or x-vercel-sc-headers");
        return false;
    }
    
    if (!authHeader.startsWith('ApplePass ')) {
        console.log("Authorization header doesn't start with 'ApplePass '. Value:", authHeader);
        return false;
    }
    
    const providedToken = authHeader.replace('ApplePass ', '');
    const expectedToken = getAppleAuthenticationToken(serialNumber, process.env.APPLE_TOKEN_SECRET!);
    
    console.log("Provided token:", providedToken);
    console.log("Expected token:", expectedToken);
    console.log("Tokens match:", providedToken === expectedToken);
    
    return providedToken === expectedToken;
}