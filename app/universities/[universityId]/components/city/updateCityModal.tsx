"use client";

import { Modal } from "@/app/components/Modal";
import { useUpdateCity } from "@/frontend/hooks/city/useUpdateCity";
import { Button, Input } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { City, UpdateCity, updateCitySchema } from "pases-universitarios";

interface UpdateCityModalProps {
    universityId: string;
    selectedCity: City;
    open: boolean;
    onClose: () => void;
}

const UpdateCityModal = ({ universityId, selectedCity, open, onClose }: UpdateCityModalProps) => {
    const updateCityMutation = useUpdateCity(universityId);

    const form = useForm({
        defaultValues: {
            name: selectedCity.name,
        } as UpdateCity,
        validators: {
            onSubmit: updateCitySchema,
            onBlur: updateCitySchema,
            onChange: updateCitySchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await updateCityMutation.mutateAsync({ universityId, code: selectedCity.code, data: value });
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
            title="Actualizar Ciudad"
            size="lg"
            backdrop="opaque"
            footer={
                <div className="flex justify-end gap-2">
                    <Button type="submit" color="primary" isLoading={updateCityMutation.isPending} onPress={() => form.handleSubmit()}>Actualizar Ciudad</Button>
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
                    <Input
                        label="Código"
                        isDisabled
                        value={selectedCity.code}
                    />
                    <form.Field name="name">
                        {(field) => (
                            <Input
                                label="Nombre"
                                id="name"
                                name="name"
                                type="text"
                                placeholder="Ingresa el nombre de la ciudad"
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
    )
}

export default UpdateCityModal;