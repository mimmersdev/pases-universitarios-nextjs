import { z } from "zod/v4";
import { NextResponse } from "next/server";
import { loginUser } from "pases-universitarios";
import { UserService } from "@/backend/services/user-service";
import { CookieKey, CookiesUtils } from "@/backend/services/utils/cookies";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedBody = loginUser.parse(body);
        const result = await UserService.validateCredentials(validatedBody.username, validatedBody.password);

        if (result === null) {
            return NextResponse.json(
                { error: "Login Failed" },
                { status: 401 }
            );
        }

        await CookiesUtils.setCookie(CookieKey.TOKEN, result.token);

        return NextResponse.json(result.user);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: z.treeifyError(error) },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
