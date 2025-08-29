import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { User, Assignment, DriverState, Task } from "../types";
import { styles as s, COLORS as C } from "../constants";
import PickerSimple from "../components/PickerSimple";
import { USERS, TRUCKS, STORAGE, todayStr } from "../storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AdminDefects from "../admin/AdminDefects";

export default function AdminScreen({ user, assignments, setAssignments, onLogout }:{ user:User; assignments:Assignment[]; setAssignments:(a:Assignment[])=>void; onLogout:()=>void }){
  const drivers = USERS.filter(u=>u.role==="driver");
  const [adminTab, setAdminTab] = useState<"Przypisania"|"Postępy"|"Defekty"|"Zadania">("Przypisania");
  const [selectedDriver,setSelectedDriver] = useState<string>(drivers[0]?.id ?? "");
  const [selectedTruck,setSelectedTruck] = useState<string>(TRUCKS[0]?.id ?? "");
  const getAssignedTruckId=(driverId:string)=> assignments.find(a=>a.driverId===driverId)?.truckId;

  const assign=()=>{
    if(!selectedDriver){ Alert.alert("Brak kierowcy","Wybierz kierowcę."); return; }
    if(!selectedTruck){ Alert.alert("Brak pojazdu","Wybierz ciężarówkę."); return; }
    const rest = assignments.filter(a=>a.driverId!==selectedDriver);
    setAssignments([...rest, { driverId:selectedDriver, truckId:selectedTruck }]);
    Alert.alert("Zapisano","Przypisanie zaktualizowane.");
  };

  const [progress, setProgress] = useState<Record<string, DriverState>>({});
  const loadProgress = async()=>{
    const all: Record<string, DriverState> = {};
    for (const d of drivers){
      const raw = await AsyncStorage.getItem(STORAGE.DRIVER_STATE_PREFIX + d.id);
      if(raw) try{ all[d.id] = JSON.parse(raw) as DriverState; }catch{}
    }
    setProgress(all);
  };
  useEffect(()=>{ loadProgress(); },[]);
  useEffect(()=>{ if(adminTab !== "Postępy") return; const t=setInterval(loadProgress,4000); return ()=>clearInterval(t); },[adminTab]);

  // Tasks
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAddress, setTaskAddress] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [tasksForSelected, setTasksForSelected] = useState<Task[]>([]);
  const TASKS_KEY = (driverId:string)=> STORAGE.TASKS_PREFIX + driverId;
  const loadTasksFor = async (driverId:string)=>{ const raw=await AsyncStorage.getItem(TASKS_KEY(driverId)); setTasksForSelected(raw? JSON.parse(raw): []); };
  useEffect(()=>{ if(selectedDriver) loadTasksFor(selectedDriver); },[selectedDriver, adminTab]);
  const saveTasksFor = async (driverId:string, list:Task[])=>{ setTasksForSelected(list); await AsyncStorage.setItem(TASKS_KEY(driverId), JSON.stringify(list)); };
  const addTask = async()=>{
    if(!selectedDriver) { Alert.alert("Najpierw wybierz kierowcę"); return; }
    const title = taskTitle.trim(); if(!title) { Alert.alert("Brak tytułu","Podaj nazwę zadania."); return; }
    const t:Task = { id: Math.random().toString(36).slice(2), title, address: taskAddress.trim(), description: taskDesc.trim(), createdAt: new Date().toISOString(), done:false };
    const list=[t, ...tasksForSelected]; await saveTasksFor(selectedDriver, list);
    setTaskTitle(""); setTaskAddress(""); setTaskDesc(""); Alert.alert("Dodano","Zadanie przydzielone kierowcy.");
  };

  return (
    <SafeAreaView style={[s.screen,s.safe]}>
      <View style={s.header}><Text style={s.headerTitle}>Panel administratora</Text></View>

      <View style={s.tabs}>{(["Przypisania","Postępy","Defekty","Zadania"] as const).map(t => (
        <Pressable key={t} onPress={()=>setAdminTab(t)} style={[s.tab, adminTab===t && s.tabActive]}>
          <Text style={s.tabText}>{t}</Text>
        </Pressable>
      ))}</View>

      <ScrollView style={s.container}>
        {adminTab==="Przypisania" && (
          <View>
            <View style={s.card}>
              <Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Przypisz pojazd do kierowcy</Text>
              <Text style={[s.label,{marginTop:10}]}>Kierowca</Text>
              <PickerSimple value={selectedDriver || ""} onChange={setSelectedDriver} options={drivers.map(d=>({ label:`${d.name} (${d.email})`, value:d.id }))} />
              <Text style={[s.label,{marginTop:10}]}>Ciężarówka</Text>
              <PickerSimple value={selectedTruck || ""} onChange={setSelectedTruck} options={TRUCKS.map(t=>({ label:`${t.reg}${t.trailerId?` / ${t.trailerId}`:""}`, value:t.id }))} />
              <View style={{height:12}} />
              <Pressable onPress={assign} style={[s.button,s.buttonPrimary]}><Text style={s.buttonText}>Zapisz przypisanie</Text></Pressable>
            </View>
            <View style={s.card}>
              <Text style={{color:C.text,fontWeight:"700"}}>Aktualne przypisania</Text>
              {drivers.map(d=>{ const tId = getAssignedTruckId(d.id); const truck = TRUCKS.find(t=>t.id===tId); return (
                <View key={d.id} style={[s.row,{marginTop:10}]}>                    
                  <Text style={{color:C.text,flex:1}}>{d.name}</Text>
                  <View style={s.tag}><Text style={s.tagText}>{truck? `${truck.reg} / ${truck.trailerId||"—"}` : "— brak —"}</Text></View>
                </View>
              ); })}
            </View>
          </View>
        )}

        {adminTab==="Postępy" && (
          <View>
            <View style={s.card}><View style={s.row}><Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Postępy kierowców</Text><Pressable onPress={loadProgress} style={[s.button]}><Text style={{color:C.text}}>Odśwież</Text></Pressable></View></View>
            {drivers.map(d=>{ const tId = getAssignedTruckId(d.id); const truck = TRUCKS.find(t=>t.id===tId); const st = progress[d.id]; const ok = st?.items?.filter(i=>i.status==="OK").length || 0; const df = st?.items?.filter(i=>i.status==="DEFECT").length || 0; let odoStart="—", odoEnd="—"; if(truck && st?.odoByTruck && st.odoByTruck[truck.reg]){ const rec = st.odoByTruck[truck.reg]; odoStart = rec.start || "—"; odoEnd = st?.endInfo?.odoEnd || rec.end || "—"; } else { odoStart = st?.startInfo?.odoStart || "—"; odoEnd = st?.endInfo?.odoEnd || "—"; } const mileage = (Number(odoEnd)||0) - (Number(odoStart)||0); const today = todayStr(); const clockIn = st?.attendance?.[today]?.clockInISO; const clockOut = st?.attendance?.[today]?.clockOutISO; return (
              <View key={d.id} style={[s.card,{marginTop:12}]}>                  
                <View style={s.row}>
                  <Text style={{color:C.text,fontWeight:"700"}}>{d.name}</Text>
                  <View style={s.tag}><Text style={s.tagText}>{truck? `${truck.reg} / ${truck.trailerId||"—"}` : "— brak —"}</Text></View>
                </View>
                <View style={{flexDirection:"row", gap:8, marginTop:8}}>
                  <View style={s.tag}><Text style={s.tagText}>Clock in: {clockIn? new Date(clockIn).toLocaleTimeString(): "—"}</Text></View>
                  <View style={s.tag}><Text style={s.tagText}>Clock out: {clockOut? new Date(clockOut).toLocaleTimeString(): "—"}</Text></View>
                  <View style={s.tag}><Text style={s.tagText}>✓ OK: {ok}</Text></View>
                  <View style={s.tag}><Text style={s.tagText}>✗ DEFECT: {df}</Text></View>
                  <View style={s.tag}><Text style={s.tagText}>Odo: {odoStart} → {odoEnd} ({isNaN(mileage)?"—":mileage})</Text></View>
                </View>
              </View>
            ); })}
          </View>
        )}

        {adminTab==="Defekty" && (
          <AdminDefects drivers={drivers} assignments={assignments} />
        )}

        {adminTab==="Zadania" && (
          <View>
            <View style={s.card}>
              <Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Nowe zadanie dla kierowcy</Text>
              <Text style={[s.label,{marginTop:10}]}>Kierowca</Text>
              <PickerSimple value={selectedDriver} onChange={setSelectedDriver} options={drivers.map(d=>({ label:`${d.name} (${d.email})`, value:d.id }))} />
              <Text style={[s.label,{marginTop:10}]}>Tytuł / Krótki opis</Text>
              <TextInput style={s.input} placeholder="np. Odbiór palet w ABC Ltd." placeholderTextColor={C.sub} value={taskTitle} onChangeText={setTaskTitle} />
              <View style={{height:8}} />
              <Text style={s.label}>Adres</Text>
              <TextInput style={s.input} placeholder="np. 10 Downing St, London" placeholderTextColor={C.sub} value={taskAddress} onChangeText={setTaskAddress} />
              <View style={{height:8}} />
              <Text style={s.label}>Szczegóły (opcjonalnie)</Text>
              <TextInput style={[s.input,{minHeight:70}]} multiline placeholder="np. Godzina załadunku 10:00" placeholderTextColor={C.sub} value={taskDesc} onChangeText={setTaskDesc} />
              <View style={{height:10}} />
              <Pressable onPress={addTask} style={[s.button,s.buttonPrimary]}><Text style={s.buttonText}>Dodaj zadanie</Text></Pressable>
            </View>

            <View style={s.card}>
              <Text style={{color:C.text,fontWeight:"700"}}>Zadania wybranego kierowcy</Text>
              {tasksForSelected.length===0 && <Text style={{color:C.sub, marginTop:8}}>Brak zadań.</Text>}
              {tasksForSelected.map(t=> (
                <View key={t.id} style={[s.card,{padding:12}]}>                  
                  <Text style={{color:C.text,fontWeight:"600"}}>{t.title}</Text>
                  {t.address? <Text style={{color:C.sub, marginTop:2}}>📍 {t.address}</Text>: null}
                  {t.description? <Text style={{color:C.sub, marginTop:2}}>{t.description}</Text>: null}
                  <Text style={{color:C.sub, marginTop:6}}>Dodano: {new Date(t.createdAt).toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <Pressable onPress={onLogout} style={[s.button,s.buttonDanger]}><Text style={s.buttonText}>Wyloguj</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
