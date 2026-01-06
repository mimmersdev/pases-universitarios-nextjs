import { PassService } from "@/backend/services/pass-service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ universityId: string, uniqueIdentifier: string, careerCode: string }> }
) {
    try {
        const { universityId, uniqueIdentifier, careerCode } = await context.params;
        const searchParams = new URL(request.url).searchParams;
        const installClient = searchParams.get('installClient') === 'true';

        const passBuffer = await PassService.getApplePassInfo(universityId, uniqueIdentifier, careerCode, installClient);

        return new NextResponse(Buffer.from(passBuffer), {
            headers: {
                'Content-Type': 'application/vnd.apple.pkpass',
                'Content-Disposition': `attachment; filename="pass-${uniqueIdentifier}.pkpass"`
            }
        });
    } catch (error) {
        console.error('Error getting Apple pass:', error);
        return NextResponse.json({ error: 'Failed to get Apple pass' }, { status: 500 });
    }
}