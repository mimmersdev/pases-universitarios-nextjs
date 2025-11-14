import { eq, gt, gte, lt, lte, not, SQL } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";
import { SingularValueComparation } from "pases-universitarios";

export function buildComparison<T extends PgColumn>(
    column: T,
    value: T['_']['data'],
    comparation: SingularValueComparation
): SQL {
    switch (comparation) {
        case SingularValueComparation.Equals:
            return eq(column, value);
        case SingularValueComparation.GreaterThan:
            return gt(column, value);
        case SingularValueComparation.GreaterThanOrEqualTo:
            return gte(column, value);
        case SingularValueComparation.LessThan:
            return lt(column, value);
        case SingularValueComparation.LessThanOrEqualTo:
            return lte(column, value);
        case SingularValueComparation.NotEqualTo:
            return not(eq(column, value));
    }
}