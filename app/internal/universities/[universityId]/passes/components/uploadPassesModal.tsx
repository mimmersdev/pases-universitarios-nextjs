"use client";

import { useCreateManyPasses } from "@/frontend/hooks/pass/useCreateManyPasses";
import { createManyPassesSchema, paymentStatusList, studentStatusList } from "pases-universitarios";
import { ExcelUploadModal, type ExcelDataItem } from "./excelUploadModal";
import { passExcelFieldDefinitions } from "@/utils/pass-excel-fields";
import { PassSSEEventType } from "@/domain/SSEEvents";
import { useState } from "react";

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
        example: "Due",
        validValues: paymentStatusList
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "totalToPay")!,
        description: "Total a pagar del portador del pase",
        example: "1500.50"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "startDueDate")!,
        description: "Fecha de inicio del ciclo de pago",
        example: "2024-01-01"
    },
    {
        ...passExcelFieldDefinitions.find(f => f.title === "endDueDate")!,
        description: "Fecha de fin del ciclo de pago",
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
        example: studentStatusList[0],
        validValues: studentStatusList
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
    const [displayProgress, setDisplayProgress] = useState(false);
    const [displayResult, setDisplayResult] = useState(false);
    const [displayErrors, setDisplayErrors] = useState(false);
    const [total, setTotal] = useState(0);
    const [processed, setProcessed] = useState(0);
    const [errors, setErrors] = useState<{ universityId: string; uniqueIdentifier: string; careerId: string; error: string; }[]>([]);

    const handleReset = () => {
        setDisplayProgress(false);
        setDisplayResult(false);
        setDisplayErrors(false);
        setTotal(0);
        setProcessed(0);
        setErrors([]);
    };

    const handleClose = () => {
        onClose();
        handleReset();
    };

    const createManyPassesMutation = useCreateManyPasses(universityId,
        {
            onEvent(event) {
                switch (event.type) {
                    case PassSSEEventType.START:
                        handleReset();
                        setDisplayProgress(true);
                        setTotal(event.data.total);
                        break;
                    case PassSSEEventType.PROGRESS:
                        setProcessed(event.data.processed);
                        break;
                    case PassSSEEventType.ERROR:
                        const error = event.data.itemError;
                        if (error) {
                            setErrors(prev => [...prev, { universityId: error.universityId, uniqueIdentifier: error.uniqueIdentifier, careerId: error.careerId, error: event.data.error }]);
                        }
                        break;
                    case PassSSEEventType.ERROR_SUMMARY:
                        setErrors(event.data.errors);
                        setDisplayErrors(true);
                        break;
                    case PassSSEEventType.COMPLETE:
                        setDisplayResult(true);
                        break;
                }
            },
        }
    );

    return (
        <ExcelUploadModal
            open={open}
            onClose={handleClose}
            title="Cargar Pases desde Excel"
            description="Carga los pases desde un archivo Excel. Puede descargar la plantilla para ver los campos requeridos."
            fieldDefinitions={excelExampleData}
            validationSchema={createManyPassesSchema}
            uploadMutation={createManyPassesMutation}
            templateFileName="plantilla-pases.xlsx"
            successMessage={(count) => `${count} pase(s) procesado(s)`}
            validateButtonText="Validar Archivo"
            uploadButtonText="Cargar Pases"
            sseOptions={{
                progress: processed,
                total: total,
                errors: errors,
                displayProgress: displayProgress,
                displayErrors: displayErrors,
                displayResult: displayResult,
            }}
        />
    );
}

export default UploadPassesModal;

