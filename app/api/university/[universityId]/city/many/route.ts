import { CityService } from "@/backend/services/city-service";
import { NextResponse } from "next/server";
import { createManyCitiesSchema } from "pases-universitarios";
import { z } from "zod/v4";

export async function POST(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const { universityId } = await context.params;
        const body = await request.json();
        const validatedBody = createManyCitiesSchema.parse(body);
        const result = await CityService.createMany(universityId, validatedBody.data);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}