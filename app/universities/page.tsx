"use client";

import { useCreateUniversity } from "@/frontend/hooks/university/useCreateUniversity";
import { useUniversities } from "@/frontend/hooks/university/useUniversities";
import { useState } from "react";
import { Section } from "../components/Section";
import Container from "../components/Container";
import { EyeIcon, PlusIcon } from "@heroicons/react/24/solid";
import { Button, Pagination, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react";
import SectionTitle from "../components/SectionTitle";
import { University } from "pases-universitarios";
import CreateUniversityModal from "./components/createUniversityModal";
import { useRouter } from "next/navigation";

export default function UniversitiesPage() {
    const router = useRouter();

    const [page, setPage] = useState(0);
    const { data: universities, isLoading } = useUniversities({ page, size: 10 });
    const createUniversityMutation = useCreateUniversity();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const handleClickViewUniversity = (university: University) => {
        router.push(`/universities/${university.id}`);
    }

    const totalPages = (() => {
        if (universities) {
            return Math.ceil((universities.total) / (universities.size));
        }
        return 0;
    })();

    return (
        <Section>
            <Container>
                <div className="flex justify-between items-center mb-4">
                    <SectionTitle removeMargin={true}>Universidades</SectionTitle>
                    <div className="flex flex-row gap-2">
                        <Button
                            startContent={<PlusIcon className="w-5 h-5" />}
                            color="primary"
                            onPress={() => setIsCreateModalOpen(true)}
                            isLoading={createUniversityMutation.isPending}
                        >
                            Crear Universidad
                        </Button>
                    </div>
                </div>
                <Table
                    bottomContent={
                        totalPages > 0 ? (
                            <div className="flex w-full justify-center">
                                <Pagination
                                    isCompact
                                    showControls
                                    showShadow
                                    color="primary"
                                    page={page + 1}
                                    total={totalPages}
                                    onChange={(newPage) => setPage(newPage - 1)}
                                />
                            </div>
                        ) : null
                    }

                >
                    <TableHeader>
                        <TableColumn key="name">Nombre</TableColumn>
                        <TableColumn key="createdAt">Fecha de creación</TableColumn>
                        <TableColumn key="updatedAt">Fecha de actualización</TableColumn>
                        <TableColumn key="actions">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={universities?.content ?? []}
                        loadingContent={<Spinner />}
                        loadingState={isLoading ? 'loading' : 'idle'}
                    >
                        {(item) => (
                            <TableRow
                                key={item.id}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                                <TableCell>{item.updatedAt.toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button size="sm" color="primary" isIconOnly onPress={() => handleClickViewUniversity(item)}>
                                        <EyeIcon className="w-5 h-5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}

                    </TableBody>
                </Table>
                <CreateUniversityModal
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            </Container>
        </Section>
    );
}