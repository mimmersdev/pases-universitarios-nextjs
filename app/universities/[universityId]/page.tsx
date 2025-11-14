"use client";

import Container from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import SectionTitle from "@/app/components/SectionTitle";
import { useUniversity } from "@/frontend/hooks/university/useUniversity";
import { useUpdateUniversity } from "@/frontend/hooks/university/useUpdateUniversity";
import { Button, Input, Spinner } from "@heroui/react";
import { useForm } from "@tanstack/react-form";
import { useParams, useRouter } from "next/navigation";
import { UpdateUniversity, updateUniversitySchema } from "pases-universitarios";
import CitySection from "./components/city/CitySection";
import CareerSection from "./components/career/CareerSection";
import { ArrowLeftIcon, DocumentDuplicateIcon } from "@heroicons/react/24/solid";

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
                form.reset();
            } catch (error) {
                console.error(error);
            }
        }
    });

    if (isLoading) {
        return <Spinner />;
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
                        <Button color="success" startContent={<DocumentDuplicateIcon className="w-5 h-5" />} onPress={() => router.push(`/universities/${universityId}/passes`)}>Pases</Button>
                        <Button color="primary" startContent={<ArrowLeftIcon className="w-5 h-5" />} onPress={() => router.back()}>Atrás</Button>
                    </div>
                </div>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                    <div className="flex flex-col gap-2 mb-4">
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
                    <div className="flex justify-end gap-2">
                        <Button type="submit" color="primary" isLoading={updateUniversityMutation.isPending} onPress={() => form.handleSubmit()}>Guardar</Button>
                    </div>
                </form>
            </Container>
        </Section>
        <CitySection universityId={universityId as string} />
        <CareerSection universityId={universityId as string} />
    </>);
}