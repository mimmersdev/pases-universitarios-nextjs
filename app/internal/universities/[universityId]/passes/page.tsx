"use client";

import Container from "@/app/components/Container";
import { Section } from "@/app/components/Section";
import SectionTitle from "@/app/components/SectionTitle";
import { useState } from "react";
import ViewPassModal from "./components/viewPassModal";
import UploadPassesModal from "./components/uploadPassesModal";
import { Pass } from "pases-universitarios";
import { useParams, useRouter } from "next/navigation";
import PassesTable from "./components/passesTable";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconUpload } from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";
import { CalendarClockIcon, CoinsIcon, DollarSignIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import UpdateCashbackModal from "./components/updateCashbackModal";
import UpdatePassDueModal from "./components/updatePassDueModal";
import UpdatePassPaidModal from "./components/updatePassPaidModal";

export default function PassesPage() {
    const { universityId } = useParams();
    const router = useRouter();


    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUpdateCashbackModalOpen, setIsUpdateCashbackModalOpen] = useState(false);
    const [isUpdatePassDueModalOpen, setIsUpdatePassDueModalOpen] = useState(false);
    const [isUpdatePassPaidModalOpen, setIsUpdatePassPaidModalOpen] = useState(false);
    const [selectedPass, setSelectedPass] = useState<Pass | null>(null);

    // Debounce filters: wait 1 second after user stops typing
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setDebouncedFilters(filters);
    //     }, 2000);

    //     return () => clearTimeout(timer);
    // }, [filters]);



    const handleClickViewPass = (pass: Pass) => {
        setSelectedPass(pass);
        setIsViewModalOpen(true);
    }

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedPass(null);
    }

    return (
        <Section>
            <Container>
                <div className="flex flex-row justify-between w-full mb-8">
                    <SectionTitle removeMargin={true}>Pases</SectionTitle>
                    <div className="flex flex-row gap-2">
                        <ButtonGroup>
                            <Button
                                variant="outline"
                                onClick={() => setIsUpdateCashbackModalOpen(true)}
                            >
                                <CoinsIcon />
                                Actualizar Cashback
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsUpdatePassDueModalOpen(true)}
                            >
                                <CalendarClockIcon/>
                                Marcar pases como pendientes

                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsUpdatePassPaidModalOpen(true)}
                            >
                                <DollarSignIcon />
                                Marcar pases como pagados
                            </Button>

                        </ButtonGroup>

                        <Separator orientation="vertical" />
                        <Button
                            onClick={() => setIsUploadModalOpen(true)}
                        >
                            <IconUpload />
                            Cargar Pases
                        </Button>
                        <Button
                            onClick={() => router.push(`/internal/universities/${universityId}`)}
                        >
                            <IconArrowLeft className="w-5 h-5" />
                            Atrás
                        </Button>

                    </div>

                </div>
                <PassesTable universityId={universityId as string} onViewPass={handleClickViewPass} />

                {selectedPass && (
                    <ViewPassModal
                        selectedPass={selectedPass}
                        open={isViewModalOpen}
                        onClose={handleCloseViewModal}
                    />
                )}

                <UploadPassesModal
                    universityId={universityId as string}
                    open={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                />

                <UpdateCashbackModal
                    universityId={universityId as string}
                    open={isUpdateCashbackModalOpen}
                    onClose={() => setIsUpdateCashbackModalOpen(false)}
                />
                <UpdatePassDueModal
                    universityId={universityId as string}
                    open={isUpdatePassDueModalOpen}
                    onClose={() => setIsUpdatePassDueModalOpen(false)}
                />
                <UpdatePassPaidModal
                    universityId={universityId as string}
                    open={isUpdatePassPaidModalOpen}
                    onClose={() => setIsUpdatePassPaidModalOpen(false)}
                />
            </Container>
        </Section>
    )
}

