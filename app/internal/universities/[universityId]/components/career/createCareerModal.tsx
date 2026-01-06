"use client";

import { CustomButton } from "@/app/components/CustomButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreateCareer } from "@/frontend/hooks/career/useCreateCareer";
import { useForm } from "@tanstack/react-form";
import { CreateCareer, createCareerSchema } from "pases-universitarios";
import { toast } from "sonner";

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
                toast.success("Carrera creada correctamente");
                form.reset();
                onClose();
            } catch (error) {
                toast.error("Error al crear la carrera");
                console.error(error);
            }
        }
    });

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
        }}>
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Crear Carrera</DialogTitle>
                        <DialogDescription>
                            Crea una nueva carrera para la universidad
                        </DialogDescription>

                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <form.Field name="code">
                            {(field) => {
                                const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Código</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            onBlur={field.handleBlur}
                                            aria-invalid={isInvalid}
                                            placeholder="Ingresa el código de la carrera"
                                        />
                                    </Field>
                                )
                            }}
                        </form.Field>
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
                        <CustomButton type="submit" loading={createCareerMutation.isPending} onClick={() => form.handleSubmit()}>Crear Carrera</CustomButton>
                    </DialogFooter>
                </DialogContent>

            </Dialog>
        </form>
    )

    // return (
    //     <Modal
    //         isOpen={open}
    //         onClose={onClose}
    //         title="Crear Carrera"
    //         size="lg"
    //         backdrop="opaque"
    //         footer={
    //             <div className="flex justify-end gap-2">
    //                 <Button type="submit" color="primary" isLoading={createCareerMutation.isPending} onPress={() => form.handleSubmit()}>Crear Carrera</Button>
    //                 <Button color="danger" onPress={onClose}>Cancelar</Button>
    //             </div>
    //         }
    //     >
    //         <form onSubmit={(e) => {
    //             e.preventDefault();
    //             e.stopPropagation();
    //             form.handleSubmit();
    //         }}>
    //             <div className="flex flex-col gap-2">
    //                 <form.Field name="code">
    //                     {(field) => (
    //                         <Input
    //                             label="Código"
    //                             id="code"
    //                             name="code"
    //                             type="text"
    //                             placeholder="Ingresa el código de la carrera"
    //                             value={field.state.value ?? ""}
    //                             onChange={(e) => {
    //                                 field.handleChange(e.target.value);
    //                             }}
    //                             onBlur={field.handleBlur}
    //                             isInvalid={field.state.meta.errors.length > 0 && field.state.meta.isTouched}
    //                             errorMessage={field.state.meta.errors[0]?.message}
    //                         />
    //                     )}
    //                 </form.Field>
    //                 <form.Field name="name">
    //                     {(field) => (
    //                         <Input
    //                             label="Nombre"
    //                             id="name"
    //                             name="name"
    //                             type="text"
    //                             placeholder="Ingresa el nombre de la carrera"
    //                             value={field.state.value ?? ""}
    //                             onChange={(e) => {
    //                                 field.handleChange(e.target.value);
    //                             }}
    //                             onBlur={field.handleBlur}
    //                             isInvalid={field.state.meta.errors.length > 0 && field.state.meta.isTouched}
    //                             errorMessage={field.state.meta.errors[0]?.message}
    //                         />
    //                     )}
    //                 </form.Field>
    //             </div>
    //         </form>
    //     </Modal>
    // );
}

export default CreateCareerModal;