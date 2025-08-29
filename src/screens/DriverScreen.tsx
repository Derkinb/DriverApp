import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, ScrollView, Pressable, TextInput, Switch, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles as s, COLORS as C } from "../constants";
import { Assignment, ChecklistItem, Defect, DriverProfile, DriverState, ItemStatus, OdoRec, Task, User } from "../types";
import { STORAGE, todayStr } from "../storage";
import { TRUCKS } from "../storage";
import ChecklistRow from "../components/ChecklistRow";
import DriverTasks from "../components/DriverTasks";
import ArchiveDefects from "../components/ArchiveDefects";
import { generateDailyHTML, sharePdfToFiles } from "../pdf";

const LEFT_COL = [
  "Fuel/Oil leaks","Battery security (condition)","Tyres/Wheel and wheel fixing","Spray suppression","Steering","Security of load/Vehicle height","Mirrors/Glass/Visibility","Air build up/Leaks","Lights","Reflector/Markers","Indicators/Side repeaters","Wipers"
];
const RIGHT_COL = [
  "Washers","Horn","Excessive engine exhaust smoke","AdBlue (if required)","Brake lines*","Coupling security*","Electrical connections*","Brakes inc. ABS/EBS","Security/Condition of body/Wings","Registration","Cab interior/Seat belts","Warning lamps/MIL","Tachograph Unit (in calibration)","Spare tacho-printer rolls","Lifting equipment*","ADR kit and/or PPE*","Tail-lift and safety equipment**","Camera & detection sensors**","Prominent external warning signage**","Side Guards/Under-run protection**","Mirrors/Class II (wide angle)","Class V (proximity)/Class VI (forward mirrors)**","Lenses (e.g. Fresnel)**"
];
const ALL_LABELS = [...LEFT_COL, ...RIGHT_COL];
const defaultItem = (label:string): ChecklistItem => ({ id: label, label, status: "UNCHECKED", notes: "" });
const defaultChecklist = ():ChecklistItem[] => ALL_LABELS.map(defaultItem);
const normalizeChecklist = (prev: ChecklistItem[] | undefined): ChecklistItem[] => {
  const byLabel = new Map((prev ?? []).map(i => [i.label, i]));
  return ALL_LABELS.map(label => {
    const it = byLabel.get(label);
    return it ? { ...defaultItem(label), ...it, id: it.id || label } : defaultItem(label);
  });
};

export default function DriverScreen({ user, assignments, onLogout }:{ user:User; assignments:Assignment[]; onLogout:()=>void }){
  const [tab, setTab] = useState<"Panel"|"Checklista"|"Defekty"|"Dzień">("Panel");
  const truckId = assignments.find(a=>a.driverId===user.id)?.truckId; const truck = TRUCKS.find(t=>t.id===truckId);
  const KEY = STORAGE.DRIVER_STATE_PREFIX + user.id;

  const [profile, setProfile] = useState<DriverProfile>({ name: user.name, driverId: "", phone: "" });
  const [items, setItems] = useState<ChecklistItem[]>(defaultChecklist());
  const [defects, setDefects] = useState<Defect[]>([]);
  const [defectDraft, setDefectDraft] = useState<Partial<Defect>>({ area: "", description: "", truckStopped: false });

  const [odoByTruck, setOdoByTruck] = useState<Record<string, OdoRec>>({});
  const truckKey = truck?.reg ?? "__NO_TRUCK__";

  const [startInfo, setStartInfo] = useState({ odoStart: "", fuelLevel: "", notes: "" });
  const [endInfo, setEndInfo] = useState({ odoEnd: "", refuel: "", notes: "" });
  const [morningSubmittedDate, setMorningSubmittedDate] = useState<string|undefined>(undefined);
  const morningSubmitted = morningSubmittedDate === todayStr();

  const [lastEndOdo, setLastEndOdo] = useState<string|undefined>(undefined);

  const [attendance, setAttendance] = useState<Record<string, { clockInISO?: string; clockOutISO?: string }>>({});
  const today = todayStr();
  const clockInISO = attendance[today]?.clockInISO;
  const clockOutISO = attendance[today]?.clockOutISO;
  const isClockedIn = !!clockInISO;

  const TASKS_KEY = STORAGE.TASKS_PREFIX + user.id;

  const [tasks, setTasks] = useState<Task[]>([]);
  const loadTasks = async()=>{ const raw = await AsyncStorage.getItem(TASKS_KEY); setTasks(raw? JSON.parse(raw): []); };
  const saveTasks = async(list:Task[])=>{ setTasks(list); await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(list)); };
  const toggleTask = async(id:string)=>{ const list = tasks.map(t=> t.id===id? {...t, done:!t.done}: t); await saveTasks(list); };
  useEffect(()=>{ loadTasks(); const t=setInterval(loadTasks, 5000); return ()=>clearInterval(t); },[]);

  useEffect(()=>{(async()=>{ const raw = await AsyncStorage.getItem(KEY); if(raw){ try{ const s:DriverState = JSON.parse(raw);
      setProfile(s.profile||profile);
      setItems(normalizeChecklist(s.items?.length?s.items:defaultChecklist()));
      setDefects(s.defects||defects);
      setOdoByTruck(s.odoByTruck || {});
      setStartInfo(s.startInfo||startInfo);
      setEndInfo(s.endInfo||endInfo);
      setMorningSubmittedDate(s.morningSubmittedDate);
      setLastEndOdo(s.lastEndOdo);
      setAttendance(s.attendance || {});
    }catch{} } })(); },[]);

  useEffect(()=>{ const s:DriverState = { profile, items, defects, odoByTruck, startInfo, endInfo, morningSubmittedDate, lastEndOdo, attendance }; AsyncStorage.setItem(KEY, JSON.stringify(s)); }, [profile,items,defects,odoByTruck,startInfo,endInfo,morningSubmittedDate,lastEndOdo,attendance]);

  useEffect(()=>{ const rec = odoByTruck[truckKey] || {}; setStartInfo(prev=>({ ...prev, odoStart: rec.start || "" })); setEndInfo(prev=>({ ...prev, odoEnd: rec.end || "" })); setLastEndOdo(rec.lastEnd); },[truckKey]);
  useEffect(()=>{ setOdoByTruck(prev=> ({ ...prev, [truckKey]: { ...(prev[truckKey]||{}), start: startInfo.odoStart } })); },[truckKey, startInfo.odoStart]);
  useEffect(()=>{ setOdoByTruck(prev=> ({ ...prev, [truckKey]: { ...(prev[truckKey]||{}), end: endInfo.odoEnd } })); },[truckKey, endInfo.odoEnd]);

  const timeNow = () => new Date().toISOString();

  const counts = useMemo(()=>({
    unchecked: items.filter(i=>i.status==="UNCHECKED").length,
    ok: items.filter(i=>i.status==="OK").length,
    defect: items.filter(i=>i.status==="DEFECT").length,
  }),[items]);

  const numberOrNaN = (v?: string)=>{ const n = Number(v); return isFinite(n) ? n : NaN; };

  const validateStartAgainstLast = (val: string)=>{ const start = numberOrNaN(val); const last = numberOrNaN(lastEndOdo); if(!isNaN(start) && !isNaN(last) && start < last){ Alert.alert("Błędny ODO start", `Nie może być mniejszy niż poprzedni koniec dnia: ${lastEndOdo}`); return false;} return true; };
  const validateChecklistComplete = ()=>{ if(counts.unchecked>0){ Alert.alert("Uzupełnij checklistę", "Zaznacz wszystkie pozycje jako ✓ lub ✗."); return false;} return true; };
  const requireTruck = ()=>{ if(!truck){ Alert.alert("Brak pojazdu","Zgłoś się do managera po przydział."); return false } return true };

  const confirmStartAndSend = async()=>{
    if(!requireTruck()) return;
    if(!isClockedIn){ Alert.alert("Clock in wymagany","Najpierw rozpocznij pracę (Panel → Clock in)."); return; }
    if(!validateChecklistComplete()) return;
    if(!startInfo.odoStart || !startInfo.fuelLevel){ Alert.alert("Uzupełnij start dnia","Podaj ODO start i poziom paliwa."); return; }
    if(!validateStartAgainstLast(startInfo.odoStart)) return;
    const html = generateDailyHTML({
      date: todayStr(), profile, truck, odoStart: startInfo.odoStart, fuelLevel: startInfo.fuelLevel,
      items, leftCols: LEFT_COL, rightCols: RIGHT_COL, defects
    });
    try{
      await sharePdfToFiles(html, `DailyCheck_${user.id}`);
      setMorningSubmittedDate(today);
      Alert.alert("Zatwierdzono","Start dnia zapisany i PDF udostępniony.");
    }catch(e:any){
      Alert.alert("PDF", String(e?.message||e));
    }
  };

  const finishDay = ()=>{
    if(!morningSubmitted){ Alert.alert("Najpierw start dnia","Zatwierdź start dnia zanim zakończysz dzień."); return; }
    const end = endInfo.odoEnd; if(!end){ Alert.alert("Brak ODO koniec","Podaj ODO na koniec dnia."); return; }
    const a = Number(startInfo.odoStart); const b = Number(end); if(isFinite(a) && isFinite(b) && b < a){ Alert.alert("Błędny ODO koniec", `Nie może być mniejszy niż ODO start (${startInfo.odoStart}).`); return; }
    setOdoByTruck(prev=> ({ ...prev, [truckKey]: { ...(prev[truckKey]||{}), lastEnd: end, end } }));
    setLastEndOdo(end);
    setAttendance(prev=> ({ ...prev, [today]: { ...(prev[today]||{}), clockOutISO: timeNow() } }));
    Alert.alert("Zapisano","Zakończono dzień (Clock out).");
  };

  const truckMissing = !truck;
  const tabsEnabled = !truckMissing && isClockedIn;

  return (
    <SafeAreaView style={[s.screen,s.safe]}>
      <View style={s.header}><Text style={s.headerTitle}>Kierowca: {user.name} {truck? `• ${truck.reg}`: "• (brak przydziału)"} </Text></View>

      <View style={s.tabs}>{(["Panel","Checklista","Defekty","Dzień"] as const).map(t => (
        <Pressable key={t} onPress={()=>{ if(t==="Panel" || tabsEnabled) setTab(t); }} style={[s.tab, tab===t && s.tabActive, (t!=="Panel" && !tabsEnabled)? {opacity:0.5}: {}]}>
          <Text style={s.tabText}>{t}</Text>
        </Pressable>
      ))}</View>

      <ScrollView style={s.container}>
        {tab==="Panel" && (
          <View>
            {truckMissing ? (
              <View style={[s.card,{borderColor:C.danger}]}> 
                <Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Brak przydzielonego pojazdu</Text>
                <Text style={{color:C.sub, marginTop:6}}>Zgłoś się do managera po przypisanie ciężarówki. Inne funkcje są zablokowane.</Text>
              </View>
            ) : (
              <>
                <View style={s.card}>
                  <Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Dziś: {today}</Text>
                  <Text style={{color:C.sub, marginTop:4}}>Pojazd: {truck?.reg} {truck?.trailerId? ` / ${truck?.trailerId}`: ""}</Text>
                  <View style={{height:10}} />
                  {!isClockedIn ? (
                    <Pressable onPress={()=> setAttendance(prev=> ({ ...prev, [today]: { ...(prev[today]||{}), clockInISO: timeNow() } }))} style={[s.button,s.buttonPrimary]}>
                      <Text style={s.buttonText}>Clock in (rozpocznij pracę)</Text>
                    </Pressable>
                  ) : (
                    <View style={{gap:8}}>
                      <View style={s.row}><View style={s.tag}><Text style={s.tagText}>Clock in: {clockInISO? new Date(clockInISO).toLocaleTimeString(): "—"}</Text></View></View>
                      {!morningSubmitted ? (
                        <>
                          <Text style={{color:C.text}}>Krok 2: Uzupełnij checklistę, a następnie ODO + paliwo w zakładce „Dzień”.</Text>
                          <View style={{flexDirection:"row", gap:8, marginTop:8}}>
                            <Pressable onPress={()=>setTab("Checklista")} style={[s.button]}><Text style={{color:C.text}}>Przejdź do Checklisty</Text></Pressable>
                            <Pressable onPress={()=>setTab("Dzień")} style={[s.button]}><Text style={{color:C.text}}>Przejdź do Start dnia</Text></Pressable>
                          </View>
                        </>
                      ) : (
                        <>
                          <Text style={{color:C.text}}>Poranny raport zapisany. Możesz realizować zadania i/lub zakończyć dzień.</Text>
                          <View style={{flexDirection:"row", gap:8, marginTop:8}}>
                            <Pressable onPress={()=>setTab("Dzień")} style={[s.button]}><Text style={{color:C.text}}>Wpisz ODO koniec / Tankowanie</Text></Pressable>
                            <Pressable onPress={finishDay} style={[s.button,s.buttonPrimary]}><Text style={s.buttonText}>Zakończ dzień (Clock out)</Text></Pressable>
                          </View>
                        </>
                      )}
                    </View>
                  )}
                </View>

                <DriverTasks userId={user.id} />
              </>
            )}

            <View style={s.card}>
              <Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Profil kierowcy</Text>
              <Text style={s.label}>Imię i nazwisko</Text>
              <TextInput value={profile.name} onChangeText={v=>setProfile(p=>({...p,name:v}))} style={s.input} placeholder="np. Jan Kowalski" placeholderTextColor={C.sub} />
              <View style={{height:10}} />
              <Text style={s.label}>ID kierowcy</Text>
              <TextInput value={profile.driverId} onChangeText={v=>setProfile(p=>({...p,driverId:v}))} style={s.input} placeholder="np. 12345" placeholderTextColor={C.sub} />
              <View style={{height:10}} />
              <Text style={s.label}>Telefon</Text>
              <TextInput keyboardType="phone-pad" value={profile.phone} onChangeText={v=>setProfile(p=>({...p,phone:v}))} style={s.input} placeholder="+44 ..." placeholderTextColor={C.sub} />
              {lastEndOdo && <Text style={{color:C.sub, marginTop:10}}>Poprzedni ODO koniec: {lastEndOdo}</Text>}
              <View style={{height:10}} />
              <Pressable onPress={onLogout} style={[s.button,s.buttonDanger]}><Text style={s.buttonText}>Wyloguj</Text></Pressable>
            </View>
          </View>
        )}

        {tab==="Checklista" && (
          <View>
            {!truck && <View style={[s.card,{borderColor:C.danger}]}><Text style={{color:C.text}}>Brak przydzielonego pojazdu — skontaktuj się z adminem.</Text></View>}
            <View style={[s.card]}>
              <Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Daily Check — zaznacz ✓ (OK) lub ✗ (DEFECT) jak w formularzu</Text>
              <View style={{flexDirection:"row", gap:8, marginTop:8}}>
                <View style={s.tag}><Text style={s.tagText}>Do zaznaczenia: {counts.unchecked}</Text></View>
                <View style={s.tag}><Text style={s.tagText}>✓ OK: {counts.ok}</Text></View>
                <View style={s.tag}><Text style={s.tagText}>✗ DEFECT: {counts.defect}</Text></View>
              </View>
            </View>
            <View style={{flexDirection:"row", gap:12}}>
              <View style={{flex:1}}>
                {LEFT_COL.map(label=>{ const it = items.find(x=>x.label===label) || defaultItem(label); return (
                  <ChecklistRow key={label} label={label} status={it.status} notes={it.notes||""}
                    onSet={(st)=>setItems(prev=>normalizeChecklist(prev).map(p=>p.label===label?{...p,status:st}:p))}
                    onNotes={(v)=>setItems(prev=>normalizeChecklist(prev).map(p=>p.label===label?{...p,notes:v}:p))}
                    onMarkDefect={()=>{ if(it.status!=="DEFECT") setDefects(prev=>[{ id: Math.random().toString(36).slice(2), time: new Date().toISOString(), area: label, description: "", truckStopped: false, status:"Zgłoszono", archived:false }, ...prev]); }}
                  />
                ); })}
              </View>
              <View style={{flex:1}}>
                {RIGHT_COL.map(label=>{ const it = items.find(x=>x.label===label) || defaultItem(label); return (
                  <ChecklistRow key={label} label={label} status={it.status} notes={it.notes||""}
                    onSet={(st)=>setItems(prev=>normalizeChecklist(prev).map(p=>p.label===label?{...p,status:st}:p))}
                    onNotes={(v)=>setItems(prev=>normalizeChecklist(prev).map(p=>p.label===label?{...p,notes:v}:p))}
                    onMarkDefect={()=>{ if(it.status!=="DEFECT") setDefects(prev=>[{ id: Math.random().toString(36).slice(2), time: new Date().toISOString(), area: label, description: "", truckStopped: false, status:"Zgłoszono", archived:false }, ...prev]); }}
                  />
                ); })}
              </View>
            </View>
          </View>
        )}

        {tab==="Defekty" && (
          <View>
            <View style={s.card}><Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Defekt Book — uzupełnij szczegóły</Text>
              <Text style={s.label}>Obszar</Text>
              <TextInput value={defectDraft.area||""} onChangeText={v=>setDefectDraft(d=>({...d,area:v}))} style={s.input} placeholder="np. Tyres/Wheel" placeholderTextColor={C.sub} />
              <View style={{height:10}} />
              <Text style={s.label}>Opis</Text>
              <TextInput multiline value={defectDraft.description||""} onChangeText={v=>setDefectDraft(d=>({...d,description:v}))} style={[s.input,{minHeight:80,textAlignVertical:"top"}]} placeholder="Krótki opis problemu" placeholderTextColor={C.sub} />
              <View style={{height:10}} />
              <View style={s.row}><Text style={{color:C.text}}>Pojazd unieruchomiony?</Text><Switch value={!!defectDraft.truckStopped} onValueChange={(v)=>setDefectDraft(d=>({...d,truckStopped:v}))} /></View>
              <View style={{height:12}} />
              <Pressable onPress={()=>{ const area=(defectDraft.area||"").trim(); const description=(defectDraft.description||"").trim(); if(!area){ Alert.alert("Uzupełnij pola","Obszar jest wymagany."); return; } const d:Defect = { id: Math.random().toString(36).slice(2), time: new Date().toISOString(), area, description, truckStopped: !!defectDraft.truckStopped, status: "Zgłoszono", archived:false }; setDefects(prev=>[d,...prev]); setDefectDraft({ area:"", description:"", truckStopped:false }); }} style={[s.button,s.buttonPrimary]}><Text style={s.buttonText}>Zapisz defekt</Text></Pressable>
            </View>

            {(() => { const open = defects.filter(d=>!d.archived && d.status!=="Naprawione"); const archived = defects.filter(d=>d.archived || d.status==="Naprawione"); return (
              <>
                {open.map(df=> (
                  <View key={df.id} style={s.card}>
                    <View style={s.row}><Text style={{color:C.text,fontWeight:"700"}}>{df.area}</Text><View style={s.tag}><Text style={s.tagText}>{new Date(df.time).toLocaleString()}</Text></View></View>
                    <Text style={{color:C.sub,marginTop:6}}>{df.description || "(uzupełnij szczegóły)"}</Text>
                    <View style={[s.row,{marginTop:10}]}> 
                      <View style={s.tag}><Text style={s.tagText}>Status: {df.status}</Text></View>
                      <View style={s.tag}><Text style={[s.tagText,{ color: df.truckStopped? "#fecaca":"#d1fae5" }]}>{df.truckStopped?"UNIERUCHOMIONY":"JEZDNY"}</Text></View>
                    </View>
                  </View>
                ))}
                <ArchiveDefects defects={archived} />
              </>
            ); })()}
          </View>
        )}

        {tab==="Dzień" && (
          <View>
            <View style={s.card}><Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Start dnia</Text>
              <Text style={s.label}>Stan licznika (ODO) — wymagany</Text>
              <TextInput value={startInfo.odoStart} onChangeText={(v)=> setStartInfo(o=>({...o,odoStart:v}))} onEndEditing={(e)=>{ const v=e.nativeEvent.text; if(!validateStartAgainstLast(v) && lastEndOdo){ setStartInfo(o=>({...o,odoStart:String(lastEndOdo)})); } }} style={s.input} placeholder="np. 123456" placeholderTextColor={C.sub} keyboardType="numeric" />
              <View style={{height:10}} />
              <Text style={s.label}>Poziom paliwa — wymagany</Text>
              <TextInput value={startInfo.fuelLevel} onChangeText={(v)=>setStartInfo(o=>({...o,fuelLevel:v}))} style={s.input} placeholder="np. 3/4" placeholderTextColor={C.sub} />
              <View style={{height:10}} />
              <Text style={s.label}>Notatki (opcjonalnie)</Text>
              <TextInput value={startInfo.notes} onChangeText={(v)=>setStartInfo(o=>({...o,notes:v}))} style={[s.input,{minHeight:60}]} placeholder="opcjonalnie" placeholderTextColor={C.sub} multiline />
              <View style={{height:10}} />
              <Pressable onPress={confirmStartAndSend} style={[s.button, s.buttonPrimary]}>
                <Text style={s.buttonText}>Zatwierdź start dnia i ZAPISZ PDF (Pliki/iCloud)</Text>
              </Pressable>
            </View>

            <View style={[s.card, { opacity: morningSubmitted? 1: 0.5 }]}>
              <Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Koniec dnia {morningSubmitted? "": "(zablokowane do czasu zatwierdzenia startu)"}</Text>
              <Text style={s.label}>Stan licznika (ODO)</Text>
              <TextInput editable={morningSubmitted} value={endInfo.odoEnd} onChangeText={(v)=>setEndInfo(o=>({...o,odoEnd:v}))} style={s.input} placeholder="np. 123999" placeholderTextColor={C.sub} keyboardType="numeric" />
              <View style={{height:10}} />
              <Text style={s.label}>Tankowanie</Text>
              <TextInput editable={morningSubmitted} value={endInfo.refuel} onChangeText={(v)=>setEndInfo(o=>({...o,refuel:v}))} style={s.input} placeholder="np. 120 L" placeholderTextColor={C.sub} />
              <View style={{height:10}} />
              <Text style={s.label}>Notatki</Text>
              <TextInput editable={morningSubmitted} value={endInfo.notes} onChangeText={(v)=>setEndInfo(o=>({...o,notes:v}))} style={[s.input,{minHeight:60}]} placeholder="opcjonalnie" placeholderTextColor={C.sub} multiline />
              <View style={{height:10}} />
              <Pressable disabled={!morningSubmitted} onPress={finishDay} style={[s.button, morningSubmitted? s.button: { opacity:0.7 }]}>
                <Text style={{color: morningSubmitted? C.text: C.sub}}>Zakończ dzień (Clock out)</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
