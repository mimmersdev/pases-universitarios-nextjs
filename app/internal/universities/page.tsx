"use client";

import { useCreateUniversity } from "@/frontend/hooks/university/useCreateUniversity";
import { useUniversities } from "@/frontend/hooks/university/useUniversities";
import { useState, useMemo } from "react";
import CreateUniversityModal from "./components/createUniversityModal";
import { IconPlus } from "@tabler/icons-react";
import { DataTable } from "@/components/ui/data-table";
import { universityColumns } from "./components/universityColumns";
import { SortingState } from "@tanstack/react-table";
import { SortType, UniversityPaginationRequest } from "@/domain/FilteredPagination";
import { CustomButton } from "@/app/components/CustomButton";
import SectionTitle from "@/app/components/SectionTitle";
import DataTablePagination from "@/app/components/TablePagination";
import { Section } from "@/app/components/Section";
import Container from "@/app/components/Container";

export default function UniversitiesPage() {

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [sorting, setSorting] = useState<SortingState>([]);
    const createUniversityMutation = useCreateUniversity();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Convert TanStack Table sorting state to API format
    const sortParams: UniversityPaginationRequest = useMemo(() => {
        if (sorting.length === 0) {
            return {
                sortName: undefined,
                sortCreatedAt: undefined,
                sortUpdatedAt: undefined,
                page: page,
                size: pageSize,
            };
        }

        const sort = sorting[0]; // Only use first sort (single column sorting)
        const sortType = sort.desc ? SortType.DESC : SortType.ASC;

        switch (sort.id) {
            case "name":
                return { sortName: sortType, sortCreatedAt: undefined, sortUpdatedAt: undefined, page: page, size: pageSize };
            case "createdAt":
                return { sortName: undefined, sortCreatedAt: sortType, sortUpdatedAt: undefined, page: page, size: pageSize };
            case "updatedAt":
                return { sortName: undefined, sortCreatedAt: undefined, sortUpdatedAt: sortType, page: page, size: pageSize };
            default:
                return { sortName: undefined, sortCreatedAt: undefined, sortUpdatedAt: undefined, page: page, size: pageSize };
        }
    }, [sorting, page]);

    const { data: universities, isLoading } = useUniversities(sortParams);

    // Reset to first page when sorting changes
    const handleSortingChange = (updater: SortingState | ((old: SortingState) => SortingState)) => {
        setSorting(updater);
        setPage(0); // Reset to first page when sorting changes
    };

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
                        <CustomButton
                            loading={createUniversityMutation.isPending}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <IconPlus />
                            Crear Universidad
                        </CustomButton>
                    </div>
                </div>
                <DataTable
                    columns={universityColumns}
                    data={universities?.content ?? []}
                    pageSize={pageSize}
                    loading={isLoading}
                    sortingOptions={{
                        sorting,
                        setSorting: handleSortingChange,
                    }}
                />

                <DataTablePagination
                    currentPage={page + 1}
                    totalPages={totalPages}
                    onPageChange={(page) => setPage(page - 1)}
                    pageSize={pageSize}
                    onPageSizeChange={(pageSize) => setPageSize(pageSize)}
                    pageSizeOptions={[10, 20, 25, 30, 40, 50]}
                    totalRows={universities?.total ?? 0}
                />
                <CreateUniversityModal
                    open={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                />
            </Container>
        </Section>
    );
}