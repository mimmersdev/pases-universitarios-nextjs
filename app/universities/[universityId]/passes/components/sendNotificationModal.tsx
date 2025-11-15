"use client";

import { Modal } from "@/app/components/Modal";
import { useSendOpenNotification } from "@/frontend/hooks/pass/useSendOpenNotification";
import { Button, Input, Textarea } from "@heroui/react";
import { useState } from "react";
import { FilterTags } from "pases-universitarios";
import { BellIcon, XCircleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

interface SendNotificationModalProps {
    universityId: string;
    filters: FilterTags;
    open: boolean;
    onClose: () => void;
    totalPasses?: number;
}

const SendNotificationModal = ({ 
    universityId, 
    filters, 
    open, 
    onClose,
    totalPasses 
}: SendNotificationModalProps) => {
    const [header, setHeader] = useState("");
    const [body, setBody] = useState("");
    const sendNotification = useSendOpenNotification(universityId);

    const handleSend = () => {
        if (!header.trim() || !body.trim()) {
            return;
        }

        sendNotification.mutate(
            {
                page: 0,
                size: 100, // Not used for filtering, but required by schema
                filters,
                header: header.trim(),
                body: body.trim(),
            },
            {
                onSuccess: () => {
                    // Reset form and close modal on success
                    setHeader("");
                    setBody("");
                    onClose();
                },
            }
        );
    };

    const handleClose = () => {
        if (!sendNotification.isPending) {
            setHeader("");
            setBody("");
            onClose();
        }
    };

    const hasError = sendNotification.isError;
    const errorMessage = (() => {
        if (!sendNotification.error) return "Error al enviar las notificaciones";
        if (sendNotification.error instanceof Error) {
            return sendNotification.error.message;
        }
        if (typeof sendNotification.error === 'object' && 'response' in sendNotification.error) {
            const axiosError = sendNotification.error as any;
            return axiosError.response?.data?.error || "Error al enviar las notificaciones";
        }
        return "Error al enviar las notificaciones";
    })();

    return (
        <Modal
            isOpen={open}
            onClose={handleClose}
            title="Enviar Notificaciones"
            size="xl"
            backdrop="opaque"
            footer={
                <div className="flex justify-end gap-2">
                    <Button
                        color="danger"
                        variant="light"
                        onPress={handleClose}
                        isDisabled={sendNotification.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        color="success"
                        onPress={handleSend}
                        isLoading={sendNotification.isPending}
                        isDisabled={!header.trim() || !body.trim()}
                        startContent={!sendNotification.isPending && <BellIcon className="w-5 h-5" />}
                    >
                        {sendNotification.isPending ? "Enviando..." : "Enviar Notificaciones"}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                {/* Info Section */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                        <strong>Nota:</strong> Se enviarán notificaciones a{" "}
                        <strong>{totalPasses ?? 0}</strong> pase(s) que coincidan con los filtros aplicados.
                    </p>
                </div>

                {/* Header Input */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">Encabezado de la Notificación</label>
                    <Input
                        placeholder="Ej: Recordatorio de Pago"
                        value={header}
                        onValueChange={setHeader}
                        isDisabled={sendNotification.isPending}
                        isRequired
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Este será el título de la notificación que verán los usuarios
                    </p>
                </div>

                {/* Body Input */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold">Cuerpo de la Notificación</label>
                    <Textarea
                        placeholder="Ej: Recuerda que tu pago vence el próximo mes. Por favor realiza el pago a tiempo."
                        value={body}
                        onValueChange={setBody}
                        isDisabled={sendNotification.isPending}
                        minRows={4}
                        isRequired
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Este será el mensaje principal de la notificación
                    </p>
                </div>

                {/* Error Display */}
                {hasError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <XCircleIcon className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-red-800 dark:text-red-400">Error</p>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Success Display */}
                {sendNotification.isSuccess && (
                    <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircleIcon className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-green-800 dark:text-green-400">✓ Notificaciones Enviadas</p>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                Las notificaciones se han enviado exitosamente
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default SendNotificationModal;

