import Container from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import SectionTitle from "@/app/components/SectionTitle";
import { useCareers } from "@/frontend/hooks/career/useCareers";
import { useCreateCareer } from "@/frontend/hooks/career/useCreateCareer";
import { PencilIcon } from "@heroicons/react/24/solid";
import { Button, Pagination, TableHeader, TableColumn, TableBody, Spinner, TableRow, TableCell, Table } from "@heroui/react";
import { Career } from "pases-universitarios";
import { useState, useEffect } from "react";
import UpdateCareerModal from "./updateCareerModal";
import CreateCareerModal from "./createCareerModal";

interface CareerSectionProps {
    universityId: string;
}

export default function CareerSection({ universityId }: CareerSectionProps) {
    const [page, setPage] = useState(0);
    const { data: careers, isLoading } = useCareers({ universityId, page, size: 10 });
    const createCareerMutation = useCreateCareer(universityId);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

    const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

    const handleClickUpdateCareer = (career: Career) => {
        setSelectedCareer(career);
        setIsUpdateModalOpen(true);
    }

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedCareer(null);
    }

    const totalPages = (() => {
        if(careers) {
            return Math.ceil((careers.total)/(careers.size));
        }
        return 0;
    })();

    useEffect(() => {
        console.log(careers);
    }, [careers]);
    
    return (
        <Section>
            <Container>
                <div className="flex justify-between items-center mb-4">
                    <SectionTitle>Carreras</SectionTitle>
                    <Button 
                        color="primary" 
                        onPress={() => setIsCreateModalOpen(true)}
                        isLoading={createCareerMutation.isPending}
                    >
                        Crear Carrera
                    </Button>
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
                        <TableColumn key="code">Código</TableColumn>
                        <TableColumn key="createdAt">Fecha de creación</TableColumn>
                        <TableColumn key="updatedAt">Fecha de actualización</TableColumn>
                        <TableColumn key="actions">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={careers?.content ?? []}
                        loadingContent={<Spinner />}
                        loadingState={isLoading ? 'loading' : 'idle'}
                    >
                        {(item) => (
                            <TableRow 
                                key={item.code}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.code}</TableCell>
                                <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                                <TableCell>{item.updatedAt.toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Button size="sm" color="primary" isIconOnly onPress={() => handleClickUpdateCareer(item)}>
                                        <PencilIcon className="w-5 h-5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                <CreateCareerModal
                    universityId={universityId}
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
                {selectedCareer && (
                    <UpdateCareerModal
                        universityId={universityId}
                        selectedCareer={selectedCareer}
                        open={isUpdateModalOpen}
                        onClose={handleCloseUpdateModal}
                    />
                )}
            </Container>
        </Section>
    )
}