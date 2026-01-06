"use client";

import { useSendOpenNotification } from "@/frontend/hooks/pass/useSendOpenNotification";
import { useState } from "react";
import { PassPaginationRequest } from "@/domain/FilteredPagination";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomButton } from "@/app/components/CustomButton";
import { Button } from "@/components/ui/button";

const sendNotificationSchema = z.object({
    header: z.string().min(1),
    body: z.string().min(1),
});

interface SendNotificationModalProps {
    universityId: string;
    pRequest: PassPaginationRequest;
    open: boolean;
    onClose: () => void;
    totalPasses?: number;
}

const SendNotificationModal = ({
    universityId,
    pRequest,
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
                ...pRequest,
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

    const form = useForm({
        defaultValues: {
            header: "",
            body: "",
        },
        validators: {
            onSubmit: sendNotificationSchema,
            onBlur: sendNotificationSchema,
            onChange: sendNotificationSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await sendNotification.mutateAsync({

                    ...pRequest,
                    header: value.header.trim(),
                    body: value.body.trim(),
                });
                toast.success("Notificaciones enviadas correctamente");
                form.reset();
                onClose();
            } catch (error) {
                console.error(error);
                toast.error("Error al enviar las notificaciones");
            }
        }
    })

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enviar Notificaciones</DialogTitle>
                    <DialogDescription>
                        Envia notificaciones a todos los pases que se encuentren bajo los filtros aplicados.
                    </DialogDescription>

                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <form.Field name="header">
                        {(field) => {
                            const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Encabezado de la Notificación</FieldLabel>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onChange={(e) => {
                                            field.handleChange(e.target.value);
                                        }}
                                        onBlur={field.handleBlur}
                                        aria-invalid={isInvalid}
                                        placeholder="Ej: Recordatorio de Pago"
                                    />
                                </Field>
                            )
                        }}
                    </form.Field>
                    <form.Field name="body">
                        {(field) => {
                            const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Cuerpo de la Notificación</FieldLabel>
                                    <Textarea
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onChange={(e) => {
                                            field.handleChange(e.target.value);
                                        }}
                                        onBlur={field.handleBlur}
                                        aria-invalid={isInvalid}
                                        placeholder="Ej: Recuerda que tu pago vence el próximo mes. Por favor realiza el pago a tiempo."
                                    />
                                </Field>
                            )
                        }}
                    </form.Field>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    </DialogClose>
                    <CustomButton type="submit" loading={sendNotification.isPending} onClick={() => form.handleSubmit()}>Enviar Notificaciones ({totalPasses ?? 0})</CustomButton>
                </DialogFooter>
            </DialogContent>

        </Dialog>
    )
};

export default SendNotificationModal;

