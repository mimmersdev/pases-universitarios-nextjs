import { CookiesUtils } from "@/backend/services/utils/cookies";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        await CookiesUtils.removeAllCookies();

        return NextResponse.json({ message: "Logout successful" }, { status: 200 });
    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
