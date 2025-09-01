import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { styles as s, COLORS as C } from "../constants";
import { cloud } from "../backend/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE } from "../storage";
import { useNavigation } from "@react-navigation/native";

type Driver = { id: string; name: string; email: string };
type Truck  = { id: string; reg: string; trailer_id?: string | null };
type Assign = { driver_id: string; truck_id: string | null };
type Defect = {
  id: string; time: string; driver_id: string; truck_id: string | null;
  area: string; description?: string | null; truck_stopped: boolean;
  status: "Zgłoszono" | "W trakcie" | "Naprawione"; archived: boolean;
};
type Task = {
  id: string; driver_id: string; title: string; address?: string | null;
  description?: string | null; done: boolean; created_at: string;
};

type Tab = "assign" | "defects" | "tasks";

export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>("assign");

  // dane
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks]   = useState<Truck[]>([]);
  const [assignments, setAssignments] = useState<Assign[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [tasks, setTasks]     = useState<Task[]>([]);

  // formularze
  const [selDriver, setSelDriver] = useState("");
  const [selTruck, setSelTruck]   = useState("");
  const [taskFor, setTaskFor]     = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskAddr, setTaskAddr]   = useState("");
  const [taskDesc, setTaskDesc]   = useState("");

  const [loading, setLoading] = useState(false);

  const nav = useNavigation();

  // ===== pobranie danych z Supabase (drivers, trucks, assignments, defects) =====
  useEffect(() => {
    (async () => {
      if (!cloud.enabled || !cloud.client) return;
      setLoading(true);
      try {
        const [up, t, a, d] = await Promise.all([
          cloud.client.from("users_public").select("*").eq("role", "driver").order("name"),
          cloud.client.from("trucks").select("*").order("reg"),
          cloud.client.from("assignments").select("*"),
          cloud.client.from("defects").select("*").order("time", { ascending: false }),
        ]);
        if (!up.error && up.data) {
          setDrivers(up.data.map((u: any) => ({ id: u.id, name: u.name, email: u.email })));
        }
        if (!t.error && t.data) setTrucks(t.data as any);
        if (!a.error && a.data) setAssignments(a.data as any);
        if (!d.error && d.data) setDefects(d.data as any);
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ===== akcje =====
  async function saveAssignment() {
    if (!selDriver || !selTruck) return Alert.alert("Wybierz kierowcę i ciężarówkę");
    if (!cloud.enabled || !cloud.client) return;
    const { error } = await cloud.client
      .from("assignments")
      .upsert({ driver_id: selDriver, truck_id: selTruck }, { onConflict: "driver_id" });
    if (error) return Alert.alert("Błąd", error.message);
    const { data } = await cloud.client.from("assignments").select("*");
    if (data) setAssignments(data as any);
    Alert.alert("OK", "Przypisanie zapisane");
  }

  async function setDefectStatus(id: string, status: Defect["status"]) {
    if (!cloud.enabled || !cloud.client) return;
    const archived = status === "Naprawione";
    const { error } = await cloud.client.from("defects").update({ status, archived }).eq("id", id);
    if (error) return Alert.alert("Błąd", error.message);
    const { data } = await cloud.client.from("defects").select("*").order("time", { ascending: false });
    if (data) setDefects(data as any);
  }

  async function addTask() {
    if (!taskFor || !taskTitle) return Alert.alert("Wpisz tytuł i wybierz kierowcę");
    if (!cloud.enabled || !cloud.client) return;
    const { error } = await cloud.client
      .from("tasks")
      .insert({ driver_id: taskFor, title: taskTitle, address: taskAddr || null, description: taskDesc || null });
    if (error) return Alert.alert("Błąd", error.message);
    setTaskTitle(""); setTaskAddr(""); setTaskDesc("");
    const { data } = await cloud.client
      .from("tasks").select("*").eq("driver_id", taskFor).order("created_at", { ascending: false });
    if (data) setTasks(data as any);
  }

  async function loadTasksFor(driverId: string) {
    setTaskFor(driverId);
    if (!cloud.enabled || !cloud.client) return;
    const { data } = await cloud.client
      .from("tasks").select("*").eq("driver_id", driverId).order("created_at", { ascending: false });
    if (data) setTasks(data as any);
  }

  // ===== wylogowanie =====
  const handleLogout = async () => {
    try {
      await cloud.client?.auth.signOut();
    } catch (e) {
      console.log("signOut error", e);
    } finally {
      try { await AsyncStorage.removeItem(STORAGE.SESSION); } catch {}
      // reset do ekranu logowania (React Navigation)
      // @ts-ignore
      nav.reset?.({ index: 0, routes: [{ name: "Login" }] });
    }
  };

  // ===== UI =====
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>
          Panel admina {Platform.OS === "ios" ? "" : "🛠️"}
        </Text>
      </View>

      {/* segmented (jak w DEMO) */}
      <View style={styles.segments}>
        <Pressable onPress={() => setTab("assign")} style={[styles.segment, tab === "assign" && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === "assign" && styles.segmentTextActive]}>Przypisania</Text>
        </Pressable>
        <Pressable onPress={() => setTab("defects")} style={[styles.segment, tab === "defects" && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === "defects" && styles.segmentTextActive]}>Defekty</Text>
        </Pressable>
        <Pressable onPress={() => setTab("tasks")} style={[styles.segment, tab === "tasks" && styles.segmentActive]}>
          <Text style={[styles.segmentText, tab === "tasks" && styles.segmentTextActive]}>Zadania</Text>
        </Pressable>
      </View>

      {tab === "assign" && (
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 8 }]}>Kierowcy</Text>
          <View style={styles.rowWrap}>
            {drivers.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => setSelDriver(d.id)}
                style={[styles.chip, selDriver === d.id && styles.chipActive]}
              >
                <Text style={styles.chipText}>{d.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 12, marginBottom: 8 }]}>Ciężarówki</Text>
          <View style={styles.rowWrap}>
            {trucks.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setSelTruck(t.id)}
                style={[styles.chip, selTruck === t.id && styles.chipActive]}
              >
                <Text style={styles.chipText}>{t.reg}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[s.button, s.buttonPrimary]} onPress={saveAssignment}>
            <Text style={s.buttonText}>Zapisz przypisanie</Text>
          </Pressable>

          <View style={{ height: 10 }} />

          <Text style={[s.label, { marginBottom: 8 }]}>Aktualne przypisania</Text>
          {assignments.map((a) => {
            const u = drivers.find((x) => x.id === a.driver_id);
            const t = trucks.find((x) => x.id === a.truck_id);
            return (
              <View key={a.driver_id} style={styles.row}>
                <Text style={styles.rowLeft}>{u?.name} ({u?.email})</Text>
                <Text style={styles.rowRight}>{t?.reg ?? "—"}</Text>
              </View>
            );
          })}
          {!assignments.length && <Text style={{ color: C.sub }}>Brak przypisań</Text>}

          {/* separator */}
          <View style={{ height: 12 }} />

          {/* WYLOGUJ — na samym dole panelu PRZYPISANIA */}
          <Pressable
            onPress={handleLogout}
            style={[s.button, { backgroundColor: "#ef4444", borderColor: "#ef4444", marginTop: 6 }]}
          >
            <Text style={s.buttonText}>Wyloguj</Text>
          </Pressable>
          <Text style={{ color: C.sub, fontSize: 12, textAlign: "center", marginTop: 6 }}>
            Zamyka sesję i wraca do logowania
          </Text>
        </View>
      )}

      {tab === "defects" && (
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 8 }]}>Aktywne defekty</Text>
          {defects.map((d) => {
            const u = drivers.find((x) => x.id === d.driver_id);
            const t = trucks.find((x) => x.id === d.truck_id);
            return (
              <View key={d.id} style={{ marginBottom: 12, borderBottomColor: C.border, borderBottomWidth: 1, paddingBottom: 8 }}>
                <Text style={{ color: C.text, fontWeight: "700" }}>
                  {new Date(d.time).toLocaleString()} • {t?.reg ?? "—"} • {u?.name ?? ""}
                </Text>
                <Text style={{ color: C.sub, marginTop: 2 }}>{d.area}{d.description ? ` — ${d.description}` : ""}</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <Pressable style={[s.button, styles.btnWarn]} onPress={() => setDefectStatus(d.id, "W trakcie")}>
                    <Text style={s.buttonText}>W trakcie</Text>
                  </Pressable>
                  <Pressable style={[s.button, s.buttonPrimary]} onPress={() => setDefectStatus(d.id, "Naprawione")}>
                    <Text style={s.buttonText}>Naprawione</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
          {!defects.length && <Text style={{ color: C.sub }}>Brak zgłoszeń</Text>}
        </View>
      )}

      {tab === "tasks" && (
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 8 }]}>Nowe zadanie</Text>

          <Text style={s.label}>Dla kierowcy</Text>
          <View style={styles.rowWrap}>
            {drivers.map((d) => (
              <Pressable
                key={d.id}
                onPress={() => loadTasksFor(d.id)}
                style={[styles.chip, taskFor === d.id && styles.chipActive]}
              >
                <Text style={styles.chipText}>{d.name}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 10 }]}>Tytuł</Text>
          <TextInput value={taskTitle} onChangeText={setTaskTitle} style={s.input} placeholder="Nazwa zadania" placeholderTextColor={C.sub} />

          <Text style={[s.label, { marginTop: 10 }]}>Adres</Text>
          <TextInput value={taskAddr} onChangeText={setTaskAddr} style={s.input} placeholder="Adres (opcjonalnie)" placeholderTextColor={C.sub} />

          <Text style={[s.label, { marginTop: 10 }]}>Opis</Text>
          <TextInput value={taskDesc} onChangeText={setTaskDesc} style={[s.input, { height: 90 }]} multiline placeholder="Opis (opcjonalnie)" placeholderTextColor={C.sub} />

          <Pressable style={[s.button, s.buttonPrimary]} onPress={addTask}>
            <Text style={s.buttonText}>Dodaj zadanie</Text>
          </Pressable>

          {taskFor ? (
            <>
              <View style={{ height: 12 }} />
              <Text style={[s.label, { marginBottom: 8 }]}>Lista zadań</Text>
              {tasks.map((t) => (
                <View key={t.id} style={styles.row}>
                  <Text style={styles.rowLeft}>{new Date(t.created_at).toLocaleString()} • {t.title}</Text>
                  <Text style={styles.rowRight}>{t.done ? "✓" : ""}</Text>
                </View>
              ))}
              {!tasks.length && <Text style={{ color: C.sub }}>Brak zadań dla wybranego kierowcy</Text>}
            </>
          ) : (
            <Text style={{ color: C.sub, marginTop: 8 }}>Wybierz kierowcę, aby zobaczyć jego zadania</Text>
          )}
        </View>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  segments: { flexDirection: "row", gap: 8, marginBottom: 12 },
  segment: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, alignItems: "center",
    backgroundColor: "#0b1220",
  },
  segmentActive: { backgroundColor: "#111827", borderColor: C.accent },
  segmentText: { color: C.sub, fontWeight: "600" },
  segmentTextActive: { color: C.text },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: C.border, backgroundColor: "#0b1220" },
  chipActive: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { color: "#fff" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  rowLeft: { color: C.text },
  rowRight: { color: C.text },
  btnWarn: { backgroundColor: "#f59e0b", borderColor: "#f59e0b" },
});
