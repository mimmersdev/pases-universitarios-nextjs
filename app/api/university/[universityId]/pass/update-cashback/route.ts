import { PassService } from "@/backend/services/pass-service";
import { authMiddleware } from "@/backend/services/utils/authMiddleware";
import { parseExcelFile } from "@/utils";
import { updateCashbackExcelFieldDefinitions } from "@/utils/pass-excel-fields";
import { NextResponse } from "next/server";
import { updateCashbackRequestSchema } from "pases-universitarios";
import { z } from "zod/v4";

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

        // Parse multipart/form-data
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!validExtensions.includes(fileExtension)) {
            return NextResponse.json({
                error: `Invalid file type. Expected ${validExtensions.join(' or ')}`
            }, { status: 400 });
        }

        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Parse Excel file
        const parsedData = parseExcelFile(arrayBuffer, updateCashbackExcelFieldDefinitions);

        // Wrap in the expected schema format
        const jsonDataForValidation = {
            data: parsedData
        };

        const validatedBody = updateCashbackRequestSchema.parse(jsonDataForValidation);

        const result = await PassService.updateCashback(universityId, validatedBody);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: z.treeifyError(error) }, { status: 400 });
        }
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

}