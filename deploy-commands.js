require("dotenv").config();
const{REST,Routes}=require("discord.js");
const cmd=require("./commands/panel");
new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN)
.put(Routes.applicationGuildCommands(process.env.CLIENT_ID,process.env.GUILD_ID),{body:[cmd.data.toJSON()]})
.then(()=>console.log("Deployed"));