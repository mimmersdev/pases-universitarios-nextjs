import { CareerService } from "@/backend/services/career-service";
import { authMiddleware } from "@/backend/services/utils/authMiddleware";
import { careerPaginationRequestSchema } from "@/domain/FilteredPagination";
import { PaginationRequest } from "mimmers-core-nodejs";
import { NextResponse } from "next/server";
import { createCareerSchema } from "pases-universitarios";
import { z } from "zod/v4";


export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const auth = await authMiddleware();
        if (auth instanceof NextResponse) {
            return auth;
        }

        //read query params
        const { universityId } = await context.params;
        const { searchParams } = new URL(request.url);
        const page = Number(searchParams.get("page")) || 0;
        const size = Number(searchParams.get("size")) || 10;
        const sortCode = searchParams.get("sortCode") || undefined;
        const sortName = searchParams.get("sortName") || undefined;
        const sortCreatedAt = searchParams.get("sortCreatedAt") || undefined;
        const sortUpdatedAt = searchParams.get("sortUpdatedAt") || undefined;
        const searchName = searchParams.get("searchName") || undefined;

        const pRequest = careerPaginationRequestSchema.parse({
            page,
            size,
            sortCode,
            sortName,
            sortCreatedAt,
            sortUpdatedAt,
            searchName
        })
        
        const careers = await CareerService.getPaginatedCareers(universityId, pRequest);
        return NextResponse.json(careers);
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
        const auth = await authMiddleware();
        if (auth instanceof NextResponse) {
            return auth;
        }

        const { universityId } = await context.params;
        const body = await request.json();
        const validatedBody = createCareerSchema.parse(body);
        const result = await CareerService.createCareer(universityId, validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}