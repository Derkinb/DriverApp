import React from "react";
import { View, Text, Pressable } from "react-native";
import { styles as s, COLORS as C } from "../constants";

export default function PickerSimple({ value, onChange, options }:{ value?:string|null; onChange:(v:string)=>void; options:{label:string,value:string}[] }){
  const safeValue = typeof value === "string" ? value : "";
  return (
    <View>
      {options.map(o=> (
        <Pressable key={o.value} onPress={()=>onChange(o.value)} style={[s.row,{paddingVertical:8}]}>
          <Text style={{color:C.text,flex:1}}>{o.label}</Text>
          <View style={[s.tag,{ borderColor: safeValue===o.value? C.primary: C.border }]}>
            <Text style={[s.tagText,{ color: safeValue===o.value? "#d1fae5": C.sub }]}>{safeValue===o.value?"WYBRANO":"Wybierz"}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
