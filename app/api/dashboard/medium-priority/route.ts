import { DashboardService } from "@/backend/services/dashboard-service";
import { authMiddleware } from "@/backend/services/utils/authMiddleware";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const auth = await authMiddleware();

        if (auth instanceof NextResponse) {
            return auth;
        }
        
        const metrics = await DashboardService.getMediumPriorityMetrics();
        console.log("Medium Priority Metrics:", metrics);
        return NextResponse.json(metrics);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

