import { DashboardRepository } from "../db/repositories/dashboard-repository";
import { HighPriorityMetrics, MediumPriorityMetrics } from "@/domain/Dashboard";

export class DashboardService {
    public static async getHighPriorityMetrics(): Promise<HighPriorityMetrics> {
        return await DashboardRepository.getHighPriorityMetrics();
    }

    public static async getMediumPriorityMetrics(): Promise<MediumPriorityMetrics> {
        return await DashboardRepository.getMediumPriorityMetrics();
    }
}

