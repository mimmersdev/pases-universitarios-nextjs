import { CityService } from "@/backend/services/city-service";
import { NextResponse } from "next/server";
import { updateCitySchema } from "pases-universitarios";
import { z } from "zod/v4";

export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string, code: string }> }
) {
    try {
        const { universityId, code } = await context.params;
        const city = await CityService.getCity(universityId, code);
        return NextResponse.json(city);
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
        const validatedBody = updateCitySchema.parse(body);
        const result = await CityService.updateCity(universityId, code, validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}