import { PassService } from "@/backend/services/pass-service";
import { FilteredPaginationRequest, filteredPaginationRequestSchema } from "@/domain/FilteredPagination";
import { NextResponse } from "next/server";
import { z } from "zod/v4";

interface SendNotificationRequest extends FilteredPaginationRequest {
    header: string;
    body: string;
}

export async function POST(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const { universityId } = await context.params;
        const body = await request.json() as SendNotificationRequest;
        
        // Validate filters
        const validatedFilters = filteredPaginationRequestSchema.parse({
            page: body.page,
            size: body.size,
            filters: body.filters
        });
        
        // Validate header and body
        if (!body.header || typeof body.header !== 'string') {
            return NextResponse.json({ error: 'header is required and must be a string' }, { status: 400 });
        }
        
        if (!body.body || typeof body.body !== 'string') {
            return NextResponse.json({ error: 'body is required and must be a string' }, { status: 400 });
        }
        
        await PassService.sendOpenNotification(universityId, validatedFilters, body.header, body.body);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

