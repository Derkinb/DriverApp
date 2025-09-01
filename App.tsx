import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, ScrollView, Pressable, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS as C, styles as s } from "./src/constants";
import { USERS, TRUCKS, STORAGE } from "./src/storage";
import { User, Assignment } from "./src/types";
import LoginScreen from "./src/screens/LoginScreen";
import AdminScreen from "./src/screens/AdminScreen";
import DriverScreen from "./src/screens/DriverScreen";
import { cloud } from "./src/backend/client";

export default function App() {
  const [sessionUser, setSessionUser] = useState<User|undefined>();
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(()=>{
    (async()=>{
      const s = await AsyncStorage.getItem(STORAGE.SESSION);
      const a = await AsyncStorage.getItem(STORAGE.ASSIGNMENTS);
      if (a) setAssignments(JSON.parse(a));
      if (s){
        try { const { userId } = JSON.parse(s); const u = USERS.find(x=>x.id===userId); if(u) setSessionUser(u); } catch {}
      }
    })();
  },[]);

  useEffect(()=>{ AsyncStorage.setItem(STORAGE.ASSIGNMENTS, JSON.stringify(assignments)); }, [assignments]);

 if (!sessionUser) {
  return (
    <LoginScreen
      onLogin={async (email, pass) => {
        // ——— Supabase Auth (jeśli skonfigurowane) ———
        if (cloud.enabled && cloud.client) {
          try {
            const { data, error } = await cloud.client.auth.signInWithPassword({
              email,
              password: pass,
            });
            if (error) throw error;

            const authUser = data.user!;
            // pobierz rolę i nazwę z users_public
            const { data: up } = await cloud.client
              .from("users_public")
              .select("*")
              .eq("id", authUser.id)
              .single();

            const role = (up?.role as "admin" | "driver") ?? "driver";
            const name = up?.name ?? authUser.email ?? "Użytkownik";

            const u: User = {
              id: authUser.id,
              email: authUser.email || email,
              password: "", // nie przechowujemy hasła
              name,
              role,
            };

            setSessionUser(u);
            await AsyncStorage.setItem(
              STORAGE.SESSION,
              JSON.stringify({ userId: u.id, email: u.email, role })
            );
            return; // sukces → koniec
          } catch (e: any) {
            Alert.alert("Błąd logowania", String(e?.message || e));
            return;
          }
        }

        // ——— Fallback: demologowanie (gdy Supabase nie włączony) ———
        const u = USERS.find(
          (x) => x.email.toLowerCase() === email.toLowerCase() && x.password === pass
        );
        if (!u) {
          Alert.alert("Błędne dane", "Sprawdź e-mail/hasło");
          return;
        }
        setSessionUser(u);
        await AsyncStorage.setItem(
          STORAGE.SESSION,
          JSON.stringify({ userId: u.id, email: u.email, role: u.role })
        );
      }}
    />
  );
}


  if(sessionUser.role === "admin"){
    return <AdminScreen user={sessionUser} assignments={assignments} setAssignments={setAssignments} onLogout={async()=>{
      setSessionUser(undefined); await AsyncStorage.removeItem(STORAGE.SESSION);
    }} />
  }

  return <DriverScreen user={sessionUser} assignments={assignments} onLogout={async()=>{
    setSessionUser(undefined); await AsyncStorage.removeItem(STORAGE.SESSION);
  }} />
}
