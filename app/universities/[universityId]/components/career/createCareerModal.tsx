"use client";

import { Modal } from "@/app/components/Modal";
import { useCreateCareer } from "@/frontend/hooks/career/useCreateCareer";
import { Button, Input } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { CreateCareer, createCareerSchema } from "pases-universitarios";

interface CreateCareerModalProps {
    universityId: string;
    open: boolean;
    onClose: () => void;
}

const CreateCareerModal = ({ universityId, open, onClose }: CreateCareerModalProps) => {
    const createCareerMutation = useCreateCareer(universityId);

    const form = useForm({
        defaultValues: {
            name: '',
            code: '',
        } satisfies CreateCareer,
        validators: {
            onSubmit: createCareerSchema,
            onBlur: createCareerSchema,
            onChange: createCareerSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await createCareerMutation.mutateAsync(value);
                form.reset();
                onClose();
            } catch (error) {
                console.error(error);
            }
        }
    });

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title="Crear Carrera"
            size="lg"
            backdrop="opaque"
            footer={
                <div className="flex justify-end gap-2">
                    <Button type="submit" color="primary" isLoading={createCareerMutation.isPending} onPress={() => form.handleSubmit()}>Crear Carrera</Button>
                    <Button color="danger" onPress={onClose}>Cancelar</Button>
                </div>
            }
        >
            <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}>
                <div className="flex flex-col gap-2">
                    <form.Field name="code">
                        {(field) => (
                            <Input
                                label="Código"
                                id="code"
                                name="code"
                                type="text"
                                placeholder="Ingresa el código de la carrera"
                                value={field.state.value ?? ""}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                }}
                                onBlur={field.handleBlur}
                                isInvalid={field.state.meta.errors.length > 0 && field.state.meta.isTouched}
                                errorMessage={field.state.meta.errors[0]?.message}
                            />
                        )}
                    </form.Field>
                    <form.Field name="name">
                        {(field) => (
                            <Input
                                label="Nombre"
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Ingresa el nombre de la carrera"
                                value={field.state.value ?? ""}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                }}
                                onBlur={field.handleBlur}
                                isInvalid={field.state.meta.errors.length > 0 && field.state.meta.isTouched}
                                errorMessage={field.state.meta.errors[0]?.message}
                            />
                        )}
                    </form.Field>
                </div>
            </form>
        </Modal>
    );
}

export default CreateCareerModal;