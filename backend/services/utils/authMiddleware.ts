import { NextResponse } from "next/server";
import { User } from "pases-universitarios";
import { CookieKey, CookiesUtils } from "./cookies";
import { JWT_Utils } from "./jwt";

export const authMiddleware = async (): Promise<NextResponse | User> => {
    const token = await CookiesUtils.getCookie(CookieKey.TOKEN);

    if (!token) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const decoded = await JWT_Utils.verifyToken(token);
    if (!decoded.valid) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    const { payload } = decoded;

    await CookiesUtils.setCookie(CookieKey.META_DATA_USER, JSON.stringify(payload));

    return payload;
};
