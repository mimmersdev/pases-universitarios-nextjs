import { paymentStatusList } from "pases-universitarios";
import { type ExcelFieldDefinition } from "@/utils";

export const updatePaidExcelFieldDefinitions: ExcelFieldDefinition[] = [
    {
        title: "uniqueIdentifier",
        type: "string",
    },
    {
        title: "careerId",
        type: "string",
    }
]

export const updatePassDueExcelFieldDefinitions: ExcelFieldDefinition[] = [
    {
        title: "uniqueIdentifier",
        type: "string",
    },
    {
        title: "careerId",
        type: "string",
    },
    {
        title: "totalToPay",
        type: "number",
    },
    {
        title: "startDueDate",
        type: "date",
    },
    {
        title: "endDueDate",
        type: "date",
    },
    {
        title: "onlinePaymentLink",
        type: "string",
        optional: true,
    }
]

export const updateCashbackExcelFieldDefinitions: ExcelFieldDefinition[] = [
    {
        title: "uniqueIdentifier",
        type: "string",
    },
    {
        title: "careerId",
        type: "string",
    },
    {
        title: "cashback",
        type: "number",
    },
];

export const passExcelFieldDefinitions: ExcelFieldDefinition[] = [
    {
        title: "uniqueIdentifier",
        type: "string",
    },
    {
        title: "careerId",
        type: "string",
    },
    {
        title: "name",
        type: "string",
    },
    {
        title: "email",
        type: "string",
    },
    {
        title: "semester",
        type: "number",
    },
    {
        title: "enrollmentYear",
        type: "number",
    },
    {
        title: "paymentReference",
        type: "string",
    },
    {
        title: "paymentStatus",
        type: "string",
        validValues: paymentStatusList,
    },
    {
        title: "totalToPay",
        type: "number",
    },
    {
        title: "startDueDate",
        type: "date",
    },
    {
        title: "endDueDate",
        type: "date",
    },
    {
        title: "cashback",
        type: "number",
    },
    {
        title: "studentStatus",
        type: "string",
    },
    {
        title: "onlinePaymentLink",
        type: "string",
    },
    {
        title: "academicCalendarLink",
        type: "string",
    },
    {
        title: "photoUrl",
        type: "string",
    }
];

