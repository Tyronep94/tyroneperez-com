"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState, Client } from "@/types/database";

function Submit({edit}:{edit:boolean}){const{pending}=useFormStatus();return <button className="btn" disabled={pending}>{pending?"Saving…":edit?"Save changes":"Create client"}</button>}
export function ClientForm({client,action}:{client?:Client;action:(state:ActionState,data:FormData)=>Promise<ActionState>}){
  const[state,formAction]=useActionState(action,{}); const[follow,setFollow]=useState(client?.requires_follow_up??false); const err=(name:string)=>state.fieldErrors?.[name]?.[0];
  return <form action={formAction} className="card panel form-grid">
    {state.error&&<p className="notice notice-error span-2" role="alert">{state.error}</p>}
    <div className="field"><label htmlFor="first_name">First name *</label><input className="input" id="first_name" name="first_name" defaultValue={client?.first_name} required/>{err("first_name")&&<small className="notice-error">{err("first_name")}</small>}</div>
    <div className="field"><label htmlFor="last_name">Last name *</label><input className="input" id="last_name" name="last_name" defaultValue={client?.last_name} required/>{err("last_name")&&<small className="notice-error">{err("last_name")}</small>}</div>
    <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" defaultValue={client?.email??""}/>{err("email")&&<small className="notice-error">{err("email")}</small>}</div>
    <div className="field"><label htmlFor="phone">Phone</label><input className="input" id="phone" name="phone" type="tel" defaultValue={client?.phone??""}/></div>
    <div className="field"><label htmlFor="preferred_contact_method">Preferred contact</label><select className="input" id="preferred_contact_method" name="preferred_contact_method" defaultValue={client?.preferred_contact_method??""}><option value="">Not specified</option><option value="email">Email</option><option value="phone">Phone call</option><option value="text">Text message</option></select></div>
    <div className="field"><label htmlFor="referral_source">Referral source</label><input className="input" id="referral_source" name="referral_source" defaultValue={client?.referral_source??""} placeholder="Instagram, referral, search…"/></div>
    <div className="field span-2"><label htmlFor="general_notes">Notes</label><textarea className="input" id="general_notes" name="general_notes" defaultValue={client?.general_notes??""}/></div>
    <div className="span-2 card" style={{padding:16,background:"#faf8f3"}}><label style={{display:"flex",gap:10,alignItems:"center",fontWeight:700,fontSize:14}}><input name="requires_follow_up" type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/> Follow-up required</label>{follow&&<div className="field" style={{marginTop:14,maxWidth:280}}><label htmlFor="follow_up_date">Follow-up date *</label><input className="input" id="follow_up_date" name="follow_up_date" type="date" defaultValue={client?.follow_up_date??""} required/>{err("follow_up_date")&&<small className="notice-error">{err("follow_up_date")}</small>}</div>}</div>
    <div className="span-2"><Submit edit={Boolean(client)}/></div>
  </form>;
}
