"use client";

import { Modal } from "@/app/components/Modal";
import { useCreateManyCities } from "@/frontend/hooks/city/useCreateManyCities";
import { Button } from "@heroui/react";
import { useState } from "react";
import { createManyCitiesSchema } from "pases-universitarios";
import { z } from "zod/v4";
import { DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

interface UploadCitiesModalProps {
    universityId: string;
    open: boolean;
    onClose: () => void;
}

const UploadCitiesModal = ({ universityId, open, onClose }: UploadCitiesModalProps) => {
    const createManyCitiesMutation = useCreateManyCities(universityId);
    
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
            // Read file content
            const text = await file.text();

            // Parse JSON
            let jsonData;
            try {
                jsonData = JSON.parse(text);
            } catch (error) {
                setValidationError("El archivo no contiene JSON válido");
                return;
            }
            
            // Validate with Zod schema
            const validated = createManyCitiesSchema.parse(jsonData);
            
            // Success
            setParsedData(validated);
            setIsValidated(true);
            setValidationError(null);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const firstError = error.issues[0];
                setValidationError(`Error de validación: ${firstError.path.join('.')} - ${firstError.message}`);
            } else {
                setValidationError("Error al procesar el archivo");
            }
            setIsValidated(false);
            setParsedData(null);
        }
    };

    const handleUpload = async () => {
        if (!parsedData || !isValidated) {
            return;
        }

        try {
            const count = await createManyCitiesMutation.mutateAsync(parsedData);
            alert(`✅ ${count} ciudade(s) creada(s) exitosamente`);
            handleReset();
            onClose();
        } catch (error) {
            console.error(error);
            setValidationError("Error al crear las ciudades en el servidor");
        }
    };

    const handleReset = () => {
        setFile(null);
        setValidationError(null);
        setParsedData(null);
        setIsValidated(false);
    };

    return (
        <Modal
            isOpen={open}
            onClose={() => {
                handleReset();
                onClose();
            }}
            title="Cargar Ciudades desde JSON"
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
                            isLoading={createManyCitiesMutation.isPending}
                        >
                            Cargar Ciudades
                        </Button>
                    )}
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                {/* File Upload Section */}
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-semibold">Seleccionar Archivo JSON</label>
                    <div className="flex items-center gap-3">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept=".json"
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
                                {parsedData.data.length} ciudad(es) lista(s) para cargar
                            </p>
                        </div>
                    </div>
                )}

                {/* Format Example */}
                <div className="border-t pt-4">
                    <details className="cursor-pointer">
                        <summary className="text-sm font-semibold mb-2">Ver formato esperado del JSON</summary>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto mt-2">
                            {`{
  "data": [
    {
      "code": "BA",
      "name": "Bogotá"
    },
    {
      "code": "CB",
      "name": "Medellín	"
    }
  ]
}`}
                        </pre>
                    </details>
                </div>
            </div>
        </Modal>
    )
}

export default UploadCitiesModal;
