import Container from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import SectionTitle from "@/app/components/SectionTitle";
import { useCities } from "@/frontend/hooks/city/useCities";
import { useCreateCity } from "@/frontend/hooks/city/useCreateCity";
import { DocumentArrowUpIcon, PlusIcon, PencilIcon } from "@heroicons/react/24/solid";
import { Button, Pagination, TableHeader, TableColumn, TableBody, Spinner, TableRow, TableCell, Table } from "@heroui/react";
import { City } from "pases-universitarios";
import { useState } from "react";
import CreateCityModal from "./createCityModal";
import UpdateCityModal from "./updateCityModal";
import UploadCitiesModal from "./uploadCitiesModal";

interface CitySectionProps {
    universityId: string;
}

export default function CitySection({ universityId }: CitySectionProps) {
    const [page, setPage] = useState(0);
    const { data: cities, isLoading } = useCities({ universityId, page, size: 10 });
    const createCityMutation = useCreateCity(universityId);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City | null>(null);

    const handleClickUpdateCity = (city: City) => {
        setSelectedCity(city);
        setIsUpdateModalOpen(true);
    }

    const handleCloseUpdateModal = () => {
        setIsUpdateModalOpen(false);
        setSelectedCity(null);
    }

    const totalPages = (() => {
        if (cities) {
            return Math.ceil((cities.total) / (cities.size));
        }
        return 0;
    })();

    return (
        <Section>
            <Container>
                <div className="flex justify-between items-center mb-4">
                    <SectionTitle removeMargin={true}>Ciudades</SectionTitle>
                    <div className="flex flex-row gap-2">
                        <Button
                            startContent={<DocumentArrowUpIcon className="w-5 h-5" />}
                            color="primary"
                            onPress={() => setIsUploadModalOpen(true)}
                            isLoading={createCityMutation.isPending}
                        >
                            Crear Ciuades (JSON)
                        </Button>
                        <Button
                            startContent={<PlusIcon className="w-5 h-5" />}
                            color="primary"
                            onPress={() => setIsCreateModalOpen(true)}
                            isLoading={createCityMutation.isPending}
                        >
                            Crear Ciudad
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
                        <TableColumn key="code">Código</TableColumn>
                        <TableColumn key="createdAt">Fecha de creación</TableColumn>
                        <TableColumn key="updatedAt">Fecha de actualización</TableColumn>
                        <TableColumn key="actions">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={cities?.content ?? []}
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
                                    <Button size="sm" color="primary" isIconOnly onPress={() => handleClickUpdateCity(item)}>
                                        <PencilIcon className="w-5 h-5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <CreateCityModal
                    universityId={universityId}
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
                <UploadCitiesModal
                    universityId={universityId}
                    open={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                />
                {selectedCity && (
                    <UpdateCityModal
                        universityId={universityId}
                        selectedCity={selectedCity}
                        open={isUpdateModalOpen}
                        onClose={handleCloseUpdateModal}
                    />
                )}
            </Container>
        </Section >
    );
}