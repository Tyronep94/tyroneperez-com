"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login } from "@/app/login/actions";

function Submit() { const { pending } = useFormStatus(); return <button className="btn" disabled={pending} style={{width:"100%"}}>{pending ? "Signing in…" : "Sign in"}</button>; }
export function LoginForm() {
  const [state, action] = useActionState(login, {});
  return <form action={action} style={{display:"grid",gap:18}}>
    {state.error && <p className="notice notice-error" role="alert">{state.error}</p>}
    <div className="field"><label htmlFor="email">Email address</label><input className="input" id="email" name="email" type="email" autoComplete="email" required /></div>
    <div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>
    <Submit />
  </form>;
}
