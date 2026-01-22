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

/* helpers */

function defaultPanel(guildId, name) {
  return {
    guildId,
    name,
    title: "Staff Role Assignment Panel",
    text: "Pick a user and role, then assign or remove.",
    allowedRoleIds: [],
    staffRoleIds: [],
    requireManageRoles: true,
    logChannelId: null
  };
}

function ensurePanel(panelId, guildId) {
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

/* command */

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Manage staff role assignment panels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    .addSubcommand(sc =>
      sc.setName("create")
        .setDescription("Create a new panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Unique panel id (e.g. staff-main)")
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
        .setDescription("Delete a panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id to delete")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("list")
        .setDescription("List panels in this server")
    )

    .addSubcommand(sc =>
      sc.setName("info")
        .setDescription("View panel configuration")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("post")
        .setDescription("Post a panel in a channel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id")
            .setRequired(true)
        )
        .addChannelOption(o =>
          o.setName("channel")
            .setDescription("Channel to post the panel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("settext")
        .setDescription("Set panel title and text")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id")
            .setRequired(true)
        )
        .addStringOption(o =>
          o.setName("title")
            .setDescription("Panel title")
            .setRequired(false)
        )
        .addStringOption(o =>
          o.setName("text")
            .setDescription("Panel text")
            .setRequired(false)
        )
    )

    .addSubcommand(sc =>
      sc.setName("settoggle")
        .setDescription("Toggle panel requirements")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id")
            .setRequired(true)
        )
        .addBooleanOption(o =>
          o.setName("require_manage_roles")
            .setDescription("Require Manage Roles permission")
            .setRequired(true)
        )
    )

    .addSubcommand(sc =>
      sc.setName("allowrole")
        .setDescription("Allow a role to be assigned by this panel")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id")
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
        .setDescription("Remove an allowed role")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id")
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
        .setDescription("Clear allowed roles list")
        .addStringOption(o =>
          o.setName("panel_id")
            .setDescription("Panel id")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) {
      return interaction.reply({ content: "Server only.", ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    /* CREATE */
    if (sub === "create") {
      const panelId = interaction.options.getString("panel_id", true);
      const name = interaction.options.getString("name", true);

      if (getPanel(panelId)) {
        return interaction.reply({ content: "Panel already exists.", ephemeral: true });
      }

      upsertPanel(panelId, defaultPanel(guild.id, name));
      return interaction.reply({ content: `✅ Created panel **${panelId}**.`, ephemeral: true });
    }

    /* DELETE */
    if (sub === "delete") {
      const panelId = interaction.options.getString("panel_id", true);
      if (!ensurePanel(panelId, guild.id)) {
        return interaction.reply({ content: "Panel not found.", ephemeral: true });
      }

      deletePanel(panelId);
      return interaction.reply({ content: `🗑️ Deleted **${panelId}**.`, ephemeral: true });
    }

    /* LIST */
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

    /* INFO */
    if (sub === "info") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanel(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      return interaction.reply({
        content:
          `**${panelId}** — ${panel.name}\n` +
          `Title: ${panel.title}\n` +
          `Text: ${panel.text}\n` +
          `Allowed roles: ${panel.allowedRoleIds.length}\n` +
          `Require Manage Roles: ${panel.requireManageRoles}`,
        ephemeral: true
      });
    }

    /* POST */
    if (sub === "post") {
      const panelId = interaction.options.getString("panel_id", true);
      const channel = interaction.options.getChannel("channel", true);
      const panel = ensurePanel(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      await channel.send({
        content: `**${panel.title}**\n${panel.text}`,
        components: buildPanelComponents(guild, panelId, panel)
      });

      return interaction.reply({ content: "✅ Panel posted.", ephemeral: true });
    }

    /* SETTEXT */
    if (sub === "settext") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanel(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      const title = interaction.options.getString("title");
      const text = interaction.options.getString("text");

      if (title !== null) panel.title = title;
      if (text !== null) panel.text = text;

      upsertPanel(panelId, panel);
      return interaction.reply({ content: "✅ Updated panel text.", ephemeral: true });
    }

    /* SETTOGGLE */
    if (sub === "settoggle") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanel(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      panel.requireManageRoles = interaction.options.getBoolean("require_manage_roles", true);
      upsertPanel(panelId, panel);

      return interaction.reply({ content: "✅ Updated panel toggle.", ephemeral: true });
    }

    /* ROLE MANAGEMENT */
    if (sub === "allowrole" || sub === "disallowrole" || sub === "clearroles") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanel(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      if (sub === "clearroles") {
        panel.allowedRoleIds = [];
        upsertPanel(panelId, panel);
        return interaction.reply({ content: "✅ Cleared allowed roles.", ephemeral: true });
      }

      const role = interaction.options.getRole("role", true);

      if (sub === "allowrole") {
        addUnique(panel.allowedRoleIds, role.id);
      } else {
        panel.allowedRoleIds = removeOne(panel.allowedRoleIds, role.id);
      }

      upsertPanel(panelId, panel);
      return interaction.reply({ content: "✅ Updated allowed roles.", ephemeral: true });
    }
  }
};
