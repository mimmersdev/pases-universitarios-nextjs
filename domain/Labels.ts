import { PassStatus, PaymentStatus } from "pases-universitarios";

export const paymentStatusToLabel = (paymentStatus: PaymentStatus): string => {
    switch(paymentStatus) {
        case PaymentStatus.Paid:
            return 'Pagado';
        case PaymentStatus.Due:
            return 'Sin Pagar';
        case PaymentStatus.Overdue:
            return 'En Mora';
    }
}

export const passStatusToLabel = (passStatus: PassStatus): string => {
    switch(passStatus) {
        case PassStatus.Active:
            return 'Activo';
        case PassStatus.Inactive:
            return 'Inactivo';
    }
}