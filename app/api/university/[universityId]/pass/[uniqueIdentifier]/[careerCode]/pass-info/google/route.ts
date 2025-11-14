import { PassService } from "@/backend/services/pass-service";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string, uniqueIdentifier: string, careerCode: string }> }
) {
    try {
        const { universityId, uniqueIdentifier, careerCode } = await context.params;
        const installLink = await PassService.getInstallationData_Google(universityId, uniqueIdentifier, careerCode);
        return NextResponse.json({ installLink });
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}