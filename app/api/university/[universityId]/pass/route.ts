import { PassService } from "@/backend/services/pass-service";
import { authMiddleware } from "@/backend/services/utils/authMiddleware";
import { NextResponse } from "next/server";
import { createManyPassesSchema } from "pases-universitarios";
import { z } from "zod/v4";
import { parseExcelFile } from "@/utils";
import { passExcelFieldDefinitions } from "@/utils/pass-excel-fields";
import { passPaginationRequestSchema, FilterIncludeExcludeType, FilterDateComparation } from "@/domain/FilteredPagination";
import { PassSSEEvent } from "@/domain/SSEEvents";

export async function GET(
    request: Request,
    context: { params: Promise<{ universityId: string }> }
) {
    try {
        const auth = await authMiddleware();
        if (auth instanceof NextResponse) {
            return auth;
        }

        const { universityId } = await context.params;
        const { searchParams } = new URL(request.url);

        // Parse basic pagination params
        const page = Number(searchParams.get("page")) || 0;
        const size = Number(searchParams.get("size")) || 10;

        // Reconstruct the PassPaginationRequest object from flattened query params
        const pRequest: any = {
            page,
            size,
        };

        // Helper function to get array values from searchParams
        // Axios serializes arrays as "key[]=value1&key[]=value2", so we need to check both formats
        const getArrayValues = (key: string): string[] => {
            // Try without brackets first (standard format)
            const valuesWithoutBrackets = searchParams.getAll(key);
            if (valuesWithoutBrackets.length > 0) {
                return valuesWithoutBrackets;
            }
            // Try with brackets (axios default format)
            const valuesWithBrackets = searchParams.getAll(`${key}[]`);
            if (valuesWithBrackets.length > 0) {
                return valuesWithBrackets;
            }
            return [];
        };

        // Helper function to reconstruct Include/Exclude filters
        const reconstructIncludeExcludeFilter = (typeParam: string | null, valuesKey: string) => {
            if (!typeParam) return undefined;
            const values = getArrayValues(valuesKey);
            if (values.length === 0) return undefined;
            return {
                type: typeParam as FilterIncludeExcludeType,
                values: values,
            };
        };

        // Include/Exclude filters
        pRequest.career = reconstructIncludeExcludeFilter(
            searchParams.get("careerType"),
            "careerValues"
        );
        pRequest.semester = reconstructIncludeExcludeFilter(
            searchParams.get("semesterType"),
            "semesterValues"
        );
        pRequest.paymentStatus = reconstructIncludeExcludeFilter(
            searchParams.get("paymentStatusType"),
            "paymentStatusValues"
        );
        pRequest.studentStatus = reconstructIncludeExcludeFilter(
            searchParams.get("studentStatusType"),
            "studentStatusValues"
        );
        pRequest.passStatus = reconstructIncludeExcludeFilter(
            searchParams.get("passStatusType"),
            "passStatusValues"
        );

        // Range filters
        const enrollmentYearMin = searchParams.get("enrollmentYearMin");
        const enrollmentYearMax = searchParams.get("enrollmentYearMax");
        if (enrollmentYearMin && enrollmentYearMax) {
            pRequest.enrollmentYear = {
                min: Number(enrollmentYearMin),
                max: Number(enrollmentYearMax),
            };
        }
        const totalToPayMin = searchParams.get("totalToPayMin");
        const totalToPayMax = searchParams.get("totalToPayMax");
        if (totalToPayMin && totalToPayMax) {
            pRequest.totalToPay = {
                min: Number(totalToPayMin),
                max: Number(totalToPayMax),
            };
        }

        const cashbackMin = searchParams.get("cashbackMin");
        const cashbackMax = searchParams.get("cashbackMax");
        if (cashbackMin && cashbackMax) {
            pRequest.cashback = {
                min: Number(cashbackMin),
                max: Number(cashbackMax),
            };
        }

        // Date filter
        const endDueDateType = searchParams.get("endDueDateType");
        if (endDueDateType === "singleDate") {
            const value = searchParams.get("endDueDateValue");
            const comparation = searchParams.get("endDueDateComparation");
            if (value && comparation) {
                pRequest.endDueDate = {
                    value: value,
                    comparation: comparation as FilterDateComparation,
                };
            }
        } else if (endDueDateType === "range") {
            const startDate = searchParams.get("endDueDateStart");
            const endDate = searchParams.get("endDueDateEnd");
            if (startDate && endDate) {
                pRequest.endDueDate = {
                    startDate: startDate,
                    endDate: endDate,
                };
            }
        }

        // Validate with Zod schema
        const validatedBody = passPaginationRequestSchema.parse(pRequest);
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

// Create many
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
        const parsedData = parseExcelFile(arrayBuffer, passExcelFieldDefinitions);
        
        // Wrap in the expected schema format
        const jsonDataForValidation = {
            data: parsedData
        };
        
        // Validate with Zod schema
        const validatedBody = createManyPassesSchema.parse(jsonDataForValidation);

        // Create SSE stream
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                const sendEvent = (event: PassSSEEvent) => {
                    const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
                    controller.enqueue(encoder.encode(message));
                }

                try {
                    const result = await PassService.createMany(universityId, validatedBody.data, sendEvent);
                } catch (error) {
                    console.error(error);
                    throw error;
                } finally {
                    controller.close();
                }
            }
        })
        
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
        
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