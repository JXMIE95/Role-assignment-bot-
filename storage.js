const fs=require("fs"),path=require("path");
const d=path.join(process.cwd(),"data"),f=path.join(d,"panels.json");
if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});
if(!fs.existsSync(f))fs.writeFileSync(f,JSON.stringify({panels:{}},null,2));
const load=()=>JSON.parse(fs.readFileSync(f));
module.exports={
getPanel:id=>load().panels[id]||null,
upsertPanel:(id,p)=>{const db=load();db.panels[id]=p;fs.writeFileSync(f,JSON.stringify(db,null,2));},
deletePanel:id=>{const db=load();delete db.panels[id];fs.writeFileSync(f,JSON.stringify(db,null,2));},
listPanelsByGuild:g=>Object.entries(load().panels).filter(([_,p])=>p.guildId===g).map(([id,p])=>({id,...p}))
};