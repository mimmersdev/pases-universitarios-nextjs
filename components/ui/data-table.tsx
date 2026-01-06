"use client"

import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    OnChangeFn,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ArrowUp, ArrowDown, EyeOff, MoreHorizontal } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "./skeleton"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[],
    pageSize: number,
    loading: boolean,
    sortingOptions?: {
        sorting: SortingState,
        setSorting: OnChangeFn<SortingState>
    }
    columnVisibilityOptions?: {
        columnVisibility: VisibilityState,
        setColumnVisibility: OnChangeFn<VisibilityState>
    }
}

export function DataTable<TData, TValue>({
    columns,
    data,
    pageSize,
    loading,
    sortingOptions,
    columnVisibilityOptions,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        manualSorting: true,
        enableHiding: true,
        state: {
            ...(sortingOptions ? { sorting: sortingOptions.sorting } : {}),
            ...(columnVisibilityOptions ? { columnVisibility: columnVisibilityOptions.columnVisibility } : {}),
        },
        onSortingChange: sortingOptions ? sortingOptions.setSorting : undefined,
        onColumnVisibilityChange: columnVisibilityOptions ? columnVisibilityOptions.setColumnVisibility : undefined,
    })

    const displayContent = () => {
        const missingRows = pageSize - table.getRowModel().rows?.length;
        if (loading) {
            return (
                Array.from({ length: pageSize }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell colSpan={columns.length} className="text-center">
                            <Skeleton className="h-8 w-full p-0" />
                        </TableCell>
                    </TableRow>
                ))
            )
        }
        if (table.getRowModel().rows?.length) {
            const rows = table.getRowModel().rows.map((row) => (
                <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                >
                    {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                </TableRow>
            ));
            const emptyRows = Array.from({ length: missingRows }).map((_, index) => (
                <TableRow key={`empty-${index}`}>
                    <TableCell colSpan={columns.length} className="text-center">
                        {/* <Skeleton className="h-8 w-full p-0" /> */}
                        <div className="h-8 w-full p-0"></div>
                    </TableCell>
                </TableRow>
            ));
            // const emptyRows = Array.from({ length: pageSize }).map((_, index) => (
            //     <TableRow key={index}>
            //         <TableCell colSpan={columns.length} className="text-center">
            //             <Spinner />
            //         </TableCell>
            //     </TableRow>
            // ));
            return [...rows, ...emptyRows];
        }
        return (
            <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay resultados.
                </TableCell>
            </TableRow>
        );
    }

    return (
        <div className="overflow-hidden rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const canSort = header.column.getCanSort()
                                const canHide = header.column.getCanHide()
                                const sorted = header.column.getIsSorted()
                                const isVisible = header.column.getIsVisible()
                                const isInteractive = canSort || canHide
                                
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : (
                                            <div className="flex items-center">
                                                {isInteractive ? (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="-ml-3 h-8 justify-start data-[state=open]:bg-accent"
                                                            >
                                                                {flexRender(
                                                                    header.column.columnDef.header,
                                                                    header.getContext()
                                                                )}
                                                                {canSort && (
                                                                    <span className="ml-2">
                                                                        {sorted === "asc" ? (
                                                                            <ArrowUp className="h-4 w-4" />
                                                                        ) : sorted === "desc" ? (
                                                                            <ArrowDown className="h-4 w-4" />
                                                                        ) : (
                                                                            <ArrowUpDown className="h-4 w-4 opacity-50" />
                                                                        )}
                                                                    </span>
                                                                )}
                                                                <MoreHorizontal className="ml-2 h-4 w-4 text-muted-foreground" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="start">
                                                            {canSort && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        onClick={() => header.column.toggleSorting(false)}
                                                                    >
                                                                        <ArrowUp className="mr-2 h-4 w-4" />
                                                                        Ordenar ascendente
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => header.column.toggleSorting(true)}
                                                                    >
                                                                        <ArrowDown className="mr-2 h-4 w-4" />
                                                                        Ordenar descendente
                                                                    </DropdownMenuItem>
                                                                    {sorted && (
                                                                        <DropdownMenuItem
                                                                            onClick={() => header.column.clearSorting()}
                                                                        >
                                                                            <ArrowUpDown className="mr-2 h-4 w-4" />
                                                                            Limpiar orden
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </>
                                                            )}
                                                            {canHide && (
                                                                <>
                                                                    {canSort && <div className="my-1 h-px bg-border" />}
                                                                    <DropdownMenuItem
                                                                        onClick={() => header.column.toggleVisibility(false)}
                                                                        disabled={!isVisible}
                                                                    >
                                                                        <EyeOff className="mr-2 h-4 w-4" />
                                                                        Ocultar columna
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                ) : (
                                                    <div className="flex items-center">
                                                        {flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {displayContent()}
                </TableBody>
            </Table>
        </div>
    )
}