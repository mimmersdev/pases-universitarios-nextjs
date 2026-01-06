"use client";

import { Autocomplete, AutocompleteItem, Button, Chip, DatePicker, DateRangePicker, Divider, Input, Select, SelectItem, SharedSelection, Spinner } from "@heroui/react";
import { FilterTags, ListComparation, PaymentStatus, SingularValueComparation } from "pases-universitarios";
import { Dispatch, Key, SetStateAction, useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Modal } from "@/app/components/Modal";
import { useCareers } from "@/frontend/hooks/career/useCareers";
import { getLocalTimeZone } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";
import { paymentStatusToLabel } from "@/domain/Labels";

interface FilterPassesComponentProps {
    universityId: string;
    filters: FilterTags;
    setFilters: Dispatch<SetStateAction<FilterTags>>;
}

enum FilterKey {
    CareerId = "careerId",
    Semester = "semester",
    EnrollmentYear = "enrollmentYear",
    PaymentStatus = "paymentStatus",
    TotalToPay = "totalToPay",
    EndDueDate = "endDueDate",
    Graduated = "graduated",
    CurrentlyStudying = "currentlyStudying"
}

enum ValueOrList {
    Value = "value",
    List = "list"
}

enum DateOrRange {
    SingleDate = "singleDate",
    Range = "range"
}

enum BooleanFilterMode {
    Include = "include",
    Exclude = "exclude",
    Ignore = "ignore"
}

const getComparationSymbol = (comparation: SingularValueComparation) => {
    switch (comparation) {
        case SingularValueComparation.Equals:
            return "=";
        case SingularValueComparation.NotEqualTo:
            return "≠";
        case SingularValueComparation.GreaterThan:
            return ">";
        case SingularValueComparation.LessThan:
            return "<";
        case SingularValueComparation.GreaterThanOrEqualTo:
            return "≥";
        case SingularValueComparation.LessThanOrEqualTo:
            return "≤";
    }
}



