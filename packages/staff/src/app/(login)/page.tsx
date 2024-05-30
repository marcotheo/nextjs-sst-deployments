import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@shared-ui/ui/card";
import LoginForm from "./LoginForm";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Simple | SignIn",
  description: "",
};

export default function Page() {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        "h-[100vh] w-full",
        "bg-gradient-to-b from-zinc-900 to-emerald-300",
      )}
    >
      <Card
        className={cn(
          "flex w-[90%] flex-col items-center bg-gray-300",
          "rounded-2xl py-5 md:w-[464px]",
          "shadow-emerald-300/70 shadow-2xl",
        )}
      >
        <CardHeader>
          <CardTitle className="pt-5 text-center text-3xl font-medium text-primary">
            STAFF SIGN IN
          </CardTitle>
        </CardHeader>
        <CardContent className="w-[90%]">
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
