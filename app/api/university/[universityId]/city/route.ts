import { CityService } from "@/backend/services/city-service";
import { PaginationRequest } from "mimmers-core-nodejs";
import { NextResponse } from "next/server";
import { createCitySchema } from "pases-universitarios";
import { z } from "zod/v4";

export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        //read query params
        const { universityId } = await context.params;
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 0;
        const size = Number(searchParams.get("size")) || 10;

        const pRequest: PaginationRequest = {
            page,
            size
        }

        const cities = await CityService.getPaginatedCities(universityId, pRequest);
        return NextResponse.json(cities);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const { universityId } = await context.params;
        const body = await request.json();
        const validatedBody = createCitySchema.parse(body);
        const result = await CityService.createCity(universityId, validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}