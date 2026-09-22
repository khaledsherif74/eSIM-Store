import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import { Card } from "../ui/Card.jsx";
import { getOrderAccess } from "../../utils/orderStorage.js";
import "./OrderLookupCard.css";
export function OrderLookupCard({title="Find an order",description="Enter the order ID and secure access token from your email."}){
 const [id,setId]=useState(""); const [token,setToken]=useState(""); const nav=useNavigate();
 function submit(e){e.preventDefault();if(id.trim()&&token.trim())nav(`/my-esims/${encodeURIComponent(id.trim())}?token=${encodeURIComponent(token.trim())}`);}
 return <Card className="order-lookup-card"><Search size={20}/><div><h2>{title}</h2><p>{description}</p></div><form onSubmit={submit}><input value={id} onChange={e=>{setId(e.target.value);const saved=getOrderAccess(e.target.value.trim());if(saved&&!token)setToken(saved.token)}} placeholder="Order ID" aria-label="Order ID" required/><input value={token} onChange={e=>setToken(e.target.value)} placeholder="Access token" aria-label="Order access token" required/><Button type="submit">Open</Button></form></Card>;
}
