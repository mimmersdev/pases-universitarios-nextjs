import { verifyAppleAuthToken } from "@/app/api/v1/middleware";
import { AppleManagerService } from "@/backend/services/apple/apple-manager-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string; serialNumber: string }> }
) {
    try {
        const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await context.params;
        const body = await request.json();
        const { pushToken } = body;

        if (!verifyAppleAuthToken(request, serialNumber)) {
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

        if (!verifyAppleAuthToken(request, serialNumber)) {
            return NextResponse.json({ error: 'Unauthorized' },{ status: 410 });
        }

        await AppleManagerService.unregisterDevice(deviceLibraryIdentifier, passTypeIdentifier, serialNumber);

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Error unregistering Apple device:', error);
        return NextResponse.json({ error: 'Unregistration failed' },{ status: 500 });
    }
}