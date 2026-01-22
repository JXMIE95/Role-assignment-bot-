require("dotenv").config();
const { REST, Routes } = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

console.log("🔧 Deploy starting...");
console.log("CLIENT_ID present:", Boolean(CLIENT_ID));
console.log("TOKEN present:", Boolean(TOKEN));

if (!TOKEN || !CLIENT_ID) {
  throw new Error("Missing DISCORD_TOKEN or CLIENT_ID. Set them in Railway Variables.");
}

const panelCommand = require("./commands/panel");
const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: [panelCommand.data.toJSON()]
    });
    console.log("✅ Deployed global /panel command.");
  } catch (err) {
    console.error("❌ Deploy failed:", err);
    process.exit(1);
  }
})();