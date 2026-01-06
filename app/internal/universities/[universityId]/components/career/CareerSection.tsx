import Container from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import SectionTitle from "@/app/components/SectionTitle";
import { useCareers } from "@/frontend/hooks/career/useCareers";
import { useCreateCareer } from "@/frontend/hooks/career/useCreateCareer";
import { PencilIcon } from "@heroicons/react/24/solid";
import { Button, Pagination, TableHeader, TableColumn, TableBody, Spinner, TableRow, TableCell, Table } from "@heroui/react";
import { Career } from "pases-universitarios";
import { useState, useEffect, useMemo } from "react";
import UpdateCareerModal from "./updateCareerModal";
import CreateCareerModal from "./createCareerModal";
import { DataTable } from "@/components/ui/data-table";
import careerColumns from "./careerColumns";
import { CustomButton } from "@/app/components/CustomButton";
import { IconPlus } from "@tabler/icons-react";
import { SortingState } from "@tanstack/react-table";
import { CareerPaginationRequest, SortType } from "@/domain/FilteredPagination";
import DataTablePagination from "@/app/components/TablePagination";

interface CareerSectionProps {
    universityId: string;
}

export default function CareerSection({ universityId }: CareerSectionProps) {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const handlePageSizeChange = (pageSize: number) => {
        setPageSize(pageSize);
        setPage(0);
    };
    const [sorting, setSorting] = useState<SortingState>([]);

    const sortParams: CareerPaginationRequest = useMemo(() => {

        if (sorting.length === 0) {
            return {
                page: page,
                size: pageSize,
                sortCode: undefined,
                sortName: undefined,
                sortCreatedAt: undefined,
                sortUpdatedAt: undefined,
            }
        }

        const sort = sorting[0]; // Only use first sort (single column sorting)
        const sortType = sort.desc ? SortType.DESC : SortType.ASC;
        switch (sort.id) {
            case "code":
                return { sortCode: sortType, sortName: undefined, sortCreatedAt: undefined, sortUpdatedAt: undefined, page: page, size: pageSize };
            case "name":
                return { sortCode: undefined, sortName: sortType, sortCreatedAt: undefined, sortUpdatedAt:  undefined, page: page, size: pageSize };
            case "createdAt":
                return { sortCode: undefined, sortName: undefined, sortCreatedAt: sortType, sortUpdatedAt: undefined, page: page, size: pageSize };
            case "updatedAt":
                return { sortCode: undefined, sortName: undefined, sortCreatedAt: undefined, sortUpdatedAt: sortType, page: page, size: pageSize };
            default:
                return { sortCode: undefined, sortName: undefined, sortCreatedAt: undefined, sortUpdatedAt: undefined, page: page, size: pageSize };
        }
    }, [sorting, page, pageSize]);
    
    const { data: careers, isLoading } = useCareers(universityId, sortParams);

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
                    <CustomButton 
                        onClick={() => setIsCreateModalOpen(true)}
                        loading={createCareerMutation.isPending}
                    >
                        <IconPlus />
                        Crear Carrera
                    </CustomButton>
                </div>
                <DataTable
                    columns={careerColumns({ onViewCareer: handleClickUpdateCareer, onDeleteCareer: () => {} })}
                    data={careers?.content ?? []}
                    pageSize={pageSize}
                    loading={isLoading}
                    sortingOptions={{
                        sorting,
                        setSorting: setSorting,
                    }}
                />
                <DataTablePagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    pageSizeOptions={[10, 20, 25, 30, 40, 50]}
                    totalRows={careers?.total ?? 0}
                />

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