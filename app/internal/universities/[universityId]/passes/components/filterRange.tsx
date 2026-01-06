"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { RangeFilterForm, rangeFilterFormSchema } from "@/domain/FilteredPagination";
import { useForm } from "@tanstack/react-form";
import { BrushCleaning, PlusCircle, Trash, X } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod/v4";

interface FilterRangeProps {
    label: string;
    minLabel: string;
    minPlaceholder: string;
    maxLabel: string;
    maxPlaceholder: string;
    value: {
        min: number;
        max: number;
    } | null;
    setValue: (value: { min: number; max: number } | null) => void;
    numericFormat?: {
        thousandSeparator: boolean;
        moneySymbol: boolean;
    }
}

const FilterRange: React.FC<FilterRangeProps> = ({ label, minLabel, minPlaceholder, maxLabel, maxPlaceholder, value, setValue, numericFormat }) => {
    const [open, setOpen] = useState(false);

    // Format number with thousand separators if enabled
    const formatNumber = (num: number | null): string => {
        if (num === null) return "";
        if (numericFormat?.thousandSeparator) {
            return new Intl.NumberFormat('es-CO', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(num);
        }
        return num.toString();
    };

    // Filter to only allow numeric characters
    const filterNumeric = (value: string): string => {
        // Only keep digits
        return value.replace(/\D/g, "");
    };

    // Parse currency string back to number
    const parseMoney = (value: string): number | null => {
        if (!value || value.trim() === "") return null;
        // Remove currency symbols, spaces, and commas
        const cleaned = value.replace(/[$\s,.]/g, "");
        const parsed = Number(cleaned);
        return isNaN(parsed) ? null : parsed;
    };

    const defaultValues: RangeFilterForm = {
        min: value?.min ?? null,
        max: value?.max ?? null,
    };

    const form = useForm({
        defaultValues: defaultValues,
        validators: {
            onSubmit: rangeFilterFormSchema,
            onBlur: rangeFilterFormSchema,
            onChange: rangeFilterFormSchema,
        },
        onSubmit: async ({ value }) => {
            if (value.min === null && value.max === null) {
                setValue(null);
            }
            if (value.min !== null && value.max !== null) {
                setValue({
                    min: value.min,
                    max: value.max,
                });
            }
        },
    });

    const handleClean = () => {
        setValue(null);
        form.reset();
    }

    const displayBadge = () => {
        const min = formatNumber(value?.min ?? null);
        const max = formatNumber(value?.max ?? null);
        const showSymbol = numericFormat?.moneySymbol === true;
        return <Badge variant="secondary">{showSymbol ? `$ ${min} - $ ${max}` : `${min} - ${max}`}</Badge>;
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    role="combobox"
                    aria-expanded={open}
                    className={value ? "" : "border-dashed"}
                >
                    <PlusCircle />
                    {label}
                    {value && <Separator orientation="vertical" />}
                    {value && displayBadge()}
                    {value && (
                        <Button variant="outline" size="sm" className="rounded-full h-5 w-5 p-0" onClick={(e) => {
                            e.stopPropagation();
                            handleClean();
                        }}>
                            <X className="size-3.5 text-red-500" />
                        </Button>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] px-3 py-2" align="start">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}>
                    <div className="grid grid-cols-2 gap-2">
                        <form.Field name="min">
                            {(field) => {
                                const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                                
                                // Format display value in real-time
                                const displayValue = field.state.value !== null
                                    ? formatNumber(field.state.value)
                                    : "";
                                const hasFormatting = numericFormat?.thousandSeparator || numericFormat?.moneySymbol;
                                const showSymbol = numericFormat?.moneySymbol === true;
                                
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>{minLabel}</FieldLabel>
                                        {hasFormatting ? (
                                            <div className="relative">
                                                {showSymbol && (
                                                    <span className="absolute left-3 top-0 flex items-center h-9 text-muted-foreground pointer-events-none text-sm leading-none">
                                                        $
                                                    </span>
                                                )}
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="text"
                                                    value={displayValue}
                                                    onChange={(e) => {
                                                        // Filter to only allow numeric characters
                                                        const filtered = filterNumeric(e.target.value);
                                                        // Parse the filtered input and format immediately
                                                        const parsed = filtered ? parseMoney(filtered) : null;
                                                        field.handleChange(parsed);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Block non-numeric keys (allow backspace, delete, tab, arrow keys, etc.)
                                                        const allowedKeys = [
                                                            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                                                            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                                                            'Home', 'End'
                                                        ];
                                                        const isAllowedKey = allowedKeys.includes(e.key) || 
                                                            (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()));
                                                        
                                                        if (!isAllowedKey && !/[0-9]/.test(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onBlur={field.handleBlur}
                                                    aria-invalid={isInvalid}
                                                    placeholder={minPlaceholder}
                                                    className={showSymbol ? "pl-7" : ""}
                                                />
                                            </div>
                                        ) : (
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="number"
                                                value={displayValue}
                                                onChange={(e) => {
                                                    // For number input, filter non-numeric characters
                                                    const filtered = filterNumeric(e.target.value);
                                                    field.handleChange(filtered ? Number(filtered) : null);
                                                }}
                                                onBlur={field.handleBlur}
                                                aria-invalid={isInvalid}
                                                placeholder={minPlaceholder}
                                            />
                                        )}
                                    </Field>
                                )

                            }}
                        </form.Field>
                        <form.Field name="max">
                            {(field) => {
                                const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                                
                                // Format display value in real-time
                                const displayValue = field.state.value !== null
                                    ? formatNumber(field.state.value)
                                    : "";
                                const hasFormatting = numericFormat?.thousandSeparator || numericFormat?.moneySymbol;
                                const showSymbol = numericFormat?.moneySymbol === true;
                                
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>{maxLabel}</FieldLabel>
                                        {hasFormatting ? (
                                            <div className="relative">
                                                {showSymbol && (
                                                    <span className="absolute left-3 top-0 flex items-center h-9 text-muted-foreground pointer-events-none text-sm leading-none">
                                                        $
                                                    </span>
                                                )}
                                                <Input
                                                    id={field.name}
                                                    name={field.name}
                                                    type="text"
                                                    value={displayValue}
                                                    onChange={(e) => {
                                                        // Filter to only allow numeric characters
                                                        const filtered = filterNumeric(e.target.value);
                                                        // Parse the filtered input and format immediately
                                                        const parsed = filtered ? parseMoney(filtered) : null;
                                                        field.handleChange(parsed);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        // Block non-numeric keys (allow backspace, delete, tab, arrow keys, etc.)
                                                        const allowedKeys = [
                                                            'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
                                                            'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                                                            'Home', 'End'
                                                        ];
                                                        const isAllowedKey = allowedKeys.includes(e.key) || 
                                                            (e.ctrlKey && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase()));
                                                        
                                                        if (!isAllowedKey && !/[0-9]/.test(e.key)) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    onBlur={field.handleBlur}
                                                    aria-invalid={isInvalid}
                                                    placeholder={maxPlaceholder}
                                                    className={showSymbol ? "pl-7" : ""}
                                                />
                                            </div>
                                        ) : (
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="number"
                                                value={displayValue}
                                                onChange={(e) => {
                                                    // For number input, filter non-numeric characters
                                                    const filtered = filterNumeric(e.target.value);
                                                    field.handleChange(filtered ? Number(filtered) : null);
                                                }}
                                                onBlur={field.handleBlur}
                                                aria-invalid={isInvalid}
                                                placeholder={maxPlaceholder}
                                            />
                                        )}
                                    </Field>
                                )
                            }}
                        </form.Field>
                        <div className="col-span-2 flex gap-2 mt-2">
                            <Button className="flex-1" type="submit" variant="outline" onClick={() => form.handleSubmit()}>Aplicar</Button>
                            <Button disabled={value === null} size="icon" type="button" variant="destructive" onClick={handleClean}><BrushCleaning className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </form>
            </PopoverContent>
        </Popover>
    )
}

export default FilterRange;