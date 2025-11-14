import { PassService } from "@/backend/services/pass-service";
import { NextRequest, NextResponse } from "next/server";

// GET /api/apple-passes/passes/[passTypeIdentifier]/[serialNumber]
export async function GET(
    _: NextRequest,
    context: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> }
) {
    try {
        const { passTypeIdentifier, serialNumber } = await context.params;

        const passBuffer = await PassService.getApplePassBuffer_PassTypeAndSerial(passTypeIdentifier, serialNumber);

        return new NextResponse(Buffer.from(passBuffer), {
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="pass-${serialNumber}.pkpass"`
            }
        });
    } catch (error) {
        console.error('Error getting Apple pass:', error);
        return NextResponse.json({ error: 'Failed to get Apple pass' }, { status: 500 });
    }
}