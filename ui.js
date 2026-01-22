const{ActionRowBuilder,ButtonBuilder,ButtonStyle,UserSelectMenuBuilder,StringSelectMenuBuilder}=require("discord.js");
module.exports={buildPanelComponents:(g,id,p)=>[
new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId(`srp:${id}:user`)),
new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`srp:${id}:role`).addOptions(
(p.allowedRoleIds||[]).slice(0,25).map(r=>({label:g.roles.cache.get(r)?.name||"role",value:r})) )),
new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`srp:${id}:assign`).setLabel("Assign").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`srp:${id}:remove`).setLabel("Remove").setStyle(ButtonStyle.Danger))
]};