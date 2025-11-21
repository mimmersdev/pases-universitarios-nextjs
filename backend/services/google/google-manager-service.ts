import { Career, City, getPassStatusLabel, getPaymentStatusLabel, Pass, University } from "pases-universitarios";
import { GoogleWallet_FrontFieldPaths, GoogleWalletIssueProps, LinkModuleData } from "pases-universitarios/wallet";

export class GoogleManagerService {
    public static async getGoogleWalletIssuePropsFromPass(universityData: University, careerName: string, cityName: string, pass: Pass): Promise<GoogleWalletIssueProps> {
        const linksModuleData: LinkModuleData[] = [];
        if (pass.onlinePaymentLink !== null) {
            linksModuleData.push({
                id: "onlinePaymentLink",
                uri: pass.onlinePaymentLink,
                description: "Pagar Pase",
            });
        }
        if (pass.academicCalendarLink !== null) {
            linksModuleData.push({
                id: "academicCalendarLink",
                uri: pass.academicCalendarLink,
                description: "Calendario Académico",
            });
        }

        return {
            cardTitle: universityData.name,
            header: pass.name,
            subheader: "RutaPro",
            heroUri: "https://avex-rutapro.s3.us-east-1.amazonaws.com/emel_hero.png",
            hexBackgroundColor: "#0d1e35",
            logoUri: "https://avex-rutapro.s3.us-east-1.amazonaws.com/RutaProIcon3.png",
            barcode: {
                value: pass.paymentReference,
                alternativeText: pass.paymentReference,
            },
            textModulesData: [
                {
                    id: GoogleWallet_FrontFieldPaths.PRIMARY_LEFT,
                    header: "Institución",
                    body: universityData.name,
                },
                {
                    id: GoogleWallet_FrontFieldPaths.PRIMARY_RIGHT,
                    header: "Estado",
                    body: getPassStatusLabel(pass.status),
                },
                {
                    id: GoogleWallet_FrontFieldPaths.SECONDARY_LEFT,
                    header: "Cashback",
                    body: pass.cashback.toString(),
                },
                {
                    id: GoogleWallet_FrontFieldPaths.SECONDARY_RIGHT,
                    header: "Estado de Pago",
                    body: getPaymentStatusLabel(pass.paymentStatus),
                },
                {
                    id: "totalToPay",
                    header: "Total a Pagar",
                    body: pass.totalToPay.toString(),
                },
                {
                    id: "endDueDate",
                    header: "Fecha de Vencimiento",
                    body: pass.endDueDate.toLocaleDateString(),
                },
                {
                    id: "enrollmentYear",
                    header: "Año de Ingreso",
                    body: pass.enrollmentYear.toString(),
                },
                {
                    id: "career",
                    header: "Carrera",
                    body: careerName,
                },
                {
                    id: "semester",
                    header: "Semestre",
                    body: pass.semester.toString(),
                },
                {
                    id: "enrollmentYear",
                    header: "Año de Ingreso",
                    body: pass.enrollmentYear.toString(),
                },
                {
                    id: "informationField",
                    header: "Información Extra",
                    body: pass.informationField,
                }
            ],
            linksModuleData: linksModuleData
        }

    }
}