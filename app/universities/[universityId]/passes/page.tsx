"use client";

import { Button, Chip, Pagination, Spinner, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Tooltip } from "@heroui/react";
import Container from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import SectionTitle from "@/app/components/SectionTitle";
import { usePaginatedPasses } from "@/frontend/hooks/pass/usePaginatedPasses";
import { useEffect, useState } from "react";
import ViewPassModal from "./components/viewPassModal";
import UploadPassesModal from "./components/uploadPassesModal";
import SendNotificationModal from "./components/sendNotificationModal";
import { FilterTags, Pass } from "pases-universitarios";
import { EyeIcon, DocumentArrowUpIcon, BellIcon, ArrowLeftIcon } from "@heroicons/react/24/solid";
import { passStatusToLabel, paymentStatusToLabel } from "@/domain/Labels";
import FilterPassesComponent from "./components/filterPasses";
import { useParams, useRouter } from "next/navigation";

export default function PassesPage() {
    const { universityId } = useParams();
    const router = useRouter();
    
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState<FilterTags>({});
    const [debouncedFilters, setDebouncedFilters] = useState<FilterTags>({});
    const { data: passes, isLoading } = usePaginatedPasses(universityId as string, { page, size: 10, filters: debouncedFilters });
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [selectedPass, setSelectedPass] = useState<Pass | null>(null);

    // Debounce filters: wait 1 second after user stops typing
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 2000);

        return () => clearTimeout(timer);
    }, [filters]);



    const handleClickViewPass = (pass: Pass) => {
        setSelectedPass(pass);
        setIsViewModalOpen(true);
    }

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedPass(null);
    }

    const totalPages = (() => {
        if (passes) {
            return Math.ceil((passes.total) / (passes.size));
        }
        return 0;
    })();

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'success';
            case 'Due': return 'warning';
            case 'Overdue': return 'danger';
            default: return 'default';
        }
    };

    const getPassStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'success';
            case 'Inactive': return 'default';
            default: return 'default';
        }
    };

    // useEffect(() => {
    //     console.log(passes);
    // }, [passes]);

    return (
        <Section>
            <Container>
                <div className="flex flex-row justify-between w-full mb-4">
                    <SectionTitle removeMargin={true}>Pases</SectionTitle>
                    <Button
                        color="primary"
                        startContent={<ArrowLeftIcon className="w-5 h-5" />}
                        onPress={() => router.back()}
                    >
                        Atrás
                    </Button>
                </div>
                <div className="flex flex-row justify-between w-full mb-4">
                    <FilterPassesComponent universityId={universityId as string} filters={filters} setFilters={setFilters} />
                    <Button
                        color="primary"
                        startContent={<DocumentArrowUpIcon className="w-5 h-5" />}
                        onPress={() => setIsUploadModalOpen(true)}
                    >
                        Cargar Pases
                    </Button>
                </div>
                <Table
                    aria-label="Tabla de pases universitarios"
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
                        <TableColumn key="uniqueIdentifier">ID Único</TableColumn>
                        <TableColumn key="careerId">Código Carrera</TableColumn>
                        <TableColumn key="semester">Semestre</TableColumn>
                        <TableColumn key="enrollmentYear">Año Matrícula</TableColumn>
                        <TableColumn key="paymentStatus">Estado Pago</TableColumn>
                        <TableColumn key="passStatus">Estado Pase</TableColumn>
                        <TableColumn key="totalToPay">Total a Pagar</TableColumn>
                        <TableColumn key="actions">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={passes?.content ?? []}
                        loadingContent={<Spinner />}
                        loadingState={isLoading ? 'loading' : 'idle'}
                    >
                        {(item) => (
                            <TableRow
                                key={`${item.uniqueIdentifier}-${item.careerId}`}
                                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <TableCell>{item.uniqueIdentifier}</TableCell>
                                <TableCell>{item.careerId}</TableCell>
                                <TableCell>{item.semester}</TableCell>
                                <TableCell>{item.enrollmentYear}</TableCell>
                                <TableCell>
                                    <Chip color={getPaymentStatusColor(item.paymentStatus)} size="sm" variant="flat">
                                        {paymentStatusToLabel(item.paymentStatus)}
                                    </Chip>
                                </TableCell>
                                <TableCell>
                                    <Chip color={getPassStatusColor(item.status)} size="sm" variant="flat">
                                        {passStatusToLabel(item.status)}
                                    </Chip>
                                </TableCell>
                                <TableCell>${Number(item.totalToPay).toFixed(2)}</TableCell>
                                <TableCell>
                                    <Button size="sm" color="primary" isIconOnly onPress={() => handleClickViewPass(item)}>
                                        <EyeIcon className="w-5 h-5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="mt-4">
                    <Tooltip content="Envia notificaciones a todos los pases que se encuentren bajo los filtros aplicados.">
                        <Button 
                            startContent={<BellIcon className="w-5 h-5" />} 
                            color="success" 
                            onPress={() => setIsNotificationModalOpen(true)}
                            isDisabled={!passes || passes.total === 0}
                        >
                            Enviar Notificaciones ({passes?.total ?? 0})
                        </Button>
                    </Tooltip>
                </div>

                {selectedPass && (
                    <ViewPassModal
                        selectedPass={selectedPass}
                        open={isViewModalOpen}
                        onClose={handleCloseViewModal}
                    />
                )}

                <UploadPassesModal
                    universityId={universityId as string}
                    open={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                />

                <SendNotificationModal
                    universityId={universityId as string}
                    filters={debouncedFilters}
                    open={isNotificationModalOpen}
                    onClose={() => setIsNotificationModalOpen(false)}
                    totalPasses={passes?.total}
                />
            </Container>
        </Section>
    )
}

