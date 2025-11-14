import { CareerService } from "@/backend/services/career-service";
import { NextResponse } from "next/server";
import { updateCareerSchema } from "pases-universitarios";
import { z } from "zod/v4";

export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string, code: string }> }
) {
    try {
        const { universityId, code } = await context.params;
        const career = await CareerService.getCareer(universityId, code);
        return NextResponse.json(career);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ universityId: string, code: string }> }
) {
    try {
        const { universityId, code } = await context.params;
        const body = await request.json();
        const validatedBody = updateCareerSchema.parse(body);
        const result = await CareerService.updateCareer(universityId, code, validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}