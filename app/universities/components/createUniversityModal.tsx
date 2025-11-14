"use client";

import { Modal } from "@/app/components/Modal";
import { useCreateUniversity } from "@/frontend/hooks/university/useCreateUniversity";
import { Button, Input } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { CreateUniversity, createUniversitySchema } from "pases-universitarios";

interface CreateUniversityModalProps {
    open: boolean;
    onClose: () => void;
}

const CreateUniversityModal = ({ open, onClose }: CreateUniversityModalProps) => {
    const createUniversityMutation = useCreateUniversity();

    const form = useForm({
        defaultValues: {
            name: '',
        } satisfies CreateUniversity,
        validators: {
            onSubmit: createUniversitySchema,
            onBlur: createUniversitySchema,
            onChange: createUniversitySchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await createUniversityMutation.mutateAsync(value);
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
            title="Crear Universidad"
            size="lg"
            backdrop="opaque"
            footer={
                <div className="flex justify-end gap-2">
                    <Button type="submit" color="primary" isLoading={createUniversityMutation.isPending} onPress={() => form.handleSubmit()}>Crear Universidad</Button>
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
                    <form.Field name="name">
                        {(field) => (
                            <Input
                                label="Nombre"
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Ingresa el nombre de la universidad"
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

export default CreateUniversityModal;