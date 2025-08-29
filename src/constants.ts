import { StyleSheet } from "react-native";
export const COLORS = { bg:"#0f172a", card:"#111827", border:"#1f2937", text:"#e5e7eb", sub:"#9ca3af", primary:"#22c55e", danger:"#ef4444" };
export const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.bg}, safe:{flex:1},
  header:{padding:16,borderBottomWidth:1,borderBottomColor:COLORS.border},
  headerTitle:{color:COLORS.text,fontSize:20,fontWeight:"700"},
  container:{flex:1,padding:16},
  card:{backgroundColor:COLORS.card,borderRadius:16,borderWidth:1,borderColor:COLORS.border,padding:16,marginBottom:16},
  row:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:12},
  input:{color:COLORS.text,backgroundColor:"#0b1220",borderWidth:1,borderColor:COLORS.border,borderRadius:10,paddingHorizontal:12,paddingVertical:10},
  label:{color:COLORS.sub,fontSize:12,marginBottom:6},
  button:{paddingVertical:12,paddingHorizontal:14,borderRadius:12,borderWidth:1,borderColor:COLORS.border,alignItems:"center"},
  buttonPrimary:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
  buttonDanger:{backgroundColor:COLORS.danger,borderColor:COLORS.danger},
  buttonText:{color:"#000",fontWeight:"700"},
  tabs:{flexDirection:"row",paddingHorizontal:8,paddingVertical:8,gap:8,borderBottomWidth:1,borderBottomColor:COLORS.border},
  tab:{flex:1,paddingVertical:10,borderRadius:10,alignItems:"center",borderWidth:1,borderColor:COLORS.border},
  tabActive:{backgroundColor:COLORS.card,borderColor:COLORS.primary},
  tabText:{color:COLORS.text,fontWeight:"600"},
  tag:{paddingVertical:6,paddingHorizontal:10,backgroundColor:"#0b1220",borderRadius:999,borderWidth:1,borderColor:COLORS.border},
  tagText:{color:COLORS.sub,fontSize:12}
});
