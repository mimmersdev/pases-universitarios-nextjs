import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Career } from "pases-universitarios";

interface CareerColumnsProps {
    onViewCareer: (career: Career) => void;
    onDeleteCareer: (career: Career) => void;
}
const careerColumns = ({ onViewCareer, onDeleteCareer }: CareerColumnsProps): ColumnDef<Career>[] => {
    return [
        {
            accessorKey: "name",
            header: "Nombre",
        },
        {
            accessorKey: "code",
            header: "Código",
        },
        {
            accessorKey: "createdAt",
            header: "Fecha de creación",
            cell: ({ row }) => {
                const createdAt = row.getValue("createdAt") as Date;
                return createdAt.toLocaleDateString();
            }
        },
        {
            accessorKey: "updatedAt",
            header: "Fecha de actualización",
            cell: ({ row }) => {
                const updatedAt = row.getValue("updatedAt") as Date;
                return updatedAt.toLocaleDateString();
            }
        },
        {
            id: "actions",
            cell: ({ row }) => {
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
                            <DropdownMenuItem onClick={() => onViewCareer(row.original)}>Editar Carrera</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => onDeleteCareer(row.original)}>Eliminar Carrera</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        }
    ]
}

export default careerColumns;