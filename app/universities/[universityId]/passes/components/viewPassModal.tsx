"use client";

import { Modal } from "@/app/components/Modal";
import { useDownloadApplePass } from "@/frontend/hooks/pass/useDownloadApplePass";
import { useGoogleInstallData } from "@/frontend/hooks/pass/useGoogleInstallData";
import { Button, Chip } from "@heroui/react";
import { Pass } from "pases-universitarios";

interface ViewPassModalProps {
    selectedPass: Pass;
    open: boolean;
    onClose: () => void;
}

const ViewPassModal = ({ selectedPass, open, onClose }: ViewPassModalProps) => {

    const { data: googleInstallData} = useGoogleInstallData(selectedPass.universityId, selectedPass.uniqueIdentifier, selectedPass.careerId);
    const downloadApplePass = useDownloadApplePass();

    const getPaymentStatusColor = (status: string) => {
        switch(status) {
            case 'Paid': return 'success';
            case 'Due': return 'warning';
            case 'Overdue': return 'danger';
            default: return 'default';
        }
    };

    const getPassStatusColor = (status: string) => {
        switch(status) {
            case 'Active': return 'success';
            case 'Inactive': return 'default';
            default: return 'default';
        }
    };

    const getInstallationStatusColor = (status: string) => {
        switch(status) {
            case 'Installed': return 'success';
            case 'Pending': return 'warning';
            default: return 'default';
        }
    };

    console.log(googleInstallData?.installLink);

    return (
        <Modal
            isOpen={open}
            onClose={onClose}
            title="Detalles del Pase"
            size="2xl"
            backdrop="opaque"
            footer={
                <div className="flex justify-end gap-2">
                    <Button color="primary" onPress={onClose}>Cerrar</Button>
                    <Button color="primary" onPress={() => downloadApplePass.mutate({ universityId: selectedPass.universityId, uniqueIdentifier: selectedPass.uniqueIdentifier, careerCode: selectedPass.careerId })}>Descargar Pase</Button>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                {/* Identification Section */}
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-3">Identificación</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">ID Único:</label>
                            <p className="text-base">{selectedPass.uniqueIdentifier}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Código Carrera:</label>
                            <p className="text-base">{selectedPass.careerId}</p>
                        </div>
                    </div>
                </div>

                {/* Academic Info */}
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-3">Información Académica</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Semestre:</label>
                            <p className="text-base">{selectedPass.semester}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Año de Matrícula:</label>
                            <p className="text-base">{selectedPass.enrollmentYear}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Graduado:</label>
                            <p className="text-base">{selectedPass.graduated ? 'Sí' : 'No'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Estudiando Actualmente:</label>
                            <p className="text-base">{selectedPass.currentlyStudying ? 'Sí' : 'No'}</p>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-3">Información de Pago</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Estado de Pago:</label>
                            <div className="mt-1">
                                <Chip color={getPaymentStatusColor(selectedPass.paymentStatus)} size="sm" variant="flat">
                                    {selectedPass.paymentStatus}
                                </Chip>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Total a Pagar:</label>
                            <p className="text-base font-bold text-green-600">${Number(selectedPass.totalToPay).toFixed(2)}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Referencia de Pago:</label>
                            <p className="text-base">{selectedPass.paymentReference}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Estado del Pase:</label>
                            <div className="mt-1">
                                <Chip color={getPassStatusColor(selectedPass.status)} size="sm" variant="flat">
                                    {selectedPass.status}
                                </Chip>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-3">Fechas</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha Inicio Vencimiento:</label>
                            <p className="text-base">{selectedPass.startDueDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha Fin Vencimiento:</label>
                            <p className="text-base">{selectedPass.endDueDate.toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Fecha de Creación:</label>
                            <p className="text-base">{selectedPass.createdAt.toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Última Actualización:</label>
                            <p className="text-base">{selectedPass.updatedAt.toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Wallet Info */}
                <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold mb-3">Información de Wallet</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Google Wallet:</label>
                            <div className="mt-1">
                                <Chip color={getInstallationStatusColor(selectedPass.googleWalletInstallationStatus)} size="sm" variant="flat">
                                    {selectedPass.googleWalletInstallationStatus}
                                </Chip>
                            </div>
                            {selectedPass.googleWalletObjectID && (
                                <p className="text-xs text-gray-500 mt-1">{selectedPass.googleWalletObjectID}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Apple Wallet:</label>
                            <div className="mt-1">
                                <Chip color={getInstallationStatusColor(selectedPass.appleWalletInstallationStatus)} size="sm" variant="flat">
                                    {selectedPass.appleWalletInstallationStatus}
                                </Chip>
                            </div>
                            {selectedPass.appleWalletSerialNumber && (
                                <p className="text-xs text-gray-500 mt-1">{selectedPass.appleWalletSerialNumber}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div>
                    <h3 className="text-lg font-semibold mb-3">Notificaciones</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Contador de Notificaciones:</label>
                            <p className="text-base">{selectedPass.notificationCount}</p>
                        </div>
                        {selectedPass.lastNotificationDate && (
                            <div>
                                <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">Última Notificación:</label>
                                <p className="text-base">{selectedPass.lastNotificationDate.toLocaleDateString()}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Links */}
                {(selectedPass.onlinePaymentLink || selectedPass.academicCalendarLink) && (
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Enlaces</h3>
                        <div className="flex flex-col gap-2">
                            {selectedPass.onlinePaymentLink && (
                                <a 
                                    href={selectedPass.onlinePaymentLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    🔗 Enlace de Pago Online
                                </a>
                            )}
                            {selectedPass.academicCalendarLink && (
                                <a 
                                    href={selectedPass.academicCalendarLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    📅 Calendario Académico
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default ViewPassModal;

