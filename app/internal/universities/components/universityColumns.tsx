"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { University } from "pases-universitarios";
import { useRouter } from "next/navigation";

export const universityColumns: ColumnDef<University>[] = [
    {
        accessorKey: "name",
        header: "Nombre",
        enableSorting: true,
    },
    {
        accessorKey: "createdAt",
        header: "Fecha de creación",
        enableSorting: true,
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as Date;
            return createdAt.toLocaleDateString();
        }
    },
    {
        accessorKey: "updatedAt",
        header: "Fecha de actualización",
        enableSorting: true,
        cell: ({ row }) => {
            const updatedAt = row.getValue("updatedAt") as Date;
            return updatedAt.toLocaleDateString();
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const router = useRouter();
            const handleClickViewUniversity = (university: University) => {
                router.push(`/internal/universities/${university.id}`);
            }
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menú de acciones</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleClickViewUniversity(row.original)}>Ver Universidad</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">Eliminar Universidad</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    }
]