"use client";

import { useUpdatePassPaid } from "@/frontend/hooks/pass/useUpdatePassPaid";
import { updatePassPaidRequestSchema } from "pases-universitarios";
import { ExcelUploadModal, type ExcelDataItem } from "./excelUploadModal";
import { updatePaidExcelFieldDefinitions } from "@/utils/pass-excel-fields";

// Extended field definitions with UI metadata (descriptions and examples)
const excelExampleData: ExcelDataItem[] = [
    {
        ...updatePaidExcelFieldDefinitions.find(f => f.title === "uniqueIdentifier")!,
        description: "Identificación única del portador del pase (EJ: CC)",
        example: "1194378278"
    },
    {
        ...updatePaidExcelFieldDefinitions.find(f => f.title === "careerId")!,
        description: "Código de la carrera",
        example: "CS101"
    },
]

interface UpdatePassPaidModalProps {
    universityId: string;
    open: boolean;
    onClose: () => void;
}

const UpdatePassPaidModal = ({ universityId, open, onClose }: UpdatePassPaidModalProps) => {
    const updatePassPaidMutation = useUpdatePassPaid(universityId);

    return (
        <ExcelUploadModal
            open={open}
            onClose={onClose}
            title="Marcar Pases como Pagados desde Excel"
            description="Marca los pases como pagados desde un archivo Excel. Puede descargar la plantilla para ver los campos requeridos."
            fieldDefinitions={excelExampleData}
            validationSchema={updatePassPaidRequestSchema}
            uploadMutation={updatePassPaidMutation}
            templateFileName="plantilla-marcar-pagados.xlsx"
            successMessage={(count) => `${count} pase(s) marcado(s) como pagado(s) exitosamente`}
            validateButtonText="Validar Archivo"
            uploadButtonText="Marcar como Pagados"
        />
    );
}

export default UpdatePassPaidModal;

