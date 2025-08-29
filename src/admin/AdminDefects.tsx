import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Assignment, Defect, DriverState, Truck } from "../types";
import { STORAGE } from "../storage";
import { TRUCKS } from "../storage";
import { styles as s, COLORS as C } from "../constants";

export default function AdminDefects({ drivers, assignments }:{ drivers: User[]; assignments: Assignment[] }){
  const [rows,setRows] = useState<Array<{ driver:User; truck?:Truck; defect:Defect }>>([]);
  const load = async()=>{
    const out: Array<{ driver:User; truck?:Truck; defect:Defect }> = [];
    for(const d of drivers){
      const raw = await AsyncStorage.getItem(STORAGE.DRIVER_STATE_PREFIX + d.id);
      if(!raw) continue; let st:DriverState; try{ st = JSON.parse(raw); }catch{ continue; }
      const tId = assignments.find(a=>a.driverId===d.id)?.truckId; const truck = TRUCKS.find(t=>t.id===tId);
      (st.defects||[]).forEach(df=> out.push({ driver:d, truck, defect:df }));
    }
    out.sort((a,b)=> (a.defect.status==="Naprawione"?1:0) - (b.defect.status==="Naprawione"?1:0));
    setRows(out);
  };
  useEffect(()=>{ load(); },[]);

  const setStatus = async (driverId:string, defectId:string, status:Defect["status"])=>{
    const key = STORAGE.DRIVER_STATE_PREFIX + driverId; const raw = await AsyncStorage.getItem(key); if(!raw) return;
    let st:DriverState; try{ st=JSON.parse(raw); }catch{ return; }
    st.defects = (st.defects||[]).map(d=> d.id===defectId? { ...d, status, archived: status==="Naprawione" ? true : d.archived } : d );
    await AsyncStorage.setItem(key, JSON.stringify(st));
    await load();
  };

  const cycle = (cur:Defect["status"]):Defect["status"]=>{
    const order:Defect["status"][] = ["Zgłoszono","W trakcie","Naprawione"];
    return order[(order.indexOf(cur)+1)%order.length];
  };

  return (
    <View>
      <View style={s.card}><View style={s.row}><Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Defekty — zarządzanie</Text><Pressable onPress={load} style={[s.button]}><Text style={{color:C.text}}>Odśwież</Text></Pressable></View></View>
      {rows.length===0 && <View style={s.card}><Text style={{color:C.sub}}>Brak zgłoszeń.</Text></View>}
      {rows.map(({driver,truck,defect})=> (
        <View key={defect.id+driver.id} style={[s.card,{padding:12}]}>          
          <View style={s.row}>
            <Text style={{color:C.text,fontWeight:"700"}}>{defect.area}</Text>
            <View style={s.tag}><Text style={s.tagText}>{new Date(defect.time).toLocaleString()}</Text></View>
          </View>
          <Text style={{color:C.sub, marginTop:4}}>{defect.description || "(brak opisu)"}</Text>
          <View style={{flexDirection:"row", gap:8, marginTop:8, flexWrap:"wrap"}}>
            <View style={s.tag}><Text style={s.tagText}>Kierowca: {driver.name}</Text></View>
            <View style={s.tag}><Text style={s.tagText}>Pojazd: {truck? `${truck.reg}${truck.trailerId? " / "+truck.trailerId:""}` : "—"}</Text></View>
            <View style={s.tag}><Text style={s.tagText}>Status: {defect.status}</Text></View>
            <Pressable onPress={()=>setStatus(driver.id, defect.id, cycle(defect.status))} style={[s.button]}>
              <Text style={{color:C.text}}>Zmień status → {cycle(defect.status)}</Text>
            </Pressable>
          </View>
          {defect.archived && <Text style={{color:C.sub, marginTop:6}}>➜ Oznaczono jako „Naprawione” (archiwum u kierowcy).</Text>}
        </View>
      ))}
    </View>
  );
}
