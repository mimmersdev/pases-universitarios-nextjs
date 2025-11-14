"use client";

import { Modal as HeroModal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";
    hideCloseButton?: boolean;
    isDismissable?: boolean;
    backdrop?: "opaque" | "blur" | "transparent";
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = "md",
    hideCloseButton = false,
    isDismissable = true,
    backdrop = "opaque",
}) => {
    return (
        <HeroModal
            isOpen={isOpen}
            onClose={onClose}
            size={size}
            hideCloseButton={hideCloseButton}
            isDismissable={isDismissable}
            backdrop={backdrop}
            scrollBehavior="inside"
            classNames={{
                backdrop: "bg-black/50", // Custom backdrop opacity
                body: "py-6", // Better vertical padding for overflow
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        {title && (
                            <ModalHeader className="flex flex-col gap-1">
                                {title}
                            </ModalHeader>
                        )}
                        <ModalBody>
                            {children}
                        </ModalBody>
                        {footer && (
                            <ModalFooter>
                                {footer}
                            </ModalFooter>
                        )}
                    </>
                )}
            </ModalContent>
        </HeroModal>
    );
};

