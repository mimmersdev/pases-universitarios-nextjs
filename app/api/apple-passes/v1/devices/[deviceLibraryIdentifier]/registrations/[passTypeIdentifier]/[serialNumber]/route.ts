import { AppleManagerService } from "@/backend/services/apple/apple-manager-service";
import { NextRequest, NextResponse } from "next/server";
import { getAppleAuthenticationToken, AppleWalletManager } from "pases-universitarios/wallet";

const verifyToken = (request: NextRequest, serialNumber: string): boolean => {
    console.log("headers");
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

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
    try {
        const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await context.params;
        const body = await request.json();
        const { pushToken } = body;

        if (!verifyToken(request, serialNumber)) {
            return NextResponse.json({ error: 'Unauthorized' },{ status: 410 });
        }

        await AppleManagerService.registerDevice(deviceLibraryIdentifier, passTypeIdentifier, serialNumber, pushToken);

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Error registering Apple device:', error);
        return NextResponse.json({ error: 'Registration failed' },{ status: 500 });
    }
}

// Device Unregistration Endpoint
// DELETE /api/apple-passes/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]/[serialNumber]
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
    try {
        const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await context.params;

        if (!verifyToken(request, serialNumber)) {
            return NextResponse.json({ error: 'Unauthorized' },{ status: 410 });
        }

        await AppleManagerService.unregisterDevice(deviceLibraryIdentifier, passTypeIdentifier, serialNumber);

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Error unregistering Apple device:', error);
        return NextResponse.json({ error: 'Unregistration failed' },{ status: 500 });
    }
}