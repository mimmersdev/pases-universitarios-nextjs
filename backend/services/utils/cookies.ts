import { cookies } from "next/headers";

export enum CookieKey {
    TOKEN = "token",
    META_DATA_USER = "meta_data_user",
}

export class CookiesUtils {

    public static setCookie = async (name: string, value: string, days = 7) => {
        const maxAge = days * 24 * 60 * 60;

        (await cookies()).set({
            name,
            value,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge,
        });
    };

    public static getCookie = async (name: string) => {
        const cookie = (await cookies()).get(name);
        return cookie?.value ?? null;
    };

    public static removeCookie = async (name: string) => {
        (await cookies()).set({
            name,
            value: "",
            maxAge: 0,
            path: "/",
        });
    };

    public static removeAllCookies = async () => {
        const all = (await cookies()).getAll();
        const cookieJar = await cookies();

        await Promise.all(
            all.map(async (c) => {
                cookieJar.set({
                    name: c.name,
                    value: "",
                    maxAge: 0,
                    path: "/",
                });
            })
        );
    };
}

