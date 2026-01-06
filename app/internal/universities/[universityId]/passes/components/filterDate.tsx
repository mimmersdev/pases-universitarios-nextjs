import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { DateFilterRange, DateFilterSingleDate, FilterDateComparation, FilterDateType } from "@/domain/FilteredPagination";
import { BrushCleaningIcon, Calendar as CalendarIcon, CalendarRange as CalendarRangeIcon, X } from "lucide-react";
import { useState } from "react";
import { es } from "react-day-picker/locale"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterDateProps {
    label: string;
    value: DateFilterSingleDate | DateFilterRange | null;
    setValue: (value: DateFilterSingleDate | DateFilterRange | null) => void;
}

const FilterDate: React.FC<FilterDateProps> = ({ label, value, setValue }) => {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState(FilterDateType.SingleDate);
    const [comparation, setComparation] = useState(FilterDateComparation.After);

    const displayBadge = () => {
        if (value) {
            if (type === FilterDateType.SingleDate) {
                const date = value as DateFilterSingleDate;
                const prefix = date.comparation === FilterDateComparation.Before ? "Antes de" : "Después de";
                return <Badge variant="secondary">{prefix} {date.value.toLocaleDateString('es-ES')}</Badge>;
            } else {
                const dateRange = value as DateFilterRange;
                return <Badge variant="secondary">{dateRange.startDate.toLocaleDateString('es-ES')} - {dateRange.endDate.toLocaleDateString('es-ES')}</Badge>;
            }
        }
    }

    const handleTypeChange = () => {
        setType(type === FilterDateType.SingleDate ? FilterDateType.Range : FilterDateType.SingleDate);
        setValue(null);
    }

    const displayContent = () => {
        // Formatters to localize dropdown options using the Spanish locale
        const formatters = {
            formatMonthDropdown: (date: Date) => {
                // Format month name in Spanish
                return date.toLocaleString("es", { month: "short" });
            },
            formatYearDropdown: (date: Date) => {
                // Format year in Spanish locale
                return date.toLocaleString("es", { year: "numeric" });
            },
        };

        if (type === FilterDateType.SingleDate) {
            const date = value as DateFilterSingleDate | null;
            return (<>
                <Calendar
                    locale={es}
                    mode="single"
                    selected={date?.value ?? undefined}
                    onSelect={(d) => {
                        if (d) {
                            console.log(d.toISOString());
                            setValue({
                                value: d,
                                comparation: comparation
                            });
                        } else {
                            setValue(null);
                        }
                    }}
                    className="mx-auto"
                    captionLayout="dropdown"
                    formatters={formatters}
                />
                <div className="flex flex-row gap-2 justify-center items-center">
                    <Select value={comparation} onValueChange={(c) => {
                        setComparation(c as FilterDateComparation);
                        if (value) {
                            const date = value as unknown as DateFilterSingleDate;
                            setValue({
                                value: date.value,
                                comparation: c as FilterDateComparation
                            });
                        }
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Comparación" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Comparación</SelectLabel>
                                <SelectItem value={FilterDateComparation.Before}>Antes de</SelectItem>
                                <SelectItem value={FilterDateComparation.After}>Después de</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Button variant="destructive" size="icon-sm" onClick={() => setValue(null)}>
                        <BrushCleaningIcon />
                    </Button>
                </div>

            </>)
        } else {
            const dateRange = value as DateFilterRange | null;
            return (<>
                <Calendar
                    locale={es}
                    mode="range"
                    selected={dateRange ? {
                        from: dateRange.startDate,
                        to: dateRange.endDate
                    } : undefined}
                    onSelect={(d) => {
                        if (d && d.from && d.to) {
                            setValue({
                                startDate: d.from,
                                endDate: d.to
                            });
                        } else {
                            setValue(null);
                        }
                    }}
                    className="mx-auto"
                    captionLayout="dropdown"
                    formatters={formatters}
                />
                {value && (
                    <div className="flex flex-row gap-2 justify-center items-center">
                        <Button variant="destructive" size="sm" onClick={() => setValue(null)}>
                            Limpiar filtro
                            <BrushCleaningIcon />
                        </Button>
                    </div>
                )}
            </>)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <ButtonGroup>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTypeChange}
                            className={value !== null ? "" : "border-dashed"}
                        >
                            {type === FilterDateType.SingleDate ? <CalendarIcon /> : <CalendarRangeIcon />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {type === FilterDateType.SingleDate ? "Comparar con una fecha" : "Comparar con un rango de fechas"}
                    </TooltipContent>
                </Tooltip>

                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        role="combobox"
                        aria-expanded={open}
                        className={value ? "" : "border-dashed"}
                    >
                        {label}
                        {value && <Separator orientation="vertical" />}
                        {value && displayBadge()}
                        {value && (
                            <Button variant="outline" size="sm" className="rounded-full h-5 w-5 p-0" onClick={(e) => {
                                e.stopPropagation();
                                setValue(null);
                            }}>
                                <X className="size-3.5 text-red-500" />
                            </Button>
                        )}
                    </Button>
                </PopoverTrigger>
            </ButtonGroup>
            <PopoverContent className="w-[300px] px-3 py-2" align="start">
                {displayContent()}
            </PopoverContent>

        </Popover>
    )
}

export default FilterDate;