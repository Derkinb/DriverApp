import React from "react";
import { View, Text, Pressable, TextInput } from "react-native";
import { COLORS as C, styles as s } from "../constants";
import { ItemStatus } from "../types";

export default function ChecklistRow({ label, status, notes, onSet, onNotes, onMarkDefect }:{
  label:string; status:ItemStatus; notes:string;
  onSet:(s:ItemStatus)=>void; onNotes:(v:string)=>void; onMarkDefect:()=>void;
}){
  return (
    <View style={[s.card,{padding:10}]}>
      <Text style={{color:C.text, fontWeight:"600"}}>{label}</Text>
      <View style={[s.row,{marginTop:8}]}>
        <Pressable onPress={()=>onSet("OK")} style={[s.button, status==="OK"? s.buttonPrimary: {}]}>
          <Text style={s.buttonText}>{status==="OK"? "✓ OK" : "Zaznacz ✓"}</Text>
        </Pressable>
        <Pressable onPress={()=>{ onSet("DEFECT"); onMarkDefect(); }} style={[s.button, status==="DEFECT"? s.buttonDanger: {}]}>
          <Text style={s.buttonText}>{status==="DEFECT"? "✗ DEFECT" : "Zaznacz ✗"}</Text>
        </Pressable>
      </View>
      <TextInput style={[s.input,{marginTop:8}]} placeholder="Notatki (opcjonalnie)" placeholderTextColor={C.sub} value={notes} onChangeText={onNotes} />
    </View>
  );
}
