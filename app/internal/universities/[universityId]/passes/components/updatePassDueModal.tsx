"use client";

import { useUpdatePassDue } from "@/frontend/hooks/pass/useUpdatePassDue";
import { updatePassDueRequestSchema } from "pases-universitarios";
import { ExcelUploadModal, type ExcelDataItem } from "./excelUploadModal";
import { updatePassDueExcelFieldDefinitions } from "@/utils/pass-excel-fields";

// Extended field definitions with UI metadata (descriptions and examples)
const excelExampleData: ExcelDataItem[] = [
    {
        ...updatePassDueExcelFieldDefinitions.find(f => f.title === "uniqueIdentifier")!,
        description: "Identificación única del portador del pase (EJ: CC)",
        example: "1194378278"
    },
    {
        ...updatePassDueExcelFieldDefinitions.find(f => f.title === "careerId")!,
        description: "Código de la carrera",
        example: "CS101"
    },
    {
        ...updatePassDueExcelFieldDefinitions.find(f => f.title === "totalToPay")!,
        description: "Total a pagar del portador del pase",
        example: "1500.50"
    },
    {
        ...updatePassDueExcelFieldDefinitions.find(f => f.title === "startDueDate")!,
        description: "Fecha de inicio del ciclo de pago",
        example: "2024-01-01"
    },
    {
        ...updatePassDueExcelFieldDefinitions.find(f => f.title === "endDueDate")!,
        description: "Fecha de fin del ciclo de pago",
        example: "2024-01-31"
    },
    {
        ...updatePassDueExcelFieldDefinitions.find(f => f.title === "onlinePaymentLink")!,
        description: "Link de pago en línea del portador del pase (opcional)",
        example: "https://example.com/pay"
    },
]

interface UpdatePassDueModalProps {
    universityId: string;
    open: boolean;
    onClose: () => void;
}

const UpdatePassDueModal = ({ universityId, open, onClose }: UpdatePassDueModalProps) => {
    const updatePassDueMutation = useUpdatePassDue(universityId);

    return (
        <ExcelUploadModal
            open={open}
            onClose={onClose}
            title="Actualizar Fechas de Vencimiento desde Excel"
            description="Actualiza las fechas de vencimiento y el total a pagar de los pases desde un archivo Excel. Puede descargar la plantilla para ver los campos requeridos."
            fieldDefinitions={excelExampleData}
            validationSchema={updatePassDueRequestSchema}
            uploadMutation={updatePassDueMutation}
            templateFileName="plantilla-actualizar-vencimiento.xlsx"
            successMessage={(count) => `${count} pase(s) actualizado(s) exitosamente`}
            validateButtonText="Validar Archivo"
            uploadButtonText="Actualizar Vencimientos"
        />
    );
}

export default UpdatePassDueModal;

