"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { dict } from "@/lib/dictionaries/ru";
import { api, extractErrorMessage } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/field";

const schema = z.object({
  company_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const { data, error } = await api.POST("/auth/register", { body: values });
    if (error) {
      setServerError(extractErrorMessage(error, dict.auth.genericError));
      return;
    }
    queryClient.setQueryData(["me"], data);
    router.push("/profile");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            <span className="text-xl font-bold text-accent-on">E</span>
          </Link>
          <h1 className="text-2xl font-semibold text-text">{dict.auth.registerTitle}</h1>
          <p className="mt-1 text-sm text-text-secondary">{dict.auth.registerSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md border border-status-critical-fg/30 bg-status-critical-bg px-4 py-3 text-sm text-status-critical-fg">
              {serverError}
            </div>
          )}
          <div>
            <Label htmlFor="company_name">{dict.auth.companyName}</Label>
            <Input id="company_name" {...register("company_name")} placeholder="ООО «Пример»" />
            <FieldError>{errors.company_name?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="email">{dict.auth.email}</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">{dict.auth.password}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {dict.auth.submitRegister}
          </Button>
          <p className="text-center text-sm text-text-secondary">
            {dict.auth.haveAccount}{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              {dict.auth.toLogin}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
