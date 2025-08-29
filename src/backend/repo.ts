import { cloud } from "./client"; import { Assignment, Defect, Task } from "../types";
export const repo = {
  enabled: cloud.enabled,
  async listAssignments(): Promise<Assignment[]>{ if(!cloud.client) return []; const {data,error}=await cloud.client.from("assignments").select("*"); if(error) throw error; return (data||[]).map((r:any)=>({driverId:r.driver_id, truckId:r.truck_id})); },
  async upsertAssignment(a:Assignment){ if(!cloud.client) return; const {error}=await cloud.client.from("assignments").upsert({driver_id:a.driverId, truck_id:a.truckId},{onConflict:"driver_id"}); if(error) throw error; },
  async insertDefect(d:any){ if(!cloud.client) return; const {error}=await cloud.client.from("defects").insert({driver_id:d.driverId,truck_id:d.truckId??null,area:d.area,description:d.description??null,truck_stopped:!!d.truckStopped,status:d.status,archived:!!d.archived}); if(error) throw error; },
  async listDefects(): Promise<any[]>{ if(!cloud.client) return []; const {data,error}=await cloud.client.from("defects").select("*").order("time",{ascending:false}); if(error) throw error; return data as any; },
  async setDefectStatus(id:string, status:Defect["status"]){ if(!cloud.client) return; const archived = status==="Naprawione"; const {error}=await cloud.client.from("defects").update({status,archived}).eq("id",id); if(error) throw error; },
  async addTask(driverId:string, t:Task){ if(!cloud.client) return; const {error}=await cloud.client.from("tasks").insert({driver_id:driverId,title:t.title,address:t.address,description:t.description,done:!!t.done}); if(error) throw error; },
  async listTasks(driverId:string): Promise<Task[]>{ if(!cloud.client) return []; const {data,error}=await cloud.client.from("tasks").select("*").eq("driver_id",driverId).order("created_at",{ascending:false}); if(error) throw error; return (data||[]).map((r:any)=>({id:r.id,title:r.title,address:r.address,description:r.description,createdAt:r.created_at,done:r.done})); },
  async toggleTask(driverId:string, id:string, done:boolean){ if(!cloud.client) return; const {error}=await cloud.client.from("tasks").update({done}).eq("id",id); if(error) throw error; },
};