const FilterPassesComponent = ({ universityId, filters, setFilters }: FilterPassesComponentProps) => {
    const { data: careers } = useCareers(universityId as string, { page: 0, size: 10 }, true);

    // const usedFilters: Set<FilterKey> = new Set();
    const [openFilterModal, setOpenFilterModal] = useState(false);

    const [selectedFilter, setSelectedFilter] = useState<FilterKey | null>(null);

    const [selectedCareersFilterMode, setSelectedCareersFilterMode] = useState<ListComparation>(ListComparation.Include);

    const [semesterFilterMode, setSemesterFilterMode] = useState<ValueOrList>(ValueOrList.Value);
    const [semesterSingleValueMode, setSemesterSingleValueMode] = useState<SingularValueComparation>(SingularValueComparation.Equals);
    const [semesterInputListValue, setSemesterInputListValue] = useState<number>(0);

    const [enrollmentYearFilterMode, setEnrollmentYearFilterMode] = useState<ValueOrList>(ValueOrList.Value);
    const [enrollmentYearSingleValueMode, setEnrollmentYearSingleValueMode] = useState<SingularValueComparation>(SingularValueComparation.Equals);
    const [enrollmentYearInputListValue, setEnrollmentYearInputListValue] = useState<number>(0);

    const [totalToPayFilterMode, setTotalToPayFilterMode] = useState<SingularValueComparation>(SingularValueComparation.Equals);

    const [endDueDateFilterMode, setEndDueDateFilterMode] = useState<DateOrRange>(DateOrRange.SingleDate);
    const [endDueDateSingleDateMode, setEndDueDateSingleDateMode] = useState<SingularValueComparation>(SingularValueComparation.Equals);
    const [endDueDateStartDate, setEndDueDateStartDate] = useState<Date | null>(null);
    const [endDueDateEndDate, setEndDueDateEndDate] = useState<Date | null>(null);

    const handleCloseFilterModal = () => {
        setOpenFilterModal(false);
        setSelectedFilter(null);
    }

    const handleSelectFilter = (key: Key | null) => {
        if (key) {
            setSelectedFilter(key as FilterKey);
        } else {
            setSelectedFilter(null);
        }
    }

    const handleSelectCareer = (value: SharedSelection) => {
        const selected = value as Set<string>;
        if (selected.size > 0) {
            setFilters({
                ...filters,
                careerId: {
                    values: Array.from(selected),
                    comparation: selectedCareersFilterMode
                }
            });
        } else {
            setFilters({
                ...filters,
                careerId: undefined
            });
        }
    }

    const handleSelectCareersFilterMode = (value: SharedSelection) => {
        const selected = (value as Set<string>).values().next().value as ListComparation;
        setSelectedCareersFilterMode(selected);

        if (filters.careerId) {
            setFilters({
                ...filters,
                careerId: {
                    values: filters.careerId.values,
                    comparation: selected
                }
            });
        }
    }

    const handleSelectSemesterFilterMode = (value: SharedSelection) => {
        setFilters({
            ...filters,
            semester: undefined
        });

        const selected = (value as Set<string>).values().next().value as ValueOrList;
        setSemesterFilterMode(selected);
    }

    const handleSemesterSingleValue = (value: string) => {
        setFilters({
            ...filters,
            semester: {
                singleValue: Number(value),
                comparation: semesterSingleValueMode
            }
        });
    }

    const handleSemesterSingleValueMode = (value: string) => {
        setSemesterSingleValueMode(value as SingularValueComparation);
        if (filters.semester && 'singleValue' in filters.semester) {
            setFilters({
                ...filters,
                semester: {
                    singleValue: filters.semester.singleValue,
                    comparation: value as SingularValueComparation
                }
            });
        }
    }

    const handleAddSemesterToList = (value: number) => {
        if (value < 1) return;

        if (filters.semester && 'list' in filters.semester) {
            setFilters({
                ...filters,
                semester: {
                    list: [...filters.semester.list, value]
                }
            });
        } else {
            setFilters({
                ...filters,
                semester: {
                    list: [value]
                }
            });
        }
    }

    const handleRemoveSemesterFromList = (index: number) => {
        if (filters.semester && 'list' in filters.semester) {
            const newList = filters.semester.list.filter((_, i) => i !== index);
            if (newList.length > 0) {
                setFilters({
                    ...filters,
                    semester: {
                        list: newList
                    }
                });
            } else {
                setFilters({
                    ...filters,
                    semester: undefined
                });
            }
        }
    }

    const handleSelectEnrollmentYearFilterMode = (value: SharedSelection) => {
        setFilters({
            ...filters,
            enrollmentYear: undefined
        });

        const selected = (value as Set<string>).values().next().value as ValueOrList;
        setEnrollmentYearFilterMode(selected);
    }

    const handleEnrollmentYearSingleValue = (value: string) => {
        setFilters({
            ...filters,
            enrollmentYear: {
                singleValue: Number(value),
                comparation: enrollmentYearSingleValueMode
            }
        });
    }

    const handleEnrollmentYearSingleValueMode = (value: string) => {
        setEnrollmentYearSingleValueMode(value as SingularValueComparation);
        if (filters.enrollmentYear && 'singleValue' in filters.enrollmentYear) {
            setFilters({
                ...filters,
                enrollmentYear: {
                    singleValue: filters.enrollmentYear.singleValue,
                    comparation: value as SingularValueComparation
                }
            });
        }
    }

    const handleAddEnrollmentYearToList = (value: number) => {
        if (value < 1900) return;

        if (filters.enrollmentYear && 'list' in filters.enrollmentYear) {
            setFilters({
                ...filters,
                enrollmentYear: {
                    list: [...filters.enrollmentYear.list, value]
                }
            });
        } else {
            setFilters({
                ...filters,
                enrollmentYear: {
                    list: [value]
                }
            });
        }
    }

    const handleRemoveEnrollmentYearFromList = (index: number) => {
        if (filters.enrollmentYear && 'list' in filters.enrollmentYear) {
            const newList = filters.enrollmentYear.list.filter((_, i) => i !== index);
            if (newList.length > 0) {
                setFilters({
                    ...filters,
                    enrollmentYear: {
                        list: newList
                    }
                });
            } else {
                setFilters({
                    ...filters,
                    enrollmentYear: undefined
                });
            }
        }
    }

    const handleAddPaymentStatus = (value: PaymentStatus) => {
        if (value === undefined || value === null) return;
        if (filters.paymentStatus && !filters.paymentStatus.includes(value)) {
            setFilters({
                ...filters,
                paymentStatus: [...filters.paymentStatus, value]
            });
        } else if (filters.paymentStatus === undefined) {
            setFilters({
                ...filters,
                paymentStatus: [value]
            });
        }
    }

    const handleRemovePaymentStatus = (index: number) => {
        if (filters.paymentStatus) {
            const newList = filters.paymentStatus.filter((_, i) => i !== index);
            setFilters({
                ...filters,
                paymentStatus: newList.length > 0 ? newList : undefined
            });
        }
    }

    const handleSelectTotalToPayFilterMode = (value: string) => {
        const selected = value as SingularValueComparation;
        setTotalToPayFilterMode(selected);

        if (filters.totalToPay) {
            setFilters({
                ...filters,
                totalToPay: {
                    singleValue: filters.totalToPay.singleValue,
                    comparation: selected
                }
            });
        }
    }

    const handleTotalToPaySingleValue = (value: string) => {
        setFilters({
            ...filters,
            totalToPay: {
                singleValue: Number(value),
                comparation: totalToPayFilterMode
            }
        });
    }

    const handleSelectEndDueDateFilterMode = (value: SharedSelection) => {
        setFilters({
            ...filters,
            endDueDate: undefined
        });

        const selected = (value as Set<string>).values().next().value as DateOrRange;
        setEndDueDateFilterMode(selected);
    }

    const handleEndDueDateSingleDateMode = (value: string) => {
        setEndDueDateSingleDateMode(value as SingularValueComparation);
        if (filters.endDueDate && 'singleDate' in filters.endDueDate) {
            setFilters({
                ...filters,
                endDueDate: {
                    singleDate: filters.endDueDate.singleDate,
                    comparation: value as SingularValueComparation
                }
            });
        }
    }
    const handleSingleDateValue = (value: Date | null) => {
        if (value === null) {
            setFilters({
                ...filters,
                endDueDate: undefined
            });
        } else {
            setFilters({
                ...filters,
                endDueDate: { singleDate: value, comparation: endDueDateSingleDateMode }
            });
        }
    }
    const handleRangeValue = (start: Date | null, end: Date | null) => {
        if (start === null || end === null) {
            setFilters({
                ...filters,
                endDueDate: undefined
            });
        } else {
            setFilters({
                ...filters,
                endDueDate: { startDate: start, endDate: end }
            });
        }
    }
    const handleGraduatedFilterMode = (value: BooleanFilterMode) => {
        switch (value) {
            case BooleanFilterMode.Include:
                setFilters({
                    ...filters,
                    graduated: true
                });
                break;
            case BooleanFilterMode.Exclude:
                setFilters({
                    ...filters,
                    graduated: false
                });
                break;
            case BooleanFilterMode.Ignore:
            default:
                setFilters({
                    ...filters,
                    graduated: undefined
                });
                break;
        }
    }
    const handleCurrentlyStudyingFilterMode = (value: BooleanFilterMode) => {
        switch (value) {
            case BooleanFilterMode.Include:
                setFilters({
                    ...filters,
                    currentlyStudying: true
                });
                break;
            case BooleanFilterMode.Exclude:
                setFilters({
                    ...filters,
                    currentlyStudying: false
                });
                break;
            case BooleanFilterMode.Ignore:
            default:
                setFilters({
                    ...filters,
                    currentlyStudying: undefined
                });
                break;
        }
    }

    const careerForm = () => {
        if (careers && careers.content.length > 0) {
            return (
                <div className="flex flex-row gap-2">
                    <Select disallowEmptySelection label="Modo de Filtrado" onSelectionChange={handleSelectCareersFilterMode} defaultSelectedKeys={[selectedCareersFilterMode]}>
                        <SelectItem key={ListComparation.Include}>Incluir</SelectItem>
                        <SelectItem key={ListComparation.Exclude}>Excluir</SelectItem>
                    </Select>
                    <Select label="Carrera" selectionMode="multiple" onSelectionChange={handleSelectCareer} selectedKeys={filters.careerId?.values}>
                        {careers.content.map((career) => (
                            <SelectItem key={career.code}>{career.name}</SelectItem>
                        ))}
                    </Select>
                </div >
            )
        }
        return <Spinner />;
    }

    const semesterForm = () => {
        return (
            <div className="w-full">
                <div className="flex flex-row gap-2 mb-4">
                    <Select disallowEmptySelection label="Modo de Filtrado" onSelectionChange={handleSelectSemesterFilterMode} defaultSelectedKeys={[semesterFilterMode]}>
                        <SelectItem key={ValueOrList.Value}>Comparar con un solo valor</SelectItem>
                        <SelectItem key={ValueOrList.List}>Comparar con una lista</SelectItem>
                    </Select>
                    {semesterFilterMode === ValueOrList.Value &&
                        <Input
                            endContent={
                                <div className="flex items-center">
                                    <label className="sr-only" htmlFor="currency">
                                        Comparación
                                    </label>
                                    <select
                                        className="outline-solid outline-transparent border-0 bg-transparent text-default-400 text-small"
                                        id="semesterSingleValueMode"
                                        name="semesterSingleValueMode"
                                        onChange={(e) => handleSemesterSingleValueMode(e.target.value)}
                                        defaultValue={semesterSingleValueMode}
                                    >
                                        <option key={SingularValueComparation.Equals} value={SingularValueComparation.Equals}>{getComparationSymbol(SingularValueComparation.Equals)}</option>
                                        <option key={SingularValueComparation.NotEqualTo} value={SingularValueComparation.NotEqualTo}>{getComparationSymbol(SingularValueComparation.NotEqualTo)}</option>
                                        <option key={SingularValueComparation.GreaterThan} value={SingularValueComparation.GreaterThan}>{getComparationSymbol(SingularValueComparation.GreaterThan)}</option>
                                        <option key={SingularValueComparation.LessThan} value={SingularValueComparation.LessThan}>{getComparationSymbol(SingularValueComparation.LessThan)}</option>
                                        <option key={SingularValueComparation.GreaterThanOrEqualTo} value={SingularValueComparation.GreaterThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.GreaterThanOrEqualTo)}</option>
                                        <option key={SingularValueComparation.LessThanOrEqualTo} value={SingularValueComparation.LessThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.LessThanOrEqualTo)}</option>
                                    </select>
                                </div>
                            }
                            label="Semestre"
                            placeholder="1"
                            step={1}
                            min={1}
                            type="number"
                            onChange={(e) => handleSemesterSingleValue(e.target.value)}
                        />
                    }
                    {semesterFilterMode === ValueOrList.List &&
                        <div className="flex flex-row gap-2">
                            <Input
                                label="Agregar Semestre"
                                placeholder="1"
                                step={1}
                                min={1}
                                type="number"
                                onChange={(e) => setSemesterInputListValue(Number(e.target.value))}
                                endContent={
                                    <Button isIconOnly onPress={() => handleAddSemesterToList(semesterInputListValue)}><PlusIcon className="w-5 h-5" /></Button>
                                }
                            />
                        </div>
                    }
                </div>
                {filters.semester && 'list' in filters.semester && filters.semester.list.length > 0 &&
                    <div className="flex flex-row gap-2 flex-wrap">
                        {filters.semester.list.map((semester, index) => (
                            <Chip key={index} size="lg" color="primary" variant="flat" onClose={() => handleRemoveSemesterFromList(index)}>{semester}</Chip>
                        ))}
                    </div>
                }
            </div>
        )
    }

    const enrollmentYearForm = () => {
        return (
            <div className="w-full">
                <div className="flex flex-row gap-2 mb-4">
                    <Select disallowEmptySelection label="Modo de Filtrado" onSelectionChange={handleSelectEnrollmentYearFilterMode} defaultSelectedKeys={[enrollmentYearFilterMode]}>
                        <SelectItem key={ValueOrList.Value}>Comparar con un solo valor</SelectItem>
                        <SelectItem key={ValueOrList.List}>Comparar con una lista</SelectItem>
                    </Select>
                    {enrollmentYearFilterMode === ValueOrList.Value &&
                        <Input
                            endContent={
                                <div className="flex items-center">
                                    <label className="sr-only" htmlFor="currency">
                                        Comparación
                                    </label>
                                    <select
                                        className="outline-solid outline-transparent border-0 bg-transparent text-default-400 text-small"
                                        id="enrollmentYearSingleValueMode"
                                        name="enrollmentYearSingleValueMode"
                                        onChange={(e) => handleEnrollmentYearSingleValueMode(e.target.value)}
                                        defaultValue={enrollmentYearSingleValueMode}
                                    >
                                        <option key={SingularValueComparation.Equals} value={SingularValueComparation.Equals}>{getComparationSymbol(SingularValueComparation.Equals)}</option>
                                        <option key={SingularValueComparation.NotEqualTo} value={SingularValueComparation.NotEqualTo}>{getComparationSymbol(SingularValueComparation.NotEqualTo)}</option>
                                        <option key={SingularValueComparation.GreaterThan} value={SingularValueComparation.GreaterThan}>{getComparationSymbol(SingularValueComparation.GreaterThan)}</option>
                                        <option key={SingularValueComparation.LessThan} value={SingularValueComparation.LessThan}>{getComparationSymbol(SingularValueComparation.LessThan)}</option>
                                        <option key={SingularValueComparation.GreaterThanOrEqualTo} value={SingularValueComparation.GreaterThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.GreaterThanOrEqualTo)}</option>
                                        <option key={SingularValueComparation.LessThanOrEqualTo} value={SingularValueComparation.LessThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.LessThanOrEqualTo)}</option>
                                    </select>
                                </div>
                            }
                            label="Año Matrícula"
                            placeholder="2025"
                            step={1}
                            min={1900}
                            type="number"
                            onChange={(e) => handleEnrollmentYearSingleValue(e.target.value)}
                        />
                    }
                    {enrollmentYearFilterMode === ValueOrList.List &&
                        <div className="flex flex-row gap-2">
                            <Input
                                label="Agregar Año Matrícula"
                                placeholder="2025"
                                step={1}
                                min={1900}
                                type="number"
                                onChange={(e) => setEnrollmentYearInputListValue(Number(e.target.value))}
                                endContent={
                                    <Button isIconOnly onPress={() => handleAddEnrollmentYearToList(enrollmentYearInputListValue)}><PlusIcon className="w-5 h-5" /></Button>
                                }
                            />
                        </div>
                    }
                </div>
                {filters.enrollmentYear && 'list' in filters.enrollmentYear && filters.enrollmentYear.list.length > 0 &&
                    <div className="flex flex-row gap-2 flex-wrap">
                        {filters.enrollmentYear.list.map((enrollmentYear, index) => (
                            <Chip key={index} size="lg" color="primary" variant="flat" onClose={() => handleRemoveEnrollmentYearFromList(index)}>{enrollmentYear}</Chip>
                        ))}
                    </div>
                }
            </div>
        )
    }

    const paymentStatusForm = () => {
        return (
            <div className="w-full">
                <Select disallowEmptySelection className="mb-4" label="Estado de Pago" onSelectionChange={(value) => handleAddPaymentStatus((value as Set<string>).values().next().value as PaymentStatus)}>
                    <SelectItem key={PaymentStatus.Paid}>{paymentStatusToLabel(PaymentStatus.Paid)}</SelectItem>
                    <SelectItem key={PaymentStatus.Due}>{paymentStatusToLabel(PaymentStatus.Due)}</SelectItem>
                    <SelectItem key={PaymentStatus.Overdue}>{paymentStatusToLabel(PaymentStatus.Overdue)}</SelectItem>
                </Select>
                {filters.paymentStatus && filters.paymentStatus.length > 0 &&
                    <div className="flex flex-row gap-2 flex-wrap">
                        {filters.paymentStatus.map((paymentStatus, index) => (
                            <Chip key={index} size="lg" color="primary" variant="flat" onClose={() => handleRemovePaymentStatus(index)}>{paymentStatusToLabel(paymentStatus)}</Chip>
                        ))}
                    </div>
                }
            </div>
        )
    }

    const totalToPayForm = () => {
        return (
            <Input
                endContent={
                    <div className="flex items-center">
                        <label className="sr-only" htmlFor="currency">
                            Comparación
                        </label>
                        <select
                            className="outline-solid outline-transparent border-0 bg-transparent text-default-400 text-small"
                            id="totalToPaySingleValueMode"
                            name="totalToPaySingleValueMode"
                            onChange={(e) => handleSelectTotalToPayFilterMode(e.target.value)}
                            defaultValue={totalToPayFilterMode}
                        >
                            <option key={SingularValueComparation.Equals} value={SingularValueComparation.Equals}>{getComparationSymbol(SingularValueComparation.Equals)}</option>
                            <option key={SingularValueComparation.NotEqualTo} value={SingularValueComparation.NotEqualTo}>{getComparationSymbol(SingularValueComparation.NotEqualTo)}</option>
                            <option key={SingularValueComparation.GreaterThan} value={SingularValueComparation.GreaterThan}>{getComparationSymbol(SingularValueComparation.GreaterThan)}</option>
                            <option key={SingularValueComparation.LessThan} value={SingularValueComparation.LessThan}>{getComparationSymbol(SingularValueComparation.LessThan)}</option>
                            <option key={SingularValueComparation.GreaterThanOrEqualTo} value={SingularValueComparation.GreaterThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.GreaterThanOrEqualTo)}</option>
                            <option key={SingularValueComparation.LessThanOrEqualTo} value={SingularValueComparation.LessThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.LessThanOrEqualTo)}</option>
                        </select>
                    </div>
                }
                label="Total a Pagar"
                placeholder="1000000"
                step={0.01}
                min={0}
                type="number"
                onChange={(e) => handleTotalToPaySingleValue(e.target.value)}
            />
        )
    }

    const endDueDateForm = () => {
        return (
            <div className="w-full">
                <div className="flex flex-row gap-2 mb-4">
                    <Select disallowEmptySelection label="Modo de Filtrado" onSelectionChange={handleSelectEndDueDateFilterMode} defaultSelectedKeys={[endDueDateFilterMode]}>
                        <SelectItem key={DateOrRange.SingleDate}>Comparar con una fecha</SelectItem>
                        <SelectItem key={DateOrRange.Range}>Comparar con un rango de fechas</SelectItem>
                    </Select>
                    {endDueDateFilterMode === DateOrRange.SingleDate &&
                        <I18nProvider locale="es-CO">
                            <DatePicker
                                showMonthAndYearPickers
                                label="Fecha de Vencimiento"
                                onChange={(e) => handleSingleDateValue(e?.toDate(getLocalTimeZone()) ?? null)}

                                startContent={
                                    <div className="flex items-center">
                                        <label className="sr-only" htmlFor="currency">
                                            Comparación
                                        </label>
                                        <select
                                            className="outline-solid outline-transparent border-0 bg-transparent text-default-400 text-small"
                                            id="semesterSingleValueMode"
                                            name="semesterSingleValueMode"
                                            onChange={(e) => handleEndDueDateSingleDateMode(e.target.value)}
                                            defaultValue={semesterSingleValueMode}
                                        >
                                            <option key={SingularValueComparation.Equals} value={SingularValueComparation.Equals}>{getComparationSymbol(SingularValueComparation.Equals)}</option>
                                            <option key={SingularValueComparation.NotEqualTo} value={SingularValueComparation.NotEqualTo}>{getComparationSymbol(SingularValueComparation.NotEqualTo)}</option>
                                            <option key={SingularValueComparation.GreaterThan} value={SingularValueComparation.GreaterThan}>{getComparationSymbol(SingularValueComparation.GreaterThan)}</option>
                                            <option key={SingularValueComparation.LessThan} value={SingularValueComparation.LessThan}>{getComparationSymbol(SingularValueComparation.LessThan)}</option>
                                            <option key={SingularValueComparation.GreaterThanOrEqualTo} value={SingularValueComparation.GreaterThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.GreaterThanOrEqualTo)}</option>
                                            <option key={SingularValueComparation.LessThanOrEqualTo} value={SingularValueComparation.LessThanOrEqualTo}>{getComparationSymbol(SingularValueComparation.LessThanOrEqualTo)}</option>
                                        </select>
                                    </div>
                                }
                            />
                        </I18nProvider>
                    }
                    {endDueDateFilterMode === DateOrRange.Range &&
                        <I18nProvider locale="es-CO">
                            <DateRangePicker
                                showMonthAndYearPickers
                                label="Agregar Fecha de Vencimiento"
                                onChange={(e) => handleRangeValue(e?.start?.toDate(getLocalTimeZone()) ?? null, e?.end?.toDate(getLocalTimeZone()) ?? null)}
                            />
                        </I18nProvider>
                    }
                </div>
                {filters.semester && 'list' in filters.semester && filters.semester.list.length > 0 &&
                    <div className="flex flex-row gap-2 flex-wrap">
                        {filters.semester.list.map((semester, index) => (
                            <Chip key={index} size="lg" color="primary" variant="flat" onClose={() => handleRemoveSemesterFromList(index)}>{semester}</Chip>
                        ))}
                    </div>
                }
            </div>
        )
    }

    const graduatedForm = () => {
        return (
            <Select label="Modo de Filtrado" onSelectionChange={(value) => handleGraduatedFilterMode((value as Set<string>).values().next().value as BooleanFilterMode)}>
                <SelectItem key={BooleanFilterMode.Include}>Incluir</SelectItem>
                <SelectItem key={BooleanFilterMode.Exclude}>Excluir</SelectItem>
                <SelectItem key={BooleanFilterMode.Ignore}>Ignorar</SelectItem>
            </Select>
        )
    }

    const currentlyStudyingForm = () => {
        return (
            <Select label="Modo de Filtrado" onSelectionChange={(value) => handleCurrentlyStudyingFilterMode((value as Set<string>).values().next().value as BooleanFilterMode)}>
                <SelectItem key={BooleanFilterMode.Include}>Incluir</SelectItem>
                <SelectItem key={BooleanFilterMode.Exclude}>Excluir</SelectItem>
                <SelectItem key={BooleanFilterMode.Ignore}>Ignorar</SelectItem>
            </Select>
        )
    }

    const hasFilters = () => {
        return filters.careerId !== undefined || filters.currentlyStudying !== undefined || filters.graduated !== undefined || filters.semester !== undefined || filters.enrollmentYear !== undefined || filters.paymentStatus !== undefined || filters.totalToPay !== undefined || filters.endDueDate !== undefined || filters.paymentStatus !== undefined;
    }

    return (
        <div className="flex flex-row gap-2">
            <Button
                color="primary"
                variant="solid"
                startContent={<PlusIcon className="w-5 h-5" />}
                onPress={() => setOpenFilterModal(true)}
            >
                Agregar Filtro
            </Button>
            <div className="flex flex-row gap-2 flex-wrap flex-1 border-l border-gray-200 pl-2 items-center">
                {filters.careerId && <Chip size="lg" color={filters.careerId.comparation === ListComparation.Include ? 'success' : 'danger'} variant="flat" onClose={() => { setFilters({ ...filters, careerId: undefined }); }}>Carrera: {filters.careerId.values.join(', ')}</Chip>}
                {filters.semester && <Chip size="lg" color={'singleValue' in filters.semester ? 'primary' : 'warning'} variant="flat" onClose={() => { setFilters({ ...filters, semester: undefined }); }}>Semestre {'singleValue' in filters.semester ? getComparationSymbol(filters.semester.comparation) + ' ' + filters.semester.singleValue : filters.semester.list.join(', ')}</Chip>}
                {filters.enrollmentYear && <Chip size="lg" color={'singleValue' in filters.enrollmentYear ? 'primary' : 'warning'} variant="flat" onClose={() => { setFilters({ ...filters, enrollmentYear: undefined }); }}>Año Matrícula {'singleValue' in filters.enrollmentYear ? getComparationSymbol(filters.enrollmentYear.comparation) + ' ' + filters.enrollmentYear.singleValue : filters.enrollmentYear.list.join(', ')}</Chip>}
                {filters.paymentStatus && <Chip size="lg" color={filters.paymentStatus.includes(PaymentStatus.Paid) ? 'success' : filters.paymentStatus.includes(PaymentStatus.Due) ? 'warning' : 'danger'} variant="flat" onClose={() => { setFilters({ ...filters, paymentStatus: undefined }); }}>Estado Pago: {filters.paymentStatus.map(paymentStatus => paymentStatusToLabel(paymentStatus)).join(', ')}</Chip>}
                {filters.totalToPay && <Chip size="lg" color='primary' variant="flat" onClose={() => { setFilters({ ...filters, totalToPay: undefined }); }}>Total a Pagar: {filters.totalToPay.singleValue}</Chip>}
                {filters.endDueDate && <Chip size="lg" color='primary' variant="flat" onClose={() => { setFilters({ ...filters, endDueDate: undefined }); }}>Fecha de Vencimiento: {'singleDate' in filters.endDueDate ? filters.endDueDate.singleDate.toLocaleDateString() : filters.endDueDate.startDate?.toLocaleDateString() + ' - ' + filters.endDueDate.endDate?.toLocaleDateString()}</Chip>}
                {filters.graduated && <Chip size="lg" color='primary' variant="flat" onClose={() => { setFilters({ ...filters, graduated: undefined }); }}>Graduado: {filters.graduated ? 'Si' : 'No'}</Chip>}
                {filters.currentlyStudying && <Chip size="lg" color='primary' variant="flat" onClose={() => { setFilters({ ...filters, currentlyStudying: undefined }); }}>Estudiando: {filters.currentlyStudying ? 'Si' : 'No'}</Chip>}
            </div>
            {/* {hasFilters() && <Divider orientation="vertical" />} */}


            <Modal
                isOpen={openFilterModal}
                onClose={handleCloseFilterModal}
                title="Filtros"
                size="xl"
                backdrop="opaque"
            >
                <div className="flex flex-col gap-4">
                    <Autocomplete
                        label="Filtro"
                        placeholder="Selecciona un filtro"
                        onSelectionChange={(key) => handleSelectFilter(key)}
                        selectedKey={selectedFilter}
                    // disabledKeys={getDisabledKeys()}
                    >
                        <AutocompleteItem key={FilterKey.CareerId}>Carrera</AutocompleteItem>
                        <AutocompleteItem key={FilterKey.Semester}>Semestre</AutocompleteItem>
                        <AutocompleteItem key={FilterKey.EnrollmentYear}>Año Matrícula</AutocompleteItem>
                        <AutocompleteItem key={FilterKey.PaymentStatus}>Estado Pago</AutocompleteItem>
                        <AutocompleteItem key={FilterKey.TotalToPay}>Total a Pagar</AutocompleteItem>
                        <AutocompleteItem key={FilterKey.EndDueDate}>Fecha de Vencimiento</AutocompleteItem>
                        <AutocompleteItem key={FilterKey.Graduated}>Graduado</AutocompleteItem>
                        <AutocompleteItem key={FilterKey.CurrentlyStudying}>Estudiando</AutocompleteItem>
                    </Autocomplete>
                    {selectedFilter === FilterKey.CareerId && careerForm()}
                    {selectedFilter === FilterKey.Semester && semesterForm()}
                    {selectedFilter === FilterKey.EnrollmentYear && enrollmentYearForm()}
                    {selectedFilter === FilterKey.PaymentStatus && paymentStatusForm()}
                    {selectedFilter === FilterKey.TotalToPay && totalToPayForm()}
                    {selectedFilter === FilterKey.EndDueDate && endDueDateForm()}
                    {selectedFilter === FilterKey.Graduated && graduatedForm()}
                    {selectedFilter === FilterKey.CurrentlyStudying && currentlyStudyingForm()}
                </div>
            </Modal>
        </div>
    )
}

export default FilterPassesComponent;