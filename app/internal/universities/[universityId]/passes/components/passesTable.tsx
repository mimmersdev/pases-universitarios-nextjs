import { DataTable } from "@/components/ui/data-table";
import FilterIncludeExclude, { Option } from "./filterIncludeExclude";
import { CareerPaginationRequest, DateFilterRange, DateFilterSingleDate, FilterIncludeExcludeType, PassPaginationRequest } from "@/domain/FilteredPagination";
import { useInfiniteCareers } from "@/frontend/hooks/career/useCareers";
import useDebouncedValue from "@/frontend/hooks/utils/debouncedValue";
import { useMemo, useState } from "react";
import { VisibilityState } from "@tanstack/react-table";
import passesColumns from "./passesColumns";
import { getPassStatusLabel, getStudentStatusLabel, Pass, passStatusList, paymentStatusList, studentStatusList } from "pases-universitarios";
import { usePaginatedPasses } from "@/frontend/hooks/pass/usePaginatedPasses";
import FilterRange from "./filterRange";
import { paymentStatusToLabel } from "@/domain/Labels";
import FilterDate from "./filterDate";
import DataTablePagination from "@/app/components/TablePagination";
import { Button } from "@/components/ui/button";
import { XIcon, Columns, BellIcon } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import SendNotificationModal from "./sendNotificationModal";

interface PassesTableProps {
    universityId: string;
    onViewPass: (pass: Pass) => void;
}

