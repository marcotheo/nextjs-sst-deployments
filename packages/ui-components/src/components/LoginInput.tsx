import { FieldValues, Path, UseFormRegister } from "react-hook-form";
import { ReactNode } from "react";

import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

export interface ILoginInputProps<T extends FieldValues> {
  name: Path<T>;
  register: UseFormRegister<T>;
  placeholder?: string;
  description?: string;
  type?: "text" | "password" | "number";
  variant?: "normal" | "ghost";
  errMsg?: string;
  Icon?: ReactNode;
}

export function LoginInput<T extends FieldValues>({
  name,
  register,
  placeholder,
  description,
  variant = "normal",
  type = "text",
  errMsg,
  Icon,
}: ILoginInputProps<T>) {
  const cssInput = {
    ghost: "border-0",
    normal: "border-0",
  };

  return (
    <div>
      <div className="group relative">
        <div
          className={cn(
            "absolute left-2",
            "flex items-center justify-center",
            "h-full w-[2.5rem]",
            Icon ? "" : "hidden"
          )}
        >
          {Icon}
        </div>

        <Input
          {...register(name, {
            setValueAs: (value) => value || undefined,
          })}
          placeholder={placeholder ?? ""}
          type={type}
          className={cn(
            "rounded-full shadow-md shadow-emerald-700",
            Icon ? "indent-9" : "",
            !!errMsg ? "border border-red-500" : cssInput[variant]
          )}
        />
      </div>

      <p>{description}</p>
      <p className="text-red-500">{errMsg}</p>
    </div>
  );
}
