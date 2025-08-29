import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../types";
import { STORAGE } from "../storage";
import { styles as s, COLORS as C } from "../constants";

export default function DriverTasks({ userId }:{ userId:string }){
  const TASKS_KEY = STORAGE.TASKS_PREFIX + userId;
  const [tasks,setTasks] = useState<Task[]>([]);
  const reload = async()=>{ const raw = await AsyncStorage.getItem(TASKS_KEY); setTasks(raw? JSON.parse(raw): []); };
  useEffect(()=>{ reload(); const t=setInterval(reload, 4000); return ()=>clearInterval(t); },[]);
  const toggle = async(id:string)=>{ const list = tasks.map(t=> t.id===id? {...t, done:!t.done}: t); setTasks(list); await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(list)); };

  return (
    <View style={s.card}>
      <View style={s.row}><Text style={{color:C.text,fontWeight:"700",fontSize:16}}>Zadania od managera</Text><Pressable onPress={reload} style={[s.button]}><Text style={{color:C.text}}>Odśwież</Text></Pressable></View>
      {tasks.length===0 ? <Text style={{color:C.sub, marginTop:8}}>Brak zadań.</Text> : (
        tasks.map(t=> (
          <View key={t.id} style={[s.card,{padding:12}]}>
            <View style={s.row}>
              <Text style={{color:C.text, fontWeight:"600", flex:1}}>{t.title}</Text>
              <Pressable onPress={()=>toggle(t.id)} style={[s.tag,{ borderColor: t.done? C.primary: C.border }]}>
                <Text style={[s.tagText,{ color: t.done? "#d1fae5": C.sub }]}>{t.done? "✓ DONE":"Do zrobienia"}</Text>
              </Pressable>
            </View>
            {t.address? <Text style={{color:C.sub, marginTop:2}}>📍 {t.address}</Text>: null}
            {t.description? <Text style={{color:C.sub, marginTop:2}}>{t.description}</Text>: null}
            <Text style={{color:C.sub, marginTop:6}}>Dodano: {new Date(t.createdAt).toLocaleString()}</Text>
          </View>
        ))
      )}
    </View>
  );
}
