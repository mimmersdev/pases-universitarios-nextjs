import { UniversityService } from "@/backend/services/university-service";
import { PaginationRequest } from "mimmers-core-nodejs";
import { NextResponse } from "next/server";
import { createUniversitySchema } from "pases-universitarios";
import { z } from "zod/v4";

export async function GET(request: Request) {
    try {
        //read query params
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 0;
        const size = Number(searchParams.get("size")) || 10;

        const pRequest: PaginationRequest = {
            page,
            size
        }

        const universities = await UniversityService.getPaginatedUniversities(pRequest);
        return NextResponse.json(universities);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedBody = createUniversitySchema.parse(body);
        const result = await UniversityService.createUniversity(validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}