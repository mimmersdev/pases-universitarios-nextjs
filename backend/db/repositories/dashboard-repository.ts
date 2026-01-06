import { RepositoryErrorOrigin, RepositoryErrorType } from "@/domain/Error";
import { ErrorHandler_Repository } from "./ErrorHandler";
import { passes } from "../schema";
import { InstallationStatus, PaymentStatus, StudentStatus } from "pases-universitarios";
import { db } from "../config";
import { and, count, eq, gte, or, sql } from "drizzle-orm";
import { HighPriorityMetrics, MediumPriorityMetrics, Series } from "@/domain/Dashboard";

const errorHandler = new ErrorHandler_Repository(RepositoryErrorOrigin.PASSES);

export class DashboardRepository {
    
    /**
     * Get high priority metrics for the dashboard (all universities)
     */
    public static async getHighPriorityMetrics(): Promise<HighPriorityMetrics> {
        try {
            // Get all metrics in parallel
            const [
                totalPassesResult,
                activeStudentsResult,
                installCountResult,
                duePaymentResult
            ] = await Promise.all([
                // Total passes (all passes regardless of status)
                db.select({ count: count() })
                    .from(passes),
                
                // Active students (students with Active status)
                db.select({ count: count() })
                    .from(passes)
                    .where(eq(passes.studentStatus, StudentStatus.Active)),
                
                // Install count (passes with at least one wallet installed)
                db.select({ count: sql<number>`count(*)::INTEGER` })
                    .from(passes)
                    .where(or(
                        eq(passes.googleInstallationStatus, InstallationStatus.Installed),
                        eq(passes.appleInstallationStatus, InstallationStatus.Installed)
                    )),
                
                // Due payment (sum of totalToPay for Due status passes)
                db.select({ 
                    sum: sql<number>`COALESCE(SUM(CAST(${passes.totalToPay} AS NUMERIC)), 0)`
                })
                    .from(passes)
                    .where(eq(passes.paymentStatus, PaymentStatus.Due))
            ]);

            return {
                totalPasses: Number(totalPassesResult[0]?.count || 0),
                activeStudents: Number(activeStudentsResult[0]?.count || 0),
                installCount: Number(installCountResult[0]?.count || 0),
                duePayment: Number(duePaymentResult[0]?.sum || 0)
            };
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Get medium priority metrics for the dashboard (all universities)
     */
    public static async getMediumPriorityMetrics(): Promise<MediumPriorityMetrics> {
        try {
            // Get payment metrics
            const [
                totalDueResult,
                totalOverdueResult,
                totalPaidResult
            ] = await Promise.all([
                db.select({ count: count() })
                    .from(passes)
                    .where(eq(passes.paymentStatus, PaymentStatus.Due)),
                db.select({ count: count() })
                    .from(passes)
                    .where(eq(passes.paymentStatus, PaymentStatus.Overdue)),
                db.select({ count: count() })
                    .from(passes)
                    .where(eq(passes.paymentStatus, PaymentStatus.Paid))
            ]);

            // Get installation metrics
            const [
                totalGoogleInstalledResult,
                totalAppleInstalledResult,
                totalBothInstalledResult,
                totalNoneInstalledResult
            ] = await Promise.all([
                db.select({ count: sql<number>`count(*)::INTEGER` })
                    .from(passes)
                    .where(eq(passes.googleInstallationStatus, InstallationStatus.Installed)),
                db.select({ count: sql<number>`count(*)::INTEGER` })
                    .from(passes)
                    .where(eq(passes.appleInstallationStatus, InstallationStatus.Installed)),
                db.select({ count: sql<number>`count(*)::INTEGER` })
                    .from(passes)
                    .where(and(
                        eq(passes.googleInstallationStatus, InstallationStatus.Installed),
                        eq(passes.appleInstallationStatus, InstallationStatus.Installed)
                    )),
                db.select({ count: sql<number>`count(*)::INTEGER` })
                    .from(passes)
                    .where(and(
                        eq(passes.googleInstallationStatus, InstallationStatus.Pending),
                        eq(passes.appleInstallationStatus, InstallationStatus.Pending)
                    ))
            ]);

            // Get student status metrics
            const [
                totalActiveResult,
                totalInactiveResult,
                totalGraduatedResult
            ] = await Promise.all([
                db.select({ count: count() })
                    .from(passes)
                    .where(eq(passes.studentStatus, StudentStatus.Active)),
                db.select({ count: count() })
                    .from(passes)
                    .where(eq(passes.studentStatus, StudentStatus.Inactive)),
                db.select({ count: count() })
                    .from(passes)
                    .where(eq(passes.studentStatus, StudentStatus.Graduated))
            ]);

            // Get time series data
            const passesCreated = await this.getPassesCreatedSeries();
            const passesUpdated = await this.getPassesUpdatedSeries();
            const passesToBeDue = await this.getPassesToBeDueSeries();

            return {
                totalDue: Number(totalDueResult[0]?.count || 0),
                totalOverdue: Number(totalOverdueResult[0]?.count || 0),
                totalPaid: Number(totalPaidResult[0]?.count || 0),
                totalGoogleInstalled: Number(totalGoogleInstalledResult[0]?.count || 0),
                totalAppleInstalled: Number(totalAppleInstalledResult[0]?.count || 0),
                totalBothInstalled: Number(totalBothInstalledResult[0]?.count || 0),
                totalNoneInstalled: Number(totalNoneInstalledResult[0]?.count || 0),
                totalActive: Number(totalActiveResult[0]?.count || 0),
                totalInactive: Number(totalInactiveResult[0]?.count || 0),
                totalGraduated: Number(totalGraduatedResult[0]?.count || 0),
                passesCreated,
                passesUpdated,
                passesToBeDue
            };
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Get series data for passes created grouped by month and year
     */
    private static async getPassesCreatedSeries(): Promise<Series[]> {
        try {
            const result = await db.select({
                month: sql<number>`EXTRACT(MONTH FROM ${passes.createdAt})::INTEGER`,
                year: sql<number>`EXTRACT(YEAR FROM ${passes.createdAt})::INTEGER`,
                count: sql<number>`COUNT(*)::INTEGER`
            })
                .from(passes)
                .groupBy(
                    sql`EXTRACT(YEAR FROM ${passes.createdAt})`,
                    sql`EXTRACT(MONTH FROM ${passes.createdAt})`
                )
                .orderBy(
                    sql`EXTRACT(YEAR FROM ${passes.createdAt})`,
                    sql`EXTRACT(MONTH FROM ${passes.createdAt})`
                );

            return result.map(row => ({
                month: row.month,
                year: row.year,
                count: row.count
            }));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Get series data for passes updated grouped by month and year
     */
    private static async getPassesUpdatedSeries(): Promise<Series[]> {
        try {
            const result = await db.select({
                month: sql<number>`EXTRACT(MONTH FROM ${passes.updatedAt})::INTEGER`,
                year: sql<number>`EXTRACT(YEAR FROM ${passes.updatedAt})::INTEGER`,
                count: sql<number>`COUNT(*)::INTEGER`
            })
                .from(passes)
                .groupBy(
                    sql`EXTRACT(YEAR FROM ${passes.updatedAt})`,
                    sql`EXTRACT(MONTH FROM ${passes.updatedAt})`
                )
                .orderBy(
                    sql`EXTRACT(YEAR FROM ${passes.updatedAt})`,
                    sql`EXTRACT(MONTH FROM ${passes.updatedAt})`
                );

            return result.map(row => ({
                month: row.month,
                year: row.year,
                count: row.count
            }));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }

    /**
     * Get series data for passes that will be due, grouped by month and year of endDueDate
     */
    private static async getPassesToBeDueSeries(): Promise<Series[]> {
        try {
            const result = await db.select({
                month: sql<number>`EXTRACT(MONTH FROM ${passes.endDueDate})::INTEGER`,
                year: sql<number>`EXTRACT(YEAR FROM ${passes.endDueDate})::INTEGER`,
                count: sql<number>`COUNT(*)::INTEGER`
            })
                .from(passes)
                .where(gte(passes.endDueDate, new Date())) // Only future due dates
                .groupBy(
                    sql`EXTRACT(YEAR FROM ${passes.endDueDate})`,
                    sql`EXTRACT(MONTH FROM ${passes.endDueDate})`
                )
                .orderBy(
                    sql`EXTRACT(YEAR FROM ${passes.endDueDate})`,
                    sql`EXTRACT(MONTH FROM ${passes.endDueDate})`
                );

            return result.map(row => ({
                month: row.month,
                year: row.year,
                count: row.count
            }));
        } catch (error) {
            throw errorHandler.handleError(RepositoryErrorType.GET, error);
        }
    }
}