const PassesTable: React.FC<PassesTableProps> = ({ universityId, onViewPass }) => {
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const handlePageSizeChange = (pageSize: number) => {
        setPageSize(pageSize);
        setPage(0);
    };
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        name: false,
        email: false,
        studentStatus: false,
        cashback: false,
        endDueDate: false,
    });

    // Pass Filters - Careers
    const [careerType, setCareerType] = useState<FilterIncludeExcludeType>(FilterIncludeExcludeType.Include);
    const [careerSearchTerm, setCareerSearchTerm] = useState<string>("");
    const { debouncedValue: debouncedCareerSearchTerm, loading: isDebouncedCareerSearchLoading } = useDebouncedValue({ value: careerSearchTerm, onChange: setCareerSearchTerm });

    const [selectedCareers, setSelectedCareers] = useState<Option[]>([]);

    const baseRequest: Omit<CareerPaginationRequest, 'page'> = {
        size: pageSize,
        sortCode: undefined,
        sortName: undefined,
        sortCreatedAt: undefined,
        sortUpdatedAt: undefined,
        searchName: debouncedCareerSearchTerm.trim() === "" ? undefined : debouncedCareerSearchTerm,
    };

    const {
        data: infiniteCareersData,
        isFetching: isFilteredCareersLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    } = useInfiniteCareers(universityId as string, baseRequest);

    // Flatten all pages into a single array of careers
    const allCareers = infiniteCareersData?.pages.flatMap(page => page.content) ?? [];

    // Show loading immediately when user types (before debounce) or when fetching
    const isCareerSearchLoading = isDebouncedCareerSearchLoading || (isFilteredCareersLoading && !isFetchingNextPage);

    const handleCareerSearchTermChange_Career = (searchTerm: string) => {
        setCareerSearchTerm(searchTerm);
    }

    const handleLoadMore_Career = () => {
        if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }

    // Pass Filters - Semester
    const [selectedSemesters, setSelectedSemesters] = useState<Option[]>([]);
    const [semesterType, setSemesterType] = useState<FilterIncludeExcludeType>(FilterIncludeExcludeType.Include);
    const [semesterSearchTerm, setSemesterSearchTerm] = useState<string>("");

    // Pass Filters - Enrollment Year
    const [enrollmentYearRange, setEnrollmentYearRange] = useState<{ min: number; max: number } | null>(null);

    // Pass Filters - Payment Status
    const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<Option[]>([]);
    const [paymentStatusType, setPaymentStatusType] = useState<FilterIncludeExcludeType>(FilterIncludeExcludeType.Include);
    const [paymentStatusSearchTerm, setPaymentStatusSearchTerm] = useState<string>("");

    // Pass Filters - Student Status
    const [selectedStudentStatuses, setSelectedStudentStatuses] = useState<Option[]>([]);
    const [studentStatusType, setStudentStatusType] = useState<FilterIncludeExcludeType>(FilterIncludeExcludeType.Include);
    const [studentStatusSearchTerm, setStudentStatusSearchTerm] = useState<string>("");

    // Pass Filters - Pass Status
    const [selectedPassStatuses, setSelectedPassStatuses] = useState<Option[]>([]);
    const [passStatusType, setPassStatusType] = useState<FilterIncludeExcludeType>(FilterIncludeExcludeType.Include);
    const [passStatusSearchTerm, setPassStatusSearchTerm] = useState<string>("");

    // Pass Filters - Total to Pay Range
    const [totalToPayRange, setTotalToPayRange] = useState<{ min: number; max: number } | null>(null);

    // Pass Filters - Cashback Range
    const [cashbackRange, setCashbackRange] = useState<{ min: number; max: number } | null>(null);

    // Pass Filters - End Due Date
    const [endDueDate, setEndDueDate] = useState<DateFilterSingleDate | DateFilterRange | null>(null);

    // Build PassPaginationRequest from filter states
    const passPaginationRequest: PassPaginationRequest = useMemo(() => {
        const request: PassPaginationRequest = {
            page,
            size: pageSize,
        };

        // Include/Exclude filters
        if (selectedCareers.length > 0) {
            request.career = {
                type: careerType,
                values: selectedCareers.map(c => c.value),
            };
        }

        if (selectedSemesters.length > 0) {
            request.semester = {
                type: semesterType,
                values: selectedSemesters.map(s => s.value),
            };
        }

        // Note: enrollmentYear is defined as includeExcludeFilterSchema in the schema,
        // but the component uses FilterRange. For now, we'll skip it or you may need to adjust.
        // If you want to support range for enrollmentYear, the schema needs to be updated.

        if (selectedPaymentStatuses.length > 0) {
            request.paymentStatus = {
                type: paymentStatusType,
                values: selectedPaymentStatuses.map(p => p.value),
            };
        }

        if (selectedStudentStatuses.length > 0) {
            request.studentStatus = {
                type: studentStatusType,
                values: selectedStudentStatuses.map(s => s.value),
            };
        }

        if (selectedPassStatuses.length > 0) {
            request.passStatus = {
                type: passStatusType,
                values: selectedPassStatuses.map(p => p.value),
            };
        }

        // Range filters
        if (enrollmentYearRange) {
            request.enrollmentYear = {
                min: enrollmentYearRange.min,
                max: enrollmentYearRange.max,
            };
        }
        if (totalToPayRange) {
            request.totalToPay = {
                min: totalToPayRange.min,
                max: totalToPayRange.max,
            };
        }

        if (cashbackRange) {
            request.cashback = {
                min: cashbackRange.min,
                max: cashbackRange.max,
            };
        }

        // Date filter - convert from Date objects to ISO date strings
        // Note: The FilterDate component uses Date objects internally but the type annotation says strings
        if (endDueDate) {
            // Helper to convert Date to ISO string (preserves timezone information)
            const toDateString = (date: unknown): string => {
                if (date instanceof Date) {
                    return date.toISOString();
                }
                return String(date);
            };

            // Type assertion needed because FilterDate actually uses Date objects despite type saying strings
            const endDueDateAny = endDueDate as any;

            if ('value' in endDueDate) {
                // Single date
                request.endDueDate = {
                    value: toDateString(endDueDateAny.value),
                    comparation: endDueDate.comparation,
                } as any;
            } else {
                // Date range
                request.endDueDate = {
                    startDate: toDateString(endDueDateAny.startDate),
                    endDate: toDateString(endDueDateAny.endDate),
                } as any;
            }
        }

        return request;
    }, [
        page,
        pageSize,
        selectedCareers,
        careerType,
        selectedSemesters,
        semesterType,
        enrollmentYearRange,
        selectedPaymentStatuses,
        paymentStatusType,
        selectedStudentStatuses,
        studentStatusType,
        selectedPassStatuses,
        passStatusType,
        totalToPayRange,
        cashbackRange,
        endDueDate,
    ]);

    const { data: passes, isLoading } = usePaginatedPasses(universityId as string, passPaginationRequest);

    const totalPages = (() => {
        if (passes) {
            return Math.ceil((passes.total) / (passes.size));
        }
        return 0;
    })();

    // Get columns for visibility menu
    const columns = passesColumns({ onViewPass, onDeletePass: () => { } });

    // Handle changes in filters
    const handleSelectedCareersChange = (selectedCareers: Option[]) => {
        setSelectedCareers(selectedCareers);
        setPage(0);
    }
    const handleSelectedSemestersChange = (selectedSemesters: Option[]) => {
        setSelectedSemesters(selectedSemesters);
        setPage(0);
    }
    const handleEnrollmentYearRangeChange = (enrollmentYearRange: { min: number; max: number } | null) => {
        setEnrollmentYearRange(enrollmentYearRange);
        setPage(0);
    }
    const handleSelectedPaymentStatusesChange = (selectedPaymentStatuses: Option[]) => {
        setSelectedPaymentStatuses(selectedPaymentStatuses);
        setPage(0);
    }
    const handleSelectedStudentStatusesChange = (selectedStudentStatuses: Option[]) => {
        setSelectedStudentStatuses(selectedStudentStatuses);
        setPage(0);
    }
    const handleSelectedPassStatusesChange = (selectedPassStatuses: Option[]) => {
        setSelectedPassStatuses(selectedPassStatuses);
        setPage(0);
    }
    const handleTotalToPayRangeChange = (totalToPayRange: { min: number; max: number } | null) => {
        setTotalToPayRange(totalToPayRange);
        setPage(0);
    }
    const handleCashbackRangeChange = (cashbackRange: { min: number; max: number } | null) => {
        setCashbackRange(cashbackRange);
        setPage(0);
    }
    const handleEndDueDateChange = (endDueDate: DateFilterSingleDate | DateFilterRange | null) => {
        setEndDueDate(endDueDate);
        setPage(0);
    }

    const displayClearFiltersButton = () => {
        if (
            selectedCareers.length > 0 ||
            selectedSemesters.length > 0 ||
            enrollmentYearRange !== null ||
            selectedPaymentStatuses.length > 0 ||
            selectedStudentStatuses.length > 0 ||
            selectedPassStatuses.length > 0 ||
            totalToPayRange !== null ||
            cashbackRange !== null ||
            endDueDate !== null
        ) {
            return (<Button
                size="sm"
                variant="ghost"
                onClick={() => {
                    setSelectedCareers([]);
                    setSelectedSemesters([]);
                    setEnrollmentYearRange(null);
                    setSelectedPaymentStatuses([]);
                    setSelectedStudentStatuses([]);
                    setSelectedPassStatuses([]);
                    setTotalToPayRange(null);
                    setCashbackRange(null);
                    setEndDueDate(null);
                    setPage(0);
                }}
            >
                <XIcon />
                Limpiar filtros
            </Button>)
        }
    }

    return (<>
        <div className="flex flex-row gap-2">
            <div className="flex flex-1 flex-row flex-wrap gap-2 mb-4 border-r border-border border-dashed">
                <FilterIncludeExclude
                    selectedValues={selectedCareers}
                    setSelectedValues={handleSelectedCareersChange}
                    displayValue={true}
                    label="Programa"
                    searchPlaceholder="Buscar programa..."
                    badgesLabel="programas"
                    type={careerType}
                    setType={setCareerType}
                    options={allCareers.map((career) => ({ value: career.code, label: career.name }))}
                    searchTerm={careerSearchTerm}
                    setSearchTerm={handleCareerSearchTermChange_Career}
                    loading={isCareerSearchLoading}
                    infiniteScroll={{
                        onLoadMore: handleLoadMore_Career,
                        canLoadMore: hasNextPage ?? false
                    }}
                />
                <FilterIncludeExclude
                    selectedValues={selectedSemesters}
                    setSelectedValues={handleSelectedSemestersChange}
                    label="Semestre"
                    searchPlaceholder="Buscar semestre..."
                    badgesLabel="semestres"
                    type={semesterType}
                    setType={setSemesterType}
                    options={Array.from({ length: 10 }, (_, index) => ({ value: (index + 1).toString(), label: `Semestre ${index + 1}` }))}
                    searchTerm={semesterSearchTerm}
                    setSearchTerm={setSemesterSearchTerm}
                    loading={false}
                />
                <FilterRange
                    label="Año de inscripción"
                    minLabel="Año mínimo"
                    minPlaceholder="2020"
                    maxLabel="Año máximo"
                    maxPlaceholder="2025"
                    value={enrollmentYearRange}
                    setValue={handleEnrollmentYearRangeChange}
                />
                <FilterIncludeExclude
                    selectedValues={selectedPaymentStatuses}
                    setSelectedValues={handleSelectedPaymentStatusesChange}
                    label="Estado de pago"
                    searchPlaceholder="Buscar estado de pago..."
                    badgesLabel="estados de pago"
                    type={paymentStatusType}
                    setType={setPaymentStatusType}
                    options={paymentStatusList.map((paymentStatus) => ({ value: paymentStatus, label: paymentStatusToLabel(paymentStatus) }))}
                    searchTerm={paymentStatusSearchTerm}
                    setSearchTerm={setPaymentStatusSearchTerm}
                    loading={false}
                />
                <FilterIncludeExclude
                    selectedValues={selectedStudentStatuses}
                    setSelectedValues={handleSelectedStudentStatusesChange}
                    label="Estado del estudiante"
                    searchPlaceholder="Buscar estado del estudiante..."
                    badgesLabel="estados de estudiante"
                    type={studentStatusType}
                    setType={setStudentStatusType}
                    options={studentStatusList.map((studentStatus) => ({ value: studentStatus, label: getStudentStatusLabel(studentStatus) }))}
                    searchTerm={studentStatusSearchTerm}
                    setSearchTerm={setStudentStatusSearchTerm}
                    loading={false}
                />
                <FilterIncludeExclude
                    selectedValues={selectedPassStatuses}
                    setSelectedValues={handleSelectedPassStatusesChange}
                    label="Estado del pase"
                    searchPlaceholder="Buscar estado del pase..."
                    badgesLabel="estados de pase"
                    type={passStatusType}
                    setType={setPassStatusType}
                    options={passStatusList.map((passStatus) => ({ value: passStatus, label: getPassStatusLabel(passStatus) }))}
                    searchTerm={passStatusSearchTerm}
                    setSearchTerm={setPassStatusSearchTerm}
                    loading={false}
                />
                <FilterRange
                    label="Total a pagar"
                    minLabel="Total a pagar mínimo"
                    minPlaceholder="1.000.000"
                    maxLabel="Total a pagar máximo"
                    maxPlaceholder="10.000.000"
                    value={totalToPayRange}
                    setValue={handleTotalToPayRangeChange}
                    numericFormat={{
                        thousandSeparator: true,
                        moneySymbol: true,
                    }}
                />
                <FilterRange
                    label="Cashback"
                    minLabel="Cashback mínimo"
                    minPlaceholder="1.000.000"
                    maxLabel="Cashback máximo"
                    maxPlaceholder="10.000.000"
                    value={cashbackRange}
                    setValue={handleCashbackRangeChange}
                    numericFormat={{
                        thousandSeparator: true,
                        moneySymbol: false,
                    }}
                />
                <FilterDate
                    label="Fecha de vencimiento"
                    value={endDueDate}
                    setValue={handleEndDueDateChange}
                />
                {displayClearFiltersButton()}
            </div>
            <div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                        >
                            <Columns className="h-4 w-4 mr-2" />
                            Columnas
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                        <DropdownMenuLabel>Toggle columnas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {columns    
                            .filter((column) => column.enableHiding !== false)
                            .map((column) => {
                                const columnId = column.id || (column as any).accessorKey;
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={columnId}
                                        checked={columnVisibility[columnId] !== false}
                                        onCheckedChange={(checked) => {
                                            setColumnVisibility((prev) => ({
                                                ...prev,
                                                [columnId]: checked,
                                            }));
                                        }}
                                    >
                                        {typeof column.header === 'string'
                                            ? column.header
                                            : column.header?.toString() || columnId}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <DataTable
            columns={columns}
            data={passes?.content ?? []}
            pageSize={pageSize}
            loading={isLoading}
            columnVisibilityOptions={{
                columnVisibility,
                setColumnVisibility,
            }}
        />
        <div className="flex flex-row justify-between">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        onClick={() => setIsNotificationModalOpen(true)}
                        className="mt-4"
                    >
                        <BellIcon />
                        Enviar notificaciones ({passes?.total ?? 0})
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    Envia notificaciones a todos los pases que se encuentren bajo los filtros aplicados.
                </TooltipContent>
            </Tooltip>

            <DataTablePagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 20, 25, 30, 40, 50]}
                totalRows={passes?.total ?? 0}
            />
        </div>

        <SendNotificationModal
            universityId={universityId}
            pRequest={passPaginationRequest}
            open={isNotificationModalOpen}
            onClose={() => setIsNotificationModalOpen(false)}
            totalPasses={passes?.total ?? 0}
        />

    </>);
};

export default PassesTable;