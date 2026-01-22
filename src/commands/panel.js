// src/commands/panel.js
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
  return arr.filter((x) => x !== id);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Manage staff role panels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)

    // create
    .addSubcommand((sc) =>
      sc
        .setName("create")
        .setDescription("Create a new panel configuration")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Unique id for this panel (e.g. staff-main)")
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Display name for this panel")
            .setRequired(true)
        )
    )

    // delete
    .addSubcommand((sc) =>
      sc
        .setName("delete")
        .setDescription("Delete a panel configuration")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to delete")
            .setRequired(true)
        )
    )

    // list
    .addSubcommand((sc) =>
      sc
        .setName("list")
        .setDescription("List all panels in this server")
    )

    // info
    .addSubcommand((sc) =>
      sc
        .setName("info")
        .setDescription("Show the configuration for a panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to view")
            .setRequired(true)
        )
    )

    // post
    .addSubcommand((sc) =>
      sc
        .setName("post")
        .setDescription("Post a panel message to a channel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to post")
            .setRequired(true)
        )
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Channel to post the panel into")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )

    // settext
    .addSubcommand((sc) =>
      sc
        .setName("settext")
        .setDescription("Set the title and/or text for a panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
        .addStringOption((o) =>
          o
            .setName("title")
            .setDescription("New title (optional)")
            .setRequired(false)
        )
        .addStringOption((o) =>
          o
            .setName("text")
            .setDescription("New text (optional)")
            .setRequired(false)
        )
    )

    // settoggle
    .addSubcommand((sc) =>
      sc
        .setName("settoggle")
        .setDescription("Toggle panel requirements")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
        .addBooleanOption((o) =>
          o
            .setName("require_manage_roles")
            .setDescription("Whether user must have Manage Roles to use the panel")
            .setRequired(true)
        )
    )

    // setlog
    .addSubcommand((sc) =>
      sc
        .setName("setlog")
        .setDescription("Set (or clear) the log channel for a panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
        .addChannelOption((o) =>
          o
            .setName("channel")
            .setDescription("Channel to send logs into (optional)")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
        .addBooleanOption((o) =>
          o
            .setName("none")
            .setDescription("Set true to clear the log channel")
            .setRequired(false)
        )
    )

    // allowrole
    .addSubcommand((sc) =>
      sc
        .setName("allowrole")
        .setDescription("Add a role to the allowed assign/remove list for this panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
        .addRoleOption((o) =>
          o
            .setName("role")
            .setDescription("Role to allow")
            .setRequired(true)
        )
    )

    // disallowrole
    .addSubcommand((sc) =>
      sc
        .setName("disallowrole")
        .setDescription("Remove a role from the allowed list for this panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
        .addRoleOption((o) =>
          o
            .setName("role")
            .setDescription("Role to remove")
            .setRequired(true)
        )
    )

    // clearroles
    .addSubcommand((sc) =>
      sc
        .setName("clearroles")
        .setDescription("Clear the allowed role list for this panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
    )

    // allowstaff
    .addSubcommand((sc) =>
      sc
        .setName("allowstaff")
        .setDescription("Add a staff role allowed to use this panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
        .addRoleOption((o) =>
          o
            .setName("role")
            .setDescription("Staff role to allow")
            .setRequired(true)
        )
    )

    // disallowstaff
    .addSubcommand((sc) =>
      sc
        .setName("disallowstaff")
        .setDescription("Remove a staff role from the allowed-to-use list")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
            .setRequired(true)
        )
        .addRoleOption((o) =>
          o
            .setName("role")
            .setDescription("Staff role to remove")
            .setRequired(true)
        )
    )

    // clearstaff
    .addSubcommand((sc) =>
      sc
        .setName("clearstaff")
        .setDescription("Clear staff role restrictions for this panel")
        .addStringOption((o) =>
          o
            .setName("panel_id")
            .setDescription("Panel id to edit")
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
      const panel = ensurePanelInGuild(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      deletePanel(panelId);
      return interaction.reply({ content: `🗑️ Deleted **${panelId}**.`, ephemeral: true });
    }

    if (sub === "list") {
      const panels = listPanelsByGuild(guild.id);
      if (!panels.length) return interaction.reply({ content: "No panels found.", ephemeral: true });

      const lines = panels.slice(0, 30).map(p =>
        `• **${p.id}** — ${p.name} (allowedRoles: ${p.allowedRoleIds.length}, staffRoles: ${p.staffRoleIds.length})`
      );

      return interaction.reply({ content: `Panels:\n${lines.join("\n")}`, ephemeral: true });
    }

    if (sub === "info") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanelInGuild(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      return interaction.reply({
        content:
          `**${panelId}** — ${panel.name}\n` +
          `Title: ${panel.title}\n` +
          `Text: ${panel.text}\n` +
          `requireManageRoles: ${panel.requireManageRoles}\n` +
          `allowedRoleIds (${panel.allowedRoleIds.length}): ${panel.allowedRoleIds.join(", ") || "none"}\n` +
          `staffRoleIds (${panel.staffRoleIds.length}): ${panel.staffRoleIds.join(", ") || "none"}\n` +
          `logChannelId: ${panel.logChannelId || "none"}`,
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
        content: `**${panel.title || "Staff Role Assignment Panel"}**\n${panel.text || ""}`,
        components
      });

      return interaction.reply({ content: `✅ Posted panel **${panelId}** in ${channel}.`, ephemeral: true });
    }

    if (sub === "settext") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanelInGuild(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      const title = interaction.options.getString("title", false);
      const text = interaction.options.getString("text", false);

      if (title !== null) panel.title = title;
      if (text !== null) panel.text = text;

      upsertPanel(panelId, panel);
      return interaction.reply({ content: `✅ Updated text for **${panelId}**.`, ephemeral: true });
    }

    if (sub === "settoggle") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanelInGuild(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      panel.requireManageRoles = interaction.options.getBoolean("require_manage_roles", true);
      upsertPanel(panelId, panel);

      return interaction.reply({
        content: `✅ **${panelId}** requireManageRoles set to **${panel.requireManageRoles}**.`,
        ephemeral: true
      });
    }

    if (sub === "setlog") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanelInGuild(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      const none = interaction.options.getBoolean("none", false);
      const channel = interaction.options.getChannel("channel", false);

      if (none) panel.logChannelId = null;
      else if (channel) panel.logChannelId = channel.id;

      upsertPanel(panelId, panel);
      return interaction.reply({
        content: `✅ **${panelId}** log channel is now: **${panel.logChannelId ? `<#${panel.logChannelId}>` : "none"}**`,
        ephemeral: true
      });
    }

    if (sub === "allowrole" || sub === "disallowrole" || sub === "clearroles") {
      const panelId = interaction.options.getString("panel_id", true);
      const panel = ensurePanelInGuild(panelId, guild.id);
      if (!panel) return interaction.reply({ content: "Panel not found.", ephemeral: true });

      if (sub === "clearroles") {
        panel.allowedRoleIds = [];
        upsertPanel(panelId, panel);
        return interaction.reply({ content: `✅ Cleared allowed roles for **${panelId}**.`, ephemeral: true });
      }

      const role = interaction.options.getRole("role", true);

      if (role.managed) {
        return interaction.reply({ content: "That role is managed/integration-based and can’t be used.", ephemeral: true });
      }
      if (role.id === guild.id) {
        return interaction.reply({ content: "You can't use @everyone.", ephemeral: true });
      }

      if (sub === "allowrole") {
        panel.allowedRoleIds = addUnique(panel.allowedRoleIds || [], role.id);
        upsertPanel(panelId, panel);

        const warn = panel.allowedRoleIds.length > 25
          ? "\n⚠️ Discord dropdowns can only show 25 roles. Only the first 25 will display."
          : "";

        return interaction.reply({ content: `✅ Allowed ${role} for **${panelId}**.${warn}`, ephemeral: true });
      }

      if (sub === "disallowrole") {
        panel.allowedRoleIds = removeOne(panel.allowedRole
