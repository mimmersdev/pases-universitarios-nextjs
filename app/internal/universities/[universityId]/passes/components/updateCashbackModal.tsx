"use client";

import { useUpdateCashback } from "@/frontend/hooks/pass/useUpdateCashback";
import { updateCashbackRequestSchema } from "pases-universitarios";
import { ExcelUploadModal, type ExcelDataItem } from "./excelUploadModal";
import { updateCashbackExcelFieldDefinitions } from "@/utils/pass-excel-fields";

// Extended field definitions with UI metadata (descriptions and examples)
const excelExampleData: ExcelDataItem[] = [
    {
        ...updateCashbackExcelFieldDefinitions.find(f => f.title === "uniqueIdentifier")!,
        description: "Identificación única del portador del pase (EJ: CC)",
        example: "1194378278"
    },
    {
        ...updateCashbackExcelFieldDefinitions.find(f => f.title === "careerId")!,
        description: "Código de la carrera",
        example: "CS101"
    },
    {
        ...updateCashbackExcelFieldDefinitions.find(f => f.title === "cashback")!,
        description: "Nuevo valor de cashback para el pase",
        example: "100.50"
    },
]

interface UpdateCashbackModalProps {
    universityId: string;
    open: boolean;
    onClose: () => void;
}

const UpdateCashbackModal = ({ universityId, open, onClose }: UpdateCashbackModalProps) => {
    const updateCashbackMutation = useUpdateCashback(universityId);

    return (
        <ExcelUploadModal
            open={open}
            onClose={onClose}
            title="Actualizar Cashback desde Excel"
            description="Actualiza el cashback de los pases desde un archivo Excel. Puede descargar la plantilla para ver los campos requeridos."
            fieldDefinitions={excelExampleData}
            validationSchema={updateCashbackRequestSchema}
            uploadMutation={updateCashbackMutation}
            templateFileName="plantilla-actualizar-cashback.xlsx"
            successMessage={(count) => `${count} pase(s) actualizado(s) exitosamente`}
            validateButtonText="Validar Archivo"
            uploadButtonText="Actualizar Cashback"
        />
    );
}

export default UpdateCashbackModal;

