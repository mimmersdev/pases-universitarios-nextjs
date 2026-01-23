"use client";

import { CustomButton } from "@/app/components/CustomButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/frontend/hooks/auth/useAuth";
import { useLogin } from "@/frontend/hooks/auth/useLogin";
import { useForm } from "@tanstack/react-form";
import { loginUser } from "pases-universitarios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod/v4";

type LoginForm = z.infer<typeof loginUser>;

export default function LoginPage() {
    const router = useRouter();
    const loginMutation = useLogin();
    const { setUser } = useAuth();

    const form = useForm({
        defaultValues: {
            username: '',
            password: '',
        } satisfies LoginForm,
        validators: {
            onSubmit: loginUser,
            onBlur: loginUser,
        },
        onSubmit: async ({ value }) => {
            try {
                const user = await loginMutation.mutateAsync(value);
                setUser(user);
                toast.success("Inicio de sesión exitoso");
                router.replace("/internal/dashboard");
            } catch (error) {
                toast.error("Error al iniciar sesión", {
                    description: "Usuario o contraseña incorrectos",
                });
                console.error(error);
            }
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Iniciar Sesión</CardTitle>
                    <CardDescription>
                        Ingresa tus credenciales para acceder al sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}>
                        <div className="flex flex-col gap-4">
                            <form.Field name="username">
                                {(field) => {
                                    const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Usuario</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="text"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                aria-invalid={isInvalid}
                                                placeholder="Ingresa tu usuario"
                                                autoComplete="username"
                                            />
                                            <FieldError errors={field.state.meta.errors} />
                                        </Field>
                                    )
                                }}
                            </form.Field>
                            <form.Field name="password">
                                {(field) => {
                                    const isInvalid = field.state.meta.errors.length > 0 && field.state.meta.isTouched;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="password"
                                                value={field.state.value}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                onBlur={field.handleBlur}
                                                aria-invalid={isInvalid}
                                                placeholder="Ingresa tu contraseña"
                                                autoComplete="current-password"
                                            />
                                            <FieldError errors={field.state.meta.errors} />
                                        </Field>
                                    )
                                }}
                            </form.Field>
                            <CustomButton
                                type="submit"
                                loading={loginMutation.isPending}
                                className="w-full mt-2"
                            >
                                Iniciar Sesión
                            </CustomButton>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
