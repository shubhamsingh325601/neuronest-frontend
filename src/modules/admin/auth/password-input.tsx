"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

/** Password input with a show / hide toggle. Field wires id and aria props into it via cloneElement. */
export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className={`pr-12 ${className ?? ""}`} />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}
