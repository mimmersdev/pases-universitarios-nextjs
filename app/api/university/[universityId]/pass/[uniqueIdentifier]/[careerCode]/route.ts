import { PassService } from "@/backend/services/pass-service";
import { NextResponse } from "next/server";
import z from "zod";

export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string, uniqueIdentifier: string, careerCode: string }> }
) {
    try {
        const { universityId, uniqueIdentifier, careerCode } = await context.params;
        const pass = await PassService.getPass(universityId, uniqueIdentifier, careerCode);
        return NextResponse.json(pass);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}