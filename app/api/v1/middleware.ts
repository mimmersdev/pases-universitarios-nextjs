import { NextRequest } from "next/server";
import { getAppleAuthenticationToken } from "pases-universitarios/wallet";

export function verifyAppleAuthToken(request: NextRequest, serialNumber: string): boolean {
    console.log("verifyAppleAuthToken");
    console.log(request.headers);

    const authHeader = request.headers.get('authorization');
    console.log("authHeader");
    console.log(authHeader);
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
        return false;
    }
    
    const providedToken = authHeader.replace('ApplePass ', '');
    const expectedToken = getAppleAuthenticationToken(serialNumber, process.env.APPLE_TOKEN_SECRET!);
    return providedToken === expectedToken;
}