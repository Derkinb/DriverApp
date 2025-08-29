import * as Print from "expo-print"; import * as Sharing from "expo-sharing";
import { ChecklistItem, Defect, DriverProfile, Truck } from "./types"; import { escapeHtml } from "./storage";
export const MANAGER_LABEL = "Transport Manager";
export function generateDailyHTML(opts:{ date:string; profile:DriverProfile; truck?:Truck; odoStart:string; fuelLevel:string; items:ChecklistItem[]; leftCols:string[]; rightCols:string[]; defects:Defect[]; }){
  const { date, profile, truck, odoStart, fuelLevel, items, leftCols, rightCols, defects } = opts;
  const rowFor=(label:string)=>{ const it=items.find(x=>x.label===label); const mark = it?.status==="DEFECT"?"✗": it?.status==="OK"?"✓":""; return `<tr><td class="chk-item">${escapeHtml(label)}</td><td class="box">${mark}</td></tr>`; };
  const leftRows=leftCols.map(rowFor).join(""); const rightRows=rightCols.map(rowFor).join("");
  const defectsText = defects.length? defects.map(d=>`• ${escapeHtml(d.area)} — ${escapeHtml(d.description||"(brak opisu)")}`).join("<br/>"): "NIL";
  return `<html><head><meta charset="utf-8"/><style>body{font-family:-apple-system,Roboto,Arial;padding:24px}.title{font-size:18px;font-weight:700}.grid{width:100%;border:2px solid #000;border-collapse:collapse}.grid td,.grid th{border:1px solid #000;padding:6px;font-size:12px;vertical-align:top}.top-row td{font-weight:700}.small{font-size:11px}.cols{width:100%}.col{width:50%}.chk-item{width:100%}.box{width:24px;text-align:center;font-weight:700}.section-title{font-weight:700;font-size:12px;background:#eee;padding:4px;border:1px solid #000}.muted{color:#555}.sig{height:50px}</style></head><body>
  <table class="grid" style="margin-bottom:6px;"><tr class="top-row"><td class="title">DAILY CHECK / DEFECT REPORT</td><td>Odometer (start):</td><td>${escapeHtml(odoStart)}</td><td>Fuel level (start):</td><td>${escapeHtml(fuelLevel)}</td></tr>
  <tr><td>Driver's Name:</td><td colspan="2">${escapeHtml(profile.name||"")}</td><td>Vehicle Reg:</td><td>${escapeHtml(truck?.reg||"")}</td></tr><tr><td>Date:</td><td colspan="4">${escapeHtml(date)}</td></tr></table>
  <div class="section-title">DAILY CHECK ✓ or ✗ WHEN CHECKED</div><table class="grid cols"><tr><td class="col"><table class="grid" style="width:100%">${leftRows}</table></td><td class="col"><table class="grid" style="width:100%">${rightRows}</table></td></tr></table>
  <div class="section-title">No Defects Write Nil Here:</div><div class="grid small" style="border-top:none; padding:8px 6px;">${defectsText}</div>
  <table class="grid" style="margin-top:8px;"><tr><td style="width:50%">Report defects here:</td><td>Defect assessment and rectification:</td></tr>
  <tr><td style="height:80px" class="small">${defects.map(d=>`<div>• ${escapeHtml(d.area)} — ${escapeHtml(d.description||"")}</div>`).join("")}</td><td></td></tr>
  <tr><td class="sig">Driver's Signature:</td><td>Reported to (manager): ${escapeHtml(MANAGER_LABEL)}</td></tr></table>
  <div class="small muted" style="margin-top:6px;">* if applicable • ** FORS-related items</div></body></html>`;
}
export async function sharePdfToFiles(html:string, filename:string){ const {uri}=await Print.printToFileAsync({html}); const can=await Sharing.isAvailableAsync(); if(can){ await Sharing.shareAsync(uri,{dialogTitle:`${filename}.pdf`,mimeType:"application/pdf",UTI:"com.adobe.pdf"});} else { throw new Error(`PDF wygenerowany: ${uri} (Udostępnianie nieobsługiwane)`);}}
