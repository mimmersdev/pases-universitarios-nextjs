import { PaginationRequestSchema } from "mimmers-core-nodejs";
import { filterTagsSchema } from "pases-universitarios";
import { z } from "zod/v4";

export const filteredPaginationRequestSchema = PaginationRequestSchema.extend({
    filters: filterTagsSchema.optional(),
})

export type FilteredPaginationRequest = z.infer<typeof filteredPaginationRequestSchema>;