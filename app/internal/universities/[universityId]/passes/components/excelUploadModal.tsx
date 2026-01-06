"use client";

import { useState } from "react";
import { z } from "zod/v4";
import * as XLSX from "xlsx";
import { parseExcelFile, type ExcelDataType, type ExcelFieldDefinition } from "@/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UploadIcon, DownloadIcon, CheckCircle2, XCircle, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { UseMutationResult } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";

const excelDataTypeToLabel = (type: ExcelDataType) => {
    switch (type) {
        case "string":
            return "Texto";
        case "number":
            return "Número";
        case "boolean":
            return "Booleano";
        case "date":
            return "Fecha";
    }
}

export type ExcelDataItem = ExcelFieldDefinition & {
    description: string;
    example: string;
}

interface ExcelUploadModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    fieldDefinitions: ExcelDataItem[];
    validationSchema: z.ZodSchema<any>;
    uploadMutation: UseMutationResult<any, any, File, any>;
    templateFileName: string;
    successMessage?: (result: any) => string;
    validateButtonText?: string;
    uploadButtonText?: string;

    // SSE options
    sseOptions?: {
        progress: number;
        total: number;
        errors: { universityId: string; uniqueIdentifier: string; careerId: string; error: string; }[];
        displayProgress: boolean;
        displayErrors: boolean;
        displayResult: boolean;
    }
}

