"use client";

import { useDownloadApplePass } from "@/frontend/hooks/pass/useDownloadApplePass";
import { useGoogleInstallData } from "@/frontend/hooks/pass/useGoogleInstallData";
import { useParams } from "next/navigation";

export default function InstallPage() {
    const { universityId, uniqueIdentifier, careerCode } = useParams();

    const googleInstallData = useGoogleInstallData();
    const downloadApplePass = useDownloadApplePass();

    const handleGetGoogleInstallLink = () => {
        googleInstallData.mutate({
            universityId: universityId as string,
            uniqueIdentifier: uniqueIdentifier as string,
            careerCode: careerCode as string,
            installClient: true,
        }, {
            onSuccess: (data) => {
                if (data.installLink) {
                    console.log(data.installLink);
                    window.open(data.installLink, '_blank');
                }
            }
        });
    };

    const handleDownloadApplePass = () => {
        downloadApplePass.mutate({
            universityId: universityId as string,
            uniqueIdentifier: uniqueIdentifier as string,
            careerCode: careerCode as string,
            installClient: true,
        });
    };

    return (
        <div className="p-2 flex flex-col items-center justify-center h-screen w-screen bg-[url('/install_bg.png')] bg-cover bg-center">
            <img src="/logo_white.svg" alt="logo" className="w-80 md:w-100 h-auto" />
            <h2 className="mt-10 text-4xl md:text-6xl font-space-grotesk text-brand-main">Elige tu Ruta</h2>
            <p className="mt-8 md:m-16 max-w-[700px] text-center text-lg md:text-2xl font-space-grotesk text-white">
                Bienvenido a RutaPro. Puedes instalar tu pase universitario en Google Wallet o Apple Wallet.
            </p>
            <p className="mt-2 md:mt-4 text-center text-lg md:text-2xl font-space-grotesk text-white">
                No es necesario instalar aplicaciones adicionales.
            </p>

            <p className="mt-8 md:mt-16 text-center text-lg md:text-2xl font-arvo text-brand-main">
                Escoge la plataforma de tu preferencia:
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
                <img src="/addtowallet/apple.svg" alt="apple wallet" className="w-52 md:w-64 h-auto cursor-pointer" onClick={handleDownloadApplePass} />
                <img src="/addtowallet/google.svg" alt="google wallet" className="w-52 md:w-64 h-auto cursor-pointer" onClick={handleGetGoogleInstallLink} />
            </div>

            <p className="mt-8 md:mt-16 text-center text-lg md:text-xl font-space-grotesk text-gray-300">
                Plataforma AVEX - Desarrollado por <a href="https://mimmers.com" target="_blank" className="text-brand-main">Mimmers</a>
            </p>
        </div>
    );
}