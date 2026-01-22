const{SlashCommandBuilder}=require("discord.js");
const{upsertPanel,getPanel}=require("../storage");
module.exports={
data:new SlashCommandBuilder().setName("panel").setDescription("Create panel")
.addSubcommand(s=>s.setName("create").addStringOption(o=>o.setName("panel_id").setRequired(true))),
async execute(i){
const id=i.options.getString("panel_id");
upsertPanel(id,{guildId:i.guild.id,name:id,allowedRoleIds:[],staffRoleIds:[],requireManageRoles:true});
i.reply({content:"Panel created",ephemeral:true});
}};