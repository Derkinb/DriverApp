import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, ScrollView, Platform } from "react-native";
import { styles as s, COLORS as C } from "../constants";


export default function LoginScreen({ onLogin }:{ onLogin:(email:string,pass:string)=>void }){
  const [email,setEmail] = useState("admin@demo.com");
  const [pass,setPass] = useState("admin");
  return (
    <SafeAreaView style={[s.screen,s.safe]}>
      <View style={s.header}><Text style={s.headerTitle}>KierowcaApp {Platform.OS==='ios'?'':'⚙︎'} — Logowanie</Text></View>
      <ScrollView style={s.container}>
        <View style={s.card}><Text style={{color:C.text,fontSize:16,fontWeight:"700"}}>Zaloguj się</Text>
          <Text style={[s.label,{marginTop:10}]}>E-mail</Text>
          <TextInput autoCapitalize="none" keyboardType="email-address" style={s.input} value={email} onChangeText={setEmail} placeholder="email" placeholderTextColor={C.sub} />
          <Text style={[s.label,{marginTop:10}]}>Hasło</Text>
          <TextInput secureTextEntry style={s.input} value={pass} onChangeText={setPass} placeholder="hasło" placeholderTextColor={C.sub} />
          <View style={{height:12}} />
          <Pressable onPress={()=>onLogin(email,pass)} style={[s.button,s.buttonPrimary]}><Text style={s.buttonText}>Zaloguj</Text></Pressable>
          <View style={{height:8}} />
          <Text style={{color:C.sub,fontSize:12}}>Demo: admin@demo.com / admin, driver1@demo.com / driver</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
