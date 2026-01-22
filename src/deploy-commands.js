const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

const {
  getPanel,
  upsertPanel,
  deletePanel,
  listPanelsByGuild
} = require("../storage");

const { buildPanelComponents } = require("../ui");

function defaultPanel(guildId, name) {
  return {
    guildId,
    name,
    title: "Staff Role Assignment Panel",
    text: "Pick a user + role, then assign/remove.",
    allowedRoleIds: [],
    staffRoleIds: [],
    requireManageRoles: true,
    logChannelId: null
  };
}

function ensurePanelInGuild(panelId, guildId) {
  const panel = getPanel(panelId);
  if (!panel || panel.guildId !== guildId) return null;
  return panel;
}

function addUnique(arr, id) {
  if (!arr.includes(id)) arr.push(id);
  return arr;
}

function removeOne(arr, id) {
  return arr.filter(x => x !== id);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Manage staff role panels.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(sc =>
      sc.setName("create")
        .setDescription("Create a new panel config")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Unique panel identifier (e.g. staff-main)")
            .setRequired(true)
        )
        .addStringOption(o =>
          o.setName("name")
            .setDescription("Display name for the panel")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("delete")
        .setDescription("Delete a panel config")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("list")
        .setDescription("List panels in this server")
    )

    .addSubcommand(sc =>
      sc.setName("info")
        .setDescription("Show config for a panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("post")
        .setDescription("Post a panel to a channel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addChannelOption(o =>
          o.setName("channel")
            .setDescription("Channel to post the panel in")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("settext")
        .setDescription("Set the panel title and/or text")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addStringOption(o =>
          o.setName("title")
            .setDescription("New panel title")
            .setRequired(false)
        )
        .addStringOption(o =>
          o.setName("text")
            .setDescription("New panel body text")
            .setRequired(false)
        )
    )

    .addSubcommand(sc =>
      sc.setName("settoggle")
        .setDescription("Toggle panel requirements")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addBooleanOption(o =>
          o.setName("require_manage_roles")
            .setDescription("Require Manage Roles permission")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("setlog")
        .setDescription("Set or clear the log channel for this panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addChannelOption(o =>
          o.setName("channel")
            .setDescription("Log channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addBooleanOption(o =>
          o.setName("none")
            .setDescription("Clear the log channel")
            .setRequired(false)
        )
    )

    .addSubcommand(sc =>
      sc.setName("allowrole")
        .setDescription("Allow a role to be managed by this panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName("role")
            .setDescription("Role to allow")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("disallowrole")
        .setDescription("Remove a role from the allowed list")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName("role")
            .setDescription("Role to remove")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("clearroles")
        .setDescription("Clear all allowed roles for this panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("allowstaff")
        .setDescription("Allow a staff role to use this panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName("role")
            .setDescription("Staff role to allow")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("disallowstaff")
        .setDescription("Remove a staff role from the allowed list")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
        .addRoleOption(o =>
          o.setName("role")
            .setDescription("Staff role to remove")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("clearstaff")
        .setDescription("Clear all staff role restrictions")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel identifier")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: "Server only.", ephemeral: true });

    if (sub === "create") {
      const panelId = interaction.options.getString("panel_id", true);
      const name = interaction.options.getString("name", true);
      if (getPanel(panelId)) {
        return interaction.reply({ content: "That panel_id already exists.", ephemeral: true });
      }
      upsertPanel(panelId, defaultPanel(guild.id, name));
      return interaction.reply({ content: `✅ Created panel **${panelId}**.`, ephemeral: true });
    }

    if (sub === "delete") {
      const panelId = interaction.options.getString("panel_id", true);
      if (!ensurePanelInGuild(panelId, guild.id)) {
        return interaction.reply({ content: "Panel not found.", ephemeral: true });
      }
      deletePanel(panelId);
      return interaction.reply({ content: `🗑️ Deleted **${panelId}**.`, ephemeral: true });
    }

    if (sub === "list") {
      const panels = listPanelsByGuild(guild.id);
      if (!panels.length) {
        return interaction.reply({ content: "No panels found.", ephemeral: true });
      }
      return interaction.reply({
        content: panels.map(p => `• **${p.id}** — ${p.name}`).join("\n"),
        ephemeral: true
      });
    }

    if (sub === "post") {
      const panelId = interaction.options.getString("panel_id", true);
      const channel = interaction.options.getChannel("channel", true);
      const panel = ensurePanelInGuild(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      const components = buildPanelComponents(guild, panelId, panel);
      await channel.send({
        content: `**${panel.title}**\n${panel.text}`,
        components
      });

      return interaction.reply({ content: "✅ Panel posted.", ephemeral: true });
    }

    return interaction.reply({ content: "Done.", ephemeral: true });
  }
};
