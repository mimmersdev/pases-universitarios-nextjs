import { PassService } from "@/backend/services/pass-service";
import { NextResponse } from "next/server";
import { createManyPassesSchema } from "pases-universitarios";
import { z } from "zod/v4";
import { parseExcelFile } from "@/utils";
import { passExcelFieldDefinitions } from "@/utils/pass-excel-fields";

// Create many
export async function POST(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
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
        const parsedData = parseExcelFile(arrayBuffer, passExcelFieldDefinitions);
        
        // Wrap in the expected schema format
        const jsonDataForValidation = {
            data: parsedData
        };
        
        // Validate with Zod schema
        const validatedBody = createManyPassesSchema.parse(jsonDataForValidation);
        
        // Create passes
        const result = await PassService.createMany(universityId, validatedBody.data);
        return NextResponse.json(result);
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