"use client";

import { CustomButton } from "@/app/components/CustomButton";
import { Modal } from "@/app/components/Modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateCareer } from "@/frontend/hooks/career/useUpdateCareer";
import { useForm } from "@tanstack/react-form";
import { Career, UpdateCareer, updateCareerSchema } from "pases-universitarios";
import { toast } from "sonner";

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
                await updateCareerMutation.mutateAsync({ universityId, code: selectedCareer.code, data: value });
                toast.success("Carrera actualizada correctamente");
                form.reset();
                onClose();
            } catch (error) {
                toast.error("Error al actualizar la carrera");
                console.error(error);
            }
        }
    });
    return (<form onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
    }}>
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Actualizar Carrera</DialogTitle>
                    <DialogDescription>
                        Actualiza la información de la carrera
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4">
                    <form.Field name="name">
                        {(field) => {
                            const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onChange={(e) => {
                                            field.handleChange(e.target.value);
                                        }}
                                        onBlur={field.handleBlur}
                                        aria-invalid={isInvalid}
                                        placeholder="Ingresa el nombre de la carrera"
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
                    <CustomButton type="submit" loading={updateCareerMutation.isPending} onClick={() => form.handleSubmit()}>Actualizar Carrera</CustomButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </form>)
}

export default UpdateCareerModal;