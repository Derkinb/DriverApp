import { Role, User, Truck } from "./types";
export const STORAGE = { SESSION:"kierowcaapp.session", ASSIGNMENTS:"kierowcaapp.assignments", DRIVER_STATE_PREFIX:"kierowcaapp.driverstate:", TASKS_PREFIX:"kierowcaapp.tasks:" };
export const USERS: User[] = [
  { id:"u1", email:"admin@demo.com", password:"admin", name:"Admin", role:"admin" },
  { id:"u2", email:"driver1@demo.com", password:"driver", name:"Jan Kowalski", role:"driver" },
  { id:"u3", email:"driver2@demo.com", password:"driver", name:"Anna Nowak", role:"driver" }
];
export const TRUCKS: Truck[] = [
  { id:"t1", reg:"ABC 12345", trailerId:"TR-001" },
  { id:"t2", reg:"XYZ 98765", trailerId:"TR-002" }
];
export const todayStr = ()=> new Date().toISOString().slice(0,10);
export const escapeHtml = (s:string)=> s.replace(/[&<>"']/g,(c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#39;" } as any)[c]);
