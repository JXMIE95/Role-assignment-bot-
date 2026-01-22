const {PermissionFlagsBits}=require("discord.js");
module.exports={
canUsePanel:(m,p)=>!p.requireManageRoles||m.permissions.has(PermissionFlagsBits.ManageRoles),
hierarchyOk:({guild,staffMember,role})=>{
const bot=guild.members.me;
if(bot.roles.highest.position<=role.position)return"Bot role too low.";
if(staffMember.roles.highest.position<=role.position)return"Your role too low.";
return null;}
};