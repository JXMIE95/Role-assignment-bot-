// src/index.js
require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");

const { getPanel } = require("./storage");
const { canUsePanel, hierarchyOk } = require("./permissions");
const panelCmd = require("./commands/panel");

// ✅ No privileged intents needed (fixes "Used disallowed intents")
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// per-staff selection state: staffId -> { pid, userId, roleId }
const state = new Map();

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (i) => {
  try {
    // Slash command router
    if (i.isChatInputCommand()) {
      if (i.commandName === "panel") return panelCmd.execute(i);
      return;
    }

    // Panel components
    if (!i.customId?.startsWith("srp:")) return;

    // srp:<panelId>:<action>
    const parts = i.customId.split(":");
    if (parts.length !== 3) return;

    const pid = parts[1];
    const act = parts[2];

    const panel = getPanel(pid);
    if (!panel || panel.guildId !== i.guild?.id) {
      return i.reply({ content: "This panel config no longer exists.", ephemeral: true });
    }

    if (!canUsePanel(i.member, panel)) {
      return i.reply({ content: "No access.", ephemeral: true });
    }

    // User select
    if (i.isUserSelectMenu() && act === "user") {
      const userId = i.values[0];
      const prev = state.get(i.user.id) || {};
      state.set(i.user.id, { ...prev, pid, userId });

      return i.reply({ content: `User set: <@${userId}>`, ephemeral: true });
    }

    // Role select (StringSelect in this bot)
    if (i.isStringSelectMenu() && act === "role") {
      const roleId = i.values[0];

      // Extra safety: only roles allowed by this panel
      if (!panel.allowedRoleIds?.includes(roleId)) {
        return i.reply({ content: "That role isn't allowed for this panel.", ephemeral: true });
      }

      const prev = state.get(i.user.id) || {};
      state.set(i.user.id, { ...prev, pid, roleId });

      return i.reply({ content: `Role set: <@&${roleId}>`, ephemeral: true });
    }

    // Buttons assign/remove
    if (i.isButton() && (act === "assign" || act === "remove")) {
      const s = state.get(i.user.id);

      if (!s || s.pid !== pid || !s.userId || !s.roleId) {
        return i.reply({ content: "Pick a user and role first (for this panel).", ephemeral: true });
      }

      const guild = i.guild;
      if (!guild) return i.reply({ content: "Server only.", ephemeral: true });

      const member = await guild.members.fetch(s.userId).catch(() => null);
      const role = guild.roles.cache.get(s.roleId);

      if (!member) return i.reply({ content: "Couldn't find that user.", ephemeral: true });
      if (!role) return i.reply({ content: "Couldn't find that role.", ephemeral: true });

      const err = hierarchyOk({ guild, staffMember: i.member, role });
      if (err) return i.reply({ content: err, ephemeral: true });

      if (act === "assign") {
        await member.roles.add(role, `Staff panel ${pid} by ${i.user.tag} (${i.user.id})`);
        return i.reply({ content: `✅ Added <@&${role.id}> to <@${member.id}>`, ephemeral: true });
      } else {
        await member.roles.remove(role, `Staff panel ${pid} by ${i.user.tag} (${i.user.id})`);
        return i.reply({ content: `🗑️ Removed <@&${role.id}> from <@${member.id}>`, ephemeral: true });
      }
    }
  } catch (e) {
    console.error(e);
    if (i.isRepliable() && !i.replied) {
      await i.reply({ content: "❌ Error.", ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);