import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { passStatusToLabel, paymentStatusToLabel } from "@/domain/Labels";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { getStudentStatusLabel, Pass, PassStatus, PaymentStatus, StudentStatus } from "pases-universitarios";

interface PassesColumnsProps {
    onViewPass: (pass: Pass) => void;
    onDeletePass: (pass: Pass) => void;
}

const getPaymentStatusBadge = (paymentStatus: PaymentStatus) => {
    const className: string = (() => {
        switch(paymentStatus) {
            case PaymentStatus.Due:
                return "bg-yellow-500";
            case PaymentStatus.Overdue:
                return "bg-red-500";
            case PaymentStatus.Paid:
                return "bg-green-500";
        }
    })();
    return(
        <Badge className={className}>{paymentStatusToLabel(paymentStatus)}</Badge>
    )
}

const getPassStatusBadge = (passStatus: PassStatus) => {
    const className: string = (() => {
        switch(passStatus) {
            case PassStatus.Active:
                return "bg-green-500";
            case PassStatus.Inactive:
                return "bg-red-500";
        }
    })();
    
    return(
        <Badge className={className}>{passStatusToLabel(passStatus)}</Badge>
    )
}

const getStudentStatusBadge = (studentStatus: StudentStatus) => {
    const className: string = (() => {
        switch(studentStatus) {
            case StudentStatus.Active:
                return "bg-green-500";
            case StudentStatus.Inactive:
                return "bg-red-500";
            case StudentStatus.Graduated:
                return "bg-blue-500";
        }
    })();
    return(
        <Badge className={className}>{getStudentStatusLabel(studentStatus)}</Badge>
    )
}

const passesColumns = ({ onViewPass, onDeletePass }: PassesColumnsProps): ColumnDef<Pass>[] => {
    return [
        {
            accessorKey: "uniqueIdentifier",
            header: "ID Único",
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "name",
            header: "Nombre",
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "email",
            header: "Email",
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "careerName",
            header: "Programa",
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => {
                return <div className="flex gap-2">
                    <span>{row.original.careerName}</span>
                    <Badge variant="secondary">{row.original.careerId}</Badge>
                </div>;
            }
        },
        {
            accessorKey: "semester",
            header: "Semestre",
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "enrollmentYear",
            header: "Año Matrícula",
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: "paymentStatus",
            header: "Estado Pago",
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => {
                return getPaymentStatusBadge(row.original.paymentStatus);
            }
        },
        {
            accessorKey: "studentStatus",
            header: "Estado Estudiante",
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => {
                return getStudentStatusBadge(row.original.studentStatus);
            },
        },
        {
            accessorKey: "status",
            header: "Estado Pase",
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => {
                return getPassStatusBadge(row.original.status);
            }
        },
        {
            accessorKey: "totalToPay",
            header: "Total a Pagar",
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => {
                return `$ ${Number(row.original.totalToPay).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
            }
        },
        {
            accessorKey: "cashback",
            header: "Cashback",
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => {
                return Number(row.original.cashback).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
            }
        },
        {
            accessorKey: "endDueDate",
            header: "Fecha de Vencimiento",
            enableSorting: false,
            enableHiding: true,
            cell: ({ row }) => {
                return row.original.endDueDate.toLocaleDateString('es-CO');
            }
        },
        {
            id: "actions",
            enableHiding: false,
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
                            <DropdownMenuItem onClick={() => onViewPass(row.original)}>Ver Pase</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => onDeletePass(row.original)}>Eliminar Pase</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            }
        },
    ]
}

export default passesColumns;