export const ExcelUploadModal = ({
    open,
    onClose,
    title,
    description,
    fieldDefinitions,
    validationSchema,
    uploadMutation,
    templateFileName,
    successMessage,
    validateButtonText = "Validar Archivo",
    uploadButtonText = "Cargar Archivo",
    sseOptions,
}: ExcelUploadModalProps) => {
    const [file, setFile] = useState<File[] | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [isValidated, setIsValidated] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [showFieldDefinitions, setShowFieldDefinitions] = useState(false);
    const [showErrors, setShowErrors] = useState(false);

    // Convert fieldDefinitions to ExcelFieldDefinition[] for parsing
    const excelFieldDefinitions: ExcelFieldDefinition[] = fieldDefinitions.map(({ description, example, ...rest }) => rest);

    const handleFileChange = (e: File[]) => {
        const selectedFile = e[0];
        if (selectedFile) {
            setFile([selectedFile]);
            setValidationError(null);
            setParsedData(null);
            setIsValidated(false);
        }
    };

    const handleValidate = async () => {
        if (!file) {
            setValidationError("Por favor selecciona un archivo");
            return;
        }

        setIsValidating(true);
        setValidationError(null);

        try {
            // Read file as array buffer
            const arrayBuffer = await file[0].arrayBuffer();

            // Parse Excel file using utility function
            const convertedData = parseExcelFile(arrayBuffer, excelFieldDefinitions);

            // Wrap in the expected schema format
            const jsonDataForValidation = {
                data: convertedData
            };

            // Validate with Zod schema
            const validated = validationSchema.parse(jsonDataForValidation);

            // Success
            setParsedData(validated);
            setIsValidated(true);
            setValidationError(null);
            const itemCount = validated.data?.length || 0;
            toast.success(`Archivo válido: ${itemCount} registro(s) listo(s) para cargar`);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const firstError = error.issues[0];
                const path = firstError.path.join('.');
                const errorMessage = `Error de validación: ${path} - ${firstError.message}`;
                setValidationError(errorMessage);
                toast.error(errorMessage);
            } else if (error instanceof Error) {
                setValidationError(error.message);
                toast.error(error.message);
            } else {
                const errorMessage = "Error al procesar el archivo Excel";
                setValidationError(errorMessage);
                toast.error(errorMessage);
            }
            setIsValidated(false);
            setParsedData(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !isValidated) {
            return;
        }

        try {
            const result = await uploadMutation.mutateAsync(file[0]);
            const message = successMessage ? successMessage(result) : "Archivo cargado exitosamente";
            toast.success(message);
            handleReset();
            // Don't close the modal if SSE is enabled
            if (!sseOptions) {
                onClose();
            }
        } catch (error: any) {
            console.error(error);
            const errorMessage = error?.response?.data?.error || "Error al cargar el archivo en el servidor";
            setValidationError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleReset = () => {
        setFile(null);
        setValidationError(null);
        setParsedData(null);
        setIsValidated(false);
        setIsValidating(false);
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleDownloadTemplate = () => {
        const headers = fieldDefinitions.map(item => item.title);
        const exampleRow = fieldDefinitions.map(item => item.example);

        // Create worksheet data
        const worksheetData = [headers, exampleRow];

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");

        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, templateFileName);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {/* Download Template Button */}
                    <div className="flex justify-start">
                        <Button
                            variant="outline"
                            onClick={handleDownloadTemplate}
                            className="gap-2"
                        >
                            <DownloadIcon className="h-4 w-4" />
                            Descargar Plantilla
                        </Button>
                    </div>

                    {/* File Upload Section */}
                    <div className="flex flex-col gap-3">
                        <label className="text-sm font-semibold">Seleccionar Archivo Excel</label>
                        <Dropzone
                            accept={{
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                                'application/vnd.ms-excel': ['.xls']
                            }}
                            maxFiles={1}
                            maxSize={10 * 1024 * 1024} // 10MB
                            onDrop={(e) => {
                                handleFileChange(e);
                            }}
                            src={file ?? undefined}
                        >
                            <DropzoneEmptyState>
                                <div className={cn('flex flex-col items-center justify-center py-6')}>
                                    <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground mb-2">
                                        <UploadIcon size={20} />
                                    </div>
                                    <p className="my-2 w-full truncate text-wrap font-medium text-sm">
                                        Cargar archivo Excel
                                    </p>
                                    <p className="w-full truncate text-wrap text-muted-foreground text-xs text-center">
                                        Arrastra y suelta el archivo Excel aquí o haz clic para seleccionar.
                                    </p>
                                    <p className="text-wrap text-muted-foreground text-xs mt-1">
                                        Acepta archivos Excel (.xlsx) hasta 10MB.
                                    </p>
                                </div>
                            </DropzoneEmptyState>
                            <DropzoneContent>
                                <div className={cn('flex flex-col items-center justify-center py-4')}>
                                    <div className="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground mb-2">
                                        <UploadIcon size={20} />
                                    </div>
                                    <p className="my-2 w-full truncate font-medium text-sm text-center">
                                        {file?.[0]?.name || "Archivo seleccionado"}
                                    </p>
                                    <p className="w-full text-wrap text-muted-foreground text-xs text-center">
                                        Arrastra y suelta el archivo Excel aquí o haz clic para reemplazar.
                                    </p>
                                </div>
                            </DropzoneContent>
                        </Dropzone>
                        {file && !isValidated && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFile(null);
                                    setValidationError(null);
                                    setParsedData(null);
                                }}
                                className="self-start"
                            >
                                Limpiar archivo
                            </Button>
                        )}
                    </div>

                    {/* Validation Status */}
                    {validationError && (
                        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-destructive text-sm">Error de Validación</p>
                                <p className="text-sm text-destructive/80 mt-1">{validationError}</p>
                            </div>
                        </div>
                    )}

                    {isValidated && parsedData && (
                        <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-green-700 dark:text-green-400 text-sm">✓ Archivo Válido</p>
                                <p className="text-sm text-green-700/80 dark:text-green-400/80 mt-1">
                                    {parsedData.data?.length || 0} registro(s) listo(s) para cargar
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Field Definitions Section */}
                    <Separator />
                    <div className="flex flex-col gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setShowFieldDefinitions(!showFieldDefinitions)}
                            className="w-full justify-between"
                        >
                            <span className="font-semibold">Columnas del archivo</span>
                            {showFieldDefinitions ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                        {showFieldDefinitions && (
                            <div className="border rounded-lg p-4 bg-muted/30 max-h-64 overflow-y-auto">
                                <div className="flex flex-col gap-4">
                                    {fieldDefinitions.map((item) => (
                                        <div key={item.title} className="flex flex-col gap-2 pb-3 border-b last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm">{item.title}</p>
                                                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded">
                                                    {excelDataTypeToLabel(item.type)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">{item.description}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-muted-foreground">Ejemplo:</span>
                                                <code className="text-xs bg-background px-2 py-1 rounded border">
                                                    {item.example}
                                                </code>
                                            </div>
                                            {item.validValues && (
                                                <p className="text-xs text-muted-foreground">
                                                    Valores válidos: <span className="font-semibold">{item.validValues.join(", ")}</span>
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* SSE Progress Section */}
                    {sseOptions && sseOptions.displayProgress && (() => {
                        // Handle edge cases for progress calculation
                        const progress = typeof sseOptions.progress === 'number' && !isNaN(sseOptions.progress) && sseOptions.progress >= 0
                            ? sseOptions.progress
                            : 0;
                        const total = typeof sseOptions.total === 'number' && !isNaN(sseOptions.total) && sseOptions.total > 0
                            ? sseOptions.total
                            : 1; // Default to 1 to avoid division by zero

                        // Calculate percentage, capped at 100%
                        const percentage = Math.min(Math.max((progress / total) * 100, 0), 100);

                        return (
                            <div className="flex flex-col gap-2">
                                <Separator />
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        {!sseOptions.displayResult ? <Spinner /> : <CheckCircle2 className="size-4 text-green-600" />}
                                        <p className="font-semibold">{!sseOptions.displayResult ? "Procesando pases" : "Pases procesados"}</p>
                                    </div>
                                    <Progress value={percentage} max={100} />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            {progress} de {total} procesados ({Math.round(percentage)}%)
                                        </p>
                                        {sseOptions.errors.length > 0 && (
                                            <p className="text-sm text-destructive">
                                                {sseOptions.errors.length} pase(s) con error(es)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Error Summary Section */}
                    {sseOptions && sseOptions.displayErrors && sseOptions.errors.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <Separator />
                            <Button
                                variant="ghost"
                                onClick={() => setShowErrors(!showErrors)}
                                className="w-full justify-between"
                            >
                                <span className="font-semibold text-destructive">
                                    Errores ({sseOptions.errors.length})
                                </span>
                                {showErrors ? (
                                    <ChevronUp className="h-4 w-4" />
                                ) : (
                                    <ChevronDown className="h-4 w-4" />
                                )}
                            </Button>
                            {showErrors && (
                                <div className="border border-destructive/20 rounded-lg p-4 bg-background max-h-64 overflow-y-auto">
                                    <div className="flex flex-col gap-3">
                                        {sseOptions.errors.map((error, index) => (
                                            <div key={index} className="flex flex-col gap-2 pb-3 border-b border-destructive/20 last:border-0 last:pb-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex flex-col gap-1 flex-1">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs text-muted-foreground">Identificador único:</span>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-sm text-destructive">
                                                                    {error.uniqueIdentifier}
                                                                </p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await navigator.clipboard.writeText(error.uniqueIdentifier);
                                                                            toast.success("Identificador único copiado al portapapeles");
                                                                        } catch (err) {
                                                                            toast.error("Error al copiar al portapapeles");
                                                                        }
                                                                    }}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs text-muted-foreground">Código de carrera:</span>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-sm text-destructive">
                                                                    {error.careerId}
                                                                </p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await navigator.clipboard.writeText(error.careerId);
                                                                            toast.success("Código de carrera copiado al portapapeles");
                                                                        } catch (err) {
                                                                            toast.error("Error al copiar al portapapeles");
                                                                        }
                                                                    }}
                                                                >
                                                                    <Copy className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-1" />
                                                </div>
                                                <p className="text-sm text-destructive/80">{error.error}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                    </DialogClose>
                    {!isValidated ? (
                        <Button
                            onClick={handleValidate}
                            disabled={!file || isValidating}
                        >
                            {isValidating ? "Validando..." : validateButtonText}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleUpload}
                            disabled={uploadMutation.isPending}
                        >
                            {uploadMutation.isPending ? "Cargando..." : uploadButtonText}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

