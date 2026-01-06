"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Command, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { FilterIncludeExcludeType } from "@/domain/FilteredPagination";
import { cn } from "@/lib/utils";
import { BrushCleaningIcon, Check, CircleMinus, CirclePlus, X } from "lucide-react";
import React, { useRef, useState } from "react";

export interface Option {
    value: string;
    label: string;
}

interface FilterIncludeExcludeProps {
    selectedValues: Option[];
    setSelectedValues: (selectedValues: Option[]) => void;
    displayValue?: boolean;
    label: string;
    searchPlaceholder: string;
    badgesLabel: string;
    type: FilterIncludeExcludeType;
    setType: (type: FilterIncludeExcludeType) => void;
    searchTerm: string;
    setSearchTerm: (searchTerm: string) => void;
    options: Option[];
    loading: boolean;
    infiniteScroll?: {
        onLoadMore: () => void;
        canLoadMore: boolean;
    }

}

const FilterIncludeExclude: React.FC<FilterIncludeExcludeProps> = ({ selectedValues, setSelectedValues, displayValue = false, label, searchPlaceholder, badgesLabel, type, setType, options, searchTerm, setSearchTerm, loading, infiniteScroll }) => {
    const [open, setOpen] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [viewport, setViewport] = useState<HTMLElement | null>(null);

    // Get viewport when popover opens
    React.useEffect(() => {
        if (open && scrollAreaRef.current) {
            const viewportElement = scrollAreaRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
            setViewport(viewportElement || null);
        }
    }, [open]);

    const displayBadges = () => {
        if (selectedValues.length >= 3) {
            return (
                <Badge variant="secondary">{selectedValues.length} {badgesLabel}</Badge>
            )
        }
        const badges: React.ReactNode[] = selectedValues.map(option => (
            <Badge variant="secondary" key={option.value}>{option.label}</Badge>
        ));

        return badges;
    }

    const handleSelectValue = (option: Option) => {
        const isAlreadySelected = selectedValues.some(selectedOption => selectedOption.value === option.value);
        if (isAlreadySelected) {
            // Deselect the option
            setSelectedValues(selectedValues.filter(selectedOption => selectedOption.value !== option.value));
        } else {
            // Select the option
            setSelectedValues([...selectedValues, option]);
        }

    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <ButtonGroup>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setType(type === FilterIncludeExcludeType.Include ? FilterIncludeExcludeType.Exclude : FilterIncludeExcludeType.Include)}
                    className={selectedValues.length > 0 ? "" : "border-dashed"}
                >
                    {type === FilterIncludeExcludeType.Include ? <CirclePlus /> : <CircleMinus />}
                </Button>
                <PopoverTrigger asChild>
                    <Button
                        size="sm"
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={selectedValues.length > 0 ? "" : "border-dashed"}
                    >
                        {label}

                        {selectedValues.length > 0 && <Separator orientation="vertical" />}
                        {displayBadges()}
                        {selectedValues.length > 0 && (
                            <Button variant="outline" size="sm" className="rounded-full h-5 w-5 p-0" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedValues([]);
                            }}>
                                <X className="size-3.5 text-red-500" />
                            </Button>
                        )}
                    </Button>
                </PopoverTrigger>
            </ButtonGroup>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command
                    filter={(value, search) => {
                        const option = options.find(opt => opt.value === value);
                        if (!option) return 0;

                        // Check if the search term matches the label (case-insensitive)
                        const completeLabel = `${option.label} (${option.value})`;
                        const labelMatch = completeLabel.toLowerCase().includes(search.toLowerCase());
                        return labelMatch ? 1 : 0;
                    }}
                >
                    <div className="relative">
                        <CommandInput placeholder={searchPlaceholder} className="h-9" value={searchTerm} onValueChange={setSearchTerm} />
                        {selectedValues.length > 0 && (
                            <Button
                                variant="destructive"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                onClick={() => setSelectedValues([])}
                            >
                                <BrushCleaningIcon />
                            </Button>
                        )}
                    </div>
                    <div ref={scrollAreaRef} className="relative">
                        <ScrollArea className={'*:data-radix-scroll-area-viewport:max-h-[300px] min-h-10'}>
                            <CommandGroup>
                                {selectedValues.length > 0 && (
                                    <div className="selected-items-container">
                                        {selectedValues.map(option => (
                                            <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                onSelect={() => {
                                                    handleSelectValue(option);
                                                }}
                                            >
                                                <div
                                                    className={cn(
                                                        "flex size-4 items-center justify-center rounded-[4px] border",
                                                        selectedValues.some(selectedOption => selectedOption.value === option.value)
                                                            ? "bg-primary border-primary text-primary-foreground"
                                                            : "border-input [&_svg]:invisible"
                                                    )}
                                                >
                                                    {type === FilterIncludeExcludeType.Include ? <Check className="text-primary-foreground size-3.5" /> : <X className="text-primary-foreground size-3.5" />}
                                                </div>
                                                {option.label} {displayValue && <Badge variant="outline" className="ml-auto">{option.value}</Badge>}
                                            </CommandItem>
                                        ))}
                                    </div>
                                )}
                                {selectedValues.length > 0 && (
                                    <Separator className="my-2 separator-after-selected" />
                                )}
                                <div className="unselected-items-container">
                                    {options.filter(option => !selectedValues.some(selectedOption => selectedOption.value === option.value)).map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.value}
                                            onSelect={() => {
                                                handleSelectValue(option);
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    "flex size-4 items-center justify-center rounded-[4px] border",
                                                    selectedValues.some(selectedOption => selectedOption.value === option.value)
                                                        ? "bg-primary border-primary text-primary-foreground"
                                                        : "border-input [&_svg]:invisible"
                                                )}
                                            >
                                                {type === FilterIncludeExcludeType.Include ? <Check className="text-primary-foreground size-3.5" /> : <X className="text-primary-foreground size-3.5" />}
                                            </div>
                                            {option.label} {displayValue && <Badge variant="outline" className="ml-auto">{option.value}</Badge>}
                                        </CommandItem>
                                    ))}
                                </div>
                                {infiniteScroll && infiniteScroll.canLoadMore && (
                                    <InfiniteScroll
                                        isLoading={loading}
                                        hasMore={infiniteScroll.canLoadMore}
                                        next={infiniteScroll.onLoadMore}
                                        threshold={1}
                                        root={viewport}
                                    >
                                        <div className="py-2 px-2 text-center text-sm text-muted-foreground">
                                            {loading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Spinner className="size-4" />
                                                    <span>Cargando...</span>
                                                </div>
                                            ) : (
                                                <div className="h-4" />
                                            )}
                                        </div>
                                    </InfiniteScroll>
                                )}
                            </CommandGroup>
                        </ScrollArea>
                        {loading && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 pointer-events-auto flex items-center justify-center">
                                <Spinner className="size-6" />
                            </div>
                        )}
                    </div>
                </Command>
            </PopoverContent>
        </Popover>

    );
}

export default FilterIncludeExclude;