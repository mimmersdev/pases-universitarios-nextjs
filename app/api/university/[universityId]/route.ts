import { UniversityService } from "@/backend/services/university-service";
import { NextResponse } from "next/server";
import { updateUniversitySchema } from "pases-universitarios";
import { z } from "zod/v4";

export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const { universityId } = await context.params;
        const university = await UniversityService.getUniversity(universityId);
        return NextResponse.json(university);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const { universityId } = await context.params;
        const body = await request.json();
        const validatedBody = updateUniversitySchema.parse(body);
        const result = await UniversityService.updateUniversity(universityId, validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}