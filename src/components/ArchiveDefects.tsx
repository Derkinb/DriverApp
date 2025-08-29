import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Defect } from "../types";
import { styles as s, COLORS as C } from "../constants";

export default function ArchiveDefects({ defects }:{ defects: Defect[] }){
  const [open,setOpen] = useState(false);
  if(defects.length===0) return null;
  return (
    <View style={s.card}>
      <Pressable onPress={()=>setOpen(o=>!o)} style={[s.row]}>
        <Text style={{color:C.text,fontWeight:"700"}}>Archiwum defektów ({defects.length})</Text>
        <View style={s.tag}><Text style={s.tagText}>{open? "Schowaj" : "Pokaż"}</Text></View>
      </Pressable>
      {open && defects.map(df=> (
        <View key={df.id} style={[s.card,{padding:12}]}> 
          <View style={s.row}><Text style={{color:C.text,fontWeight:"700"}}>{df.area}</Text><View style={s.tag}><Text style={s.tagText}>{new Date(df.time).toLocaleString()}</Text></View></View>
          <Text style={{color:C.sub,marginTop:6}}>{df.description || "(brak opisu)"}</Text>
          <View style={[s.row,{marginTop:10}]}> 
            <View style={s.tag}><Text style={s.tagText}>Status: {df.status}</Text></View>
            <View style={s.tag}><Text style={s.tagText}>ARCHIWUM</Text></View>
          </View>
        </View>
      ))}
    </View>
  );
}
