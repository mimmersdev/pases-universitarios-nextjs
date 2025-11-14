import { PassService } from "@/backend/services/pass-service";
import { FilteredPaginationRequest, filteredPaginationRequestSchema } from "@/domain/FilteredPagination";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

export async function POST(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const { universityId } = await context.params;
        const body = await request.json() as FilteredPaginationRequest;
        const validatedBody = filteredPaginationRequestSchema.parse(body);

        const result = await PassService.getPaginatedPasses(universityId, validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        console.error(error);
        if(error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error)}, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}