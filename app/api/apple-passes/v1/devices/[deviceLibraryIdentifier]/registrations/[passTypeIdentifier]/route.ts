import { AppleDeviceRepository } from "@/backend/db/repositories/apple-device-repository";
import { PassService } from "@/backend/services/pass-service";
import { NextRequest, NextResponse } from "next/server";

// GET /api/apple-passes/devices/[deviceLibraryIdentifier]/registrations/[passTypeIdentifier]?passesUpdatedSince={previousLastUpdated}
export async function GET(
    _: NextRequest,
    context: { params: Promise<{ deviceLibraryIdentifier: string; passTypeIdentifier: string }> }
) {
    try {
        const { deviceLibraryIdentifier, passTypeIdentifier } = await context.params;

        const serialNumbers = await AppleDeviceRepository.listAppleSerialByDeviceAndPass(deviceLibraryIdentifier, passTypeIdentifier);

        return NextResponse.json({
            serialNumbers: serialNumbers,
            lastUpdated: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Error listing Apple passes that need to be updated:', error);
        return NextResponse.json({ error: 'Failed to list Apple registrations' }, { status: 500 });
    }
}