"use client";

import { Modal } from "@/app/components/Modal";
import { useUpdateCareer } from "@/frontend/hooks/career/useUpdateCareer";
import { Button, Input } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { Career, UpdateCareer, updateCareerSchema } from "pases-universitarios";

interface UpdateCareerProps {
    universityId: string;
    selectedCareer: Career;
    open: boolean;
    onClose: () => void;
}
const UpdateCareerModal = ({ universityId, selectedCareer, open, onClose }: UpdateCareerProps) => {

    const updateCareerMutation = useUpdateCareer(universityId);

    const form = useForm({
        defaultValues: {
            name: selectedCareer.name,
        } as UpdateCareer,
        validators: {
            onSubmit: updateCareerSchema,
            onBlur: updateCareerSchema,
            onChange: updateCareerSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                console.log(value);
                await updateCareerMutation.mutateAsync({ universityId, code: selectedCareer.code, data: value });
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
            title="Actualizar Carrera"
            size="lg"
            backdrop="opaque"
            footer={
                <div className="flex justify-end gap-2">
                    <Button type="submit" color="primary" isLoading={updateCareerMutation.isPending} onPress={() => form.handleSubmit()}>Actualizar Carrera</Button>
                    <Button color="danger" onPress={onClose}>Cancelar</Button>
                </div>
            }
        >
            <form onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Input
                            label="Código"
                            isDisabled
                            value={selectedCareer.code}
                        />
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
                </div>
            </form>
        </Modal>
    )
}

export default UpdateCareerModal;