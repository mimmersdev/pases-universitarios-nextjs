import { PaginationRequestSchema } from "mimmers-core-nodejs";
import { filterTagsSchema } from "pases-universitarios";
import { z } from "zod/v4";

export enum SortType {
    ASC = "asc",
    DESC = "desc",
}

export enum FilterIncludeExcludeType {
    Include = "include",
    Exclude = "exclude",
}

export enum FilterDateType {
    SingleDate = "singleDate",
    Range = "range",
}

export enum FilterDateComparation {
    Before = "before",
    After = "after",
}

export const filteredPaginationRequestSchema = PaginationRequestSchema.extend({
    filters: filterTagsSchema.optional(),
})

export type FilteredPaginationRequest = z.infer<typeof filteredPaginationRequestSchema>;

export const universityPaginationRequestSchema = PaginationRequestSchema.extend({
    sortName: z.enum([SortType.ASC, SortType.DESC]).optional(),
    sortCreatedAt: z.enum([SortType.ASC, SortType.DESC]).optional(),
    sortUpdatedAt: z.enum([SortType.ASC, SortType.DESC]).optional(),
})

export type UniversityPaginationRequest = z.infer<typeof universityPaginationRequestSchema>;

export const careerPaginationRequestSchema = PaginationRequestSchema.extend({
    // Sort
    sortCode: z.enum([SortType.ASC, SortType.DESC]).optional(),
    sortName: z.enum([SortType.ASC, SortType.DESC]).optional(),
    sortCreatedAt: z.enum([SortType.ASC, SortType.DESC]).optional(),
    sortUpdatedAt: z.enum([SortType.ASC, SortType.DESC]).optional(),
    // Search
    searchName: z.string().optional(),
})

export type CareerPaginationRequest = z.infer<typeof careerPaginationRequestSchema>;


const includeExcludeFilterSchema = z.object({
    type: z.enum([FilterIncludeExcludeType.Include, FilterIncludeExcludeType.Exclude]),
    values: z.array(z.string()),
});

export type IncludeExcludeFilter = z.infer<typeof includeExcludeFilterSchema>;

export const dateFilterSingleDateFormSchema = z.object({
    value: z.date("La fecha debe ser una fecha válida").nullable(),
    comparation: z.enum([FilterDateComparation.Before, FilterDateComparation.After]),
}).refine((data) => data.value !== null, {
    message: "La fecha es requerida",
    path: ["value"],
});

export const dateFilterRangeFormSchema = z.object({
    startDate: z.date("La fecha de inicio debe ser una fecha válida").nullable(),
    endDate: z.date("La fecha de fin debe ser una fecha válida").nullable(),
}).refine((data) => data.startDate !== null && data.endDate !== null, {
    message: "Las fechas son requeridas",
    path: ["startDate", "endDate"],
}).refine((data) => data.startDate !== null && data.endDate !== null && data.startDate < data.endDate, {
    message: "La fecha de inicio debe ser anterior a la fecha de fin",
    path: ["startDate", "endDate"],
});

export const dateFilterSingleDateSchema = z.object({
    value: z.string().pipe(z.coerce.date("La fecha debe ser una fecha válida")),
    comparation: z.enum([FilterDateComparation.Before, FilterDateComparation.After]),
});

export const dateFilterRangeSchema = z.object({
    startDate: z.string().pipe(z.coerce.date("La fecha de inicio debe ser una fecha válida")),
    endDate: z.string().pipe(z.coerce.date("La fecha de fin debe ser una fecha válida")),
});

export type DateFilterSingleDate = z.infer<typeof dateFilterSingleDateSchema>;
export type DateFilterRange = z.infer<typeof dateFilterRangeSchema>;
export type DateFilterSingleDateForm = z.infer<typeof dateFilterSingleDateFormSchema>;
export type DateFilterRangeForm = z.infer<typeof dateFilterRangeFormSchema>;

export const rangeFilterSchema = z.object({
    min: z.number().min(0),
    max: z.number().min(0),
}).refine((data) => data.min <= data.max, {
    message: "El valor mínimo no puede ser mayor que el valor máximo",
    path: ["min"],
}).refine((data) => data.max >= data.min, {
    message: "El valor máximo no puede ser menor que el valor mínimo",
    path: ["max"],
});

export const rangeFilterFormSchema = z.object({
    min: z.number().min(0).nullable(),
    max: z.number().min(0).nullable(),
}).refine((data) => {
    // Only validate if both values are not null
    if (data.min === null || data.max === null) return true;
    return data.min <= data.max;
}, {
    message: "El valor mínimo no puede ser mayor que el valor máximo",
    path: ["min"], // This will attach the error to the min field
}).refine((data) => {
    // Only validate if both values are not null
    if (data.min === null || data.max === null) return true;
    return data.max >= data.min;
}, {
    message: "El valor máximo no puede ser menor que el valor mínimo",
    path: ["max"], // This will attach the error to the max field
});

export type RangeFilterForm = z.infer<typeof rangeFilterFormSchema>;
export type RangeFilter = z.infer<typeof rangeFilterSchema>;

export const passPaginationRequestSchema = PaginationRequestSchema.extend({
    career: includeExcludeFilterSchema.optional(),
    semester: includeExcludeFilterSchema.optional(),
    enrollmentYear: rangeFilterSchema.optional(),
    paymentStatus: includeExcludeFilterSchema.optional(),
    studentStatus: includeExcludeFilterSchema.optional(),
    passStatus: includeExcludeFilterSchema.optional(),
    totalToPay: rangeFilterSchema.optional(),
    cashback: rangeFilterSchema.optional(),
    endDueDate: z.union([dateFilterSingleDateSchema, dateFilterRangeSchema]).optional(),
})

export type PassPaginationRequest = z.infer<typeof passPaginationRequestSchema>;