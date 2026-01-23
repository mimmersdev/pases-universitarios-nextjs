import { authMiddleware } from "@/backend/services/utils/authMiddleware";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const auth = await authMiddleware();

        if (auth instanceof NextResponse) {
            return auth;
        }

        return NextResponse.json(auth);
    } catch {
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
