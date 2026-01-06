"use client";

import Container from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import SectionTitle from "@/app/components/SectionTitle";
import { useUniversity } from "@/frontend/hooks/university/useUniversity";
import { useUpdateUniversity } from "@/frontend/hooks/university/useUpdateUniversity";
import { useForm } from "@tanstack/react-form";
import { useParams, useRouter } from "next/navigation";
import { UpdateUniversity, updateUniversitySchema } from "pases-universitarios";
import CareerSection from "./components/career/CareerSection";
import PageSpinner from "@/app/components/PageSpinner";
import { Button } from "@/components/ui/button";
import { IconFiles, IconArrowLeft } from "@tabler/icons-react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CustomButton } from "@/app/components/CustomButton";
import { toast } from "sonner";

export default function UniversityPage() {
    const router = useRouter();

    const { universityId } = useParams();
    const { data: university, isLoading } = useUniversity(universityId as string);

    const updateUniversityMutation = useUpdateUniversity(universityId as string);
    const form = useForm({
        defaultValues: {
            name: university?.name ?? '',
        } satisfies UpdateUniversity,
        validators: {
            onSubmit: updateUniversitySchema,
            onBlur: updateUniversitySchema,
            onChange: updateUniversitySchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await updateUniversityMutation.mutateAsync(value);
                toast.success("Universidad actualizada correctamente");
                form.reset();
            } catch (error) {
                toast.error("Error al actualizar la universidad");
                console.error(error);
            }
        }
    });

    if (isLoading) {
        return <PageSpinner />;
    }
    if (!university) {
        return <div>Universidad no encontrada</div>;
    }

    return (<>
        <Section>
            <Container>
                <div className="flex justify-between items-center mb-4">
                    <SectionTitle removeMargin={true}>{university.name}</SectionTitle>
                    <div className="flex flex-row gap-2">
                        <Button variant="default" onClick={() => router.push(`/internal/universities/${universityId}/passes`)}><IconFiles className="w-5 h-5" /> Pases</Button>
                        <Button variant="default" onClick={() => router.push(`/internal/universities`)}><IconArrowLeft className="w-5 h-5" /> Atrás</Button>
                    </div>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                    <div className="flex flex-col gap-2 mb-4">
                        <form.Field name="name">
                            {(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return(
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => {
                                                field.handleChange(e.target.value);
                                            }}
                                            aria-invalid={isInvalid}
                                            placeholder="Ingresa el nombre de la universidad"
                                            autoComplete="off"
                                        />

                                        
                                    </Field>

                                );
                            }
                            }
                        </form.Field>
                    </div>
                    <div className="flex justify-end gap-2">
                        <CustomButton
                            type="submit"
                            variant="default"
                            loading={updateUniversityMutation.isPending}
                            onClick={() => form.handleSubmit()}
                        >
                            Guardar
                        </CustomButton>
                    </div>
                </form>
            </Container>
        </Section>
        <CareerSection universityId={universityId as string} />
    </>);
}