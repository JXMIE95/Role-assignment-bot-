require("dotenv").config();
const{Client,GatewayIntentBits,Events}=require("discord.js");
const{getPanel}=require("./storage");
const{canUsePanel,hierarchyOk}=require("./permissions");
const panelCmd=require("./commands/panel");
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers]});
const state=new Map();
client.on(Events.InteractionCreate,async i=>{
if(i.isChatInputCommand())return panelCmd.execute(i);
if(!i.customId?.startsWith("srp:"))return;
const[,pid,act]=i.customId.split(":");
const panel=getPanel(pid);
if(!panel||!canUsePanel(i.member,panel))return i.reply({content:"No access",ephemeral:true});
if(i.isUserSelectMenu()){state.set(i.user.id,{...state.get(i.user.id),pid,userId:i.values[0]});return i.reply({content:"User set",ephemeral:true});}
if(i.isStringSelectMenu()){state.set(i.user.id,{...state.get(i.user.id),pid,roleId:i.values[0]});return i.reply({content:"Role set",ephemeral:true});}
if(i.isButton()){
const s=state.get(i.user.id);
const m=await i.guild.members.fetch(s.userId);
const r=i.guild.roles.cache.get(s.roleId);
const err=hierarchyOk({guild:i.guild,staffMember:i.member,role:r});
if(err)return i.reply({content:err,ephemeral:true});
if(act==="assign")await m.roles.add(r);
else await m.roles.remove(r);
return i.reply({content:"Done",ephemeral:true});
}});
client.login(process.env.DISCORD_TOKEN);