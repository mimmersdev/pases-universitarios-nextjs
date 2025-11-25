"use client";

import { Modal } from "@/app/components/Modal";
import { useCreateManyPasses } from "@/frontend/hooks/pass/useCreateManyPasses";
import { Accordion, AccordionItem, Button, Code } from "@heroui/react";
import { useState } from "react";
import { createManyPassesSchema, paymentStatusList } from "pases-universitarios";
import { z } from "zod/v4";
import { DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon, ArrowDownTrayIcon } from "@heroicons/react/24/solid";
import * as XLSX from "xlsx";
import { parseExcelFile, type ExcelDataType, type ExcelFieldDefinition } from "@/utils";
import { passExcelFieldDefinitions } from "@/utils/pass-excel-fields";


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

type ExcelDataItem = ExcelFieldDefinition & {
    description: string;
    example: string;
}

// Extended field definitions with UI metadata (descriptions and examples)
const excelExampleData: ExcelDataItem[] = [
    {
        ...passExcelFieldDefinitions.find(f => f.title === "uniqueIdentifier")!,
        description: "Identificación única del portador del pase (EJ: CC)",
        example: "1194378278"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "careerId")!,
        description: "Código de la carrera",
        example: "CS101"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "name")!,
        description: "Nombre del portador del pase",
        example: "Juan Pérez"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "email")!,
        description: "Correo electrónico del portador del pase",
        example: "juan.perez@example.com"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "semester")!,
        description: "Semestre en el que se encuentra el portador del pase",
        example: "5"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "enrollmentYear")!,
        description: "Año de inscripción del portador del pase",
        example: "2023"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "paymentReference")!,
        description: "Referencia de pago del portador del pase",
        example: "REF-001"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "paymentStatus")!,
        description: "Estado de pago del portador del pase",
        example: "Due"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "totalToPay")!,
        description: "Total a pagar del portador del pase",
        example: "1500.50"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "startDueDate")!,
        description: "Fecha de inicio de la deuda del portador del pase",
        example: "2024-01-01"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "endDueDate")!,
        description: "Fecha de fin de la deuda del portador del pase",
        example: "2024-01-31"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "cashback")!,
        description: "Cashback del portador del pase",
        example: "100.50"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "studentStatus")!,
        description: "Estado estudiantil del portador del pase",
        example: "Active"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "onlinePaymentLink")!,
        description: "Link de pago en línea del portador del pase",
        example: "https://example.com/pay"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "academicCalendarLink")!,
        description: "Link del calendario académico del portador del pase",
        example: "https://example.com/calendar"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "photoUrl")!,
        description: "URL de la foto del portador del pase",
        example: "https://example.com/photo.jpg"
    }
]

interface UploadPassesModalProps {
    universityId: string;
    open: boolean;
    onClose: () => void;
}

const UploadPassesModal = ({ universityId, open, onClose }: UploadPassesModalProps) => {
    const createManyPassesMutation = useCreateManyPasses(universityId);
    const [file, setFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<any>(null);
    const [isValidated, setIsValidated] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
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

        try {
            // Read file as array buffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Parse Excel file using utility function (use base field definitions for parsing)
            const convertedData = parseExcelFile(arrayBuffer, passExcelFieldDefinitions);
            
            // Wrap in the expected schema format
            const jsonDataForValidation = {
                data: convertedData
            };
            
            // Validate with Zod schema
            const validated = createManyPassesSchema.parse(jsonDataForValidation);

            // Success
            setParsedData(validated);
            setIsValidated(true);
            setValidationError(null);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const firstError = error.issues[0];
                const path = firstError.path.join('.');
                setValidationError(`Error de validación: ${path} - ${firstError.message}`);
            } else if (error instanceof Error) {
                setValidationError(error.message);
            } else {
                setValidationError("Error al procesar el archivo Excel");
            }
            setIsValidated(false);
            setParsedData(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !isValidated) {
            return;
        }

        try {
            const count = await createManyPassesMutation.mutateAsync(file);
            alert(`✅ ${count} pases creado(s) exitosamente`);
            handleReset();
            onClose();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error?.response?.data?.error || "Error al crear los pases en el servidor";
            setValidationError(errorMessage);
        }
    };

    const handleReset = () => {
        setFile(null);
        setValidationError(null);
        setParsedData(null);
        setIsValidated(false);
    };

    const handleDownloadTemplate = () => {
        const headers = excelExampleData.map(item => item.title);
        const exampleRow = excelExampleData.map(item => item.example);

        // Create worksheet data
        const worksheetData = [headers, exampleRow];

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla");

        // Generate Excel file and trigger download
        XLSX.writeFile(workbook, "plantilla-pases.xlsx");
    };

    return (
        <Modal
            isOpen={open}
            onClose={() => {
                handleReset();
                onClose();
            }}
            title="Cargar Pases desde Excel"
            size="xl"
            backdrop="opaque"
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        color="danger"
                        variant="light"
                        onPress={() => {
                            handleReset();
                            onClose();
                        }}
                    >
                        Cancelar
                    </Button>
                    {!isValidated ? (
                        <Button
                            color="primary"
                            onPress={handleValidate}
                            isDisabled={!file}
                        >
                            Validar Archivo
                        </Button>
                    ) : (
                        <Button
                            color="success"
                            onPress={handleUpload}
                            isLoading={createManyPassesMutation.isPending}
                        >
                            Cargar Pases
                        </Button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                {/* Download Example File */}
                <div className="flex flex-col gap-3">
                    <Button color="primary" startContent={<ArrowDownTrayIcon className="w-5 h-5" />} onPress={handleDownloadTemplate}>Descargar Plantilla</Button>
                </div>
                {/* File Upload Section */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Seleccionar Archivo Excel</label>
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <DocumentArrowUpIcon className="w-5 h-5" />
                                <span className="text-sm">
                                    {file ? file.name : "Seleccionar archivo..."}
                                </span>
                            </div>
                        </label>
                        {file && !isValidated && (
                            <Button
                                size="sm"
                                color="warning"
                                variant="flat"
                                onPress={handleReset}
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Validation Status */}
                {validationError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <XCircleIcon className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-800 dark:text-red-400">Error de Validación</p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{validationError}</p>
                        </div>
                    </div>
                )}

                {isValidated && parsedData && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-green-800 dark:text-green-400">✓ Archivo Válido</p>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                {parsedData.data.length} pase(s) listos para cargar
                            </p>
                        </div>
                    </div>
                )}

                {/* Format Example */}
                <div className="border-t pt-4 border-gray-200">
                    <p className="font-semibold">Columnas del archivo</p>
                    <Accordion>
                        {excelExampleData.map(item => (
                            <AccordionItem key={item.title} title={item.title}>
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm text-gray-700 dark:text-gray-300">Tipo de dato: <span className="font-semibold">{excelDataTypeToLabel(item.type)}</span></p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
                                    <Code>{item.example}</Code>
                                    {item.validValues && (
                                        <p className="text-sm text-gray-700 dark:text-gray-300">Valores válidos: <span className="font-semibold">{item.validValues.join(", ")}</span></p>
                                    )}

                                </div>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </Modal>
    )
}

export default UploadPassesModal;

