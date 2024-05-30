"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RiLockPasswordFill } from "react-icons/ri";
import { useForm } from "react-hook-form";
import { FaUser } from "react-icons/fa6";
import * as z from "zod";

import { LoginInput } from "@shared-ui/LoginInput";
import { Button } from "@shared-ui/ui/button";

const formSchema = z.object({
  email: z.string(),
  password: z.string().min(1, "Required"),
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function LoginForm() {
  const { handleSubmit, register } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormSchemaType) => {
    console.log(data);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col space-y-5"
      >
        <div className="space-y-7">
          <LoginInput
            register={register}
            name="email"
            placeholder="Username"
            Icon={<FaUser className="w-5 h-5 text-primary" />}
          />
          <LoginInput
            register={register}
            type="password"
            name="password"
            placeholder="Password"
            Icon={<RiLockPasswordFill className="w-6 h-6 text-primary" />}
          />
        </div>
        <div className="flex w-full justify-end font-medium text-primary hover:cursor-pointer">
          <p className="text-lg">Forgot Password?</p>
        </div>

        <Button className="w-full" type="submit">
          LOGIN
        </Button>
      </form>
    </>
  );
}
