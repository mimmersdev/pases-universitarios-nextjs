import { DashboardService } from "@/backend/services/dashboard-service";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const metrics = await DashboardService.getMediumPriorityMetrics();
        console.log("Medium Priority Metrics:", metrics);
        return NextResponse.json(metrics);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

