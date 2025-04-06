import {
  InteractionHandler,
  InteractionHandlerOptions,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ActionRow,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  GuildMember,
  Interaction,
  PermissionsBitField,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  TextChannel,
} from "discord.js";
import Response from "../../lib/Response";
import { PrismaClient } from "@prisma/client";
import Embed from "../../lib/Embed";
const db = new PrismaClient();
class VerifyButton extends InteractionHandler {
  constructor(
    ctx: InteractionHandler.LoaderContext,
    options: InteractionHandlerOptions
  ) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    });
  }

  async parse(interaction: StringSelectMenuInteraction) {
    return interaction.customId.startsWith("ticket:")
      ? this.some()
      : this.none();
  }

  async run(interaction: StringSelectMenuInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" });
    const action = interaction.customId.split(":")[1];

    switch (action) {
      case "category":
        if (
          interaction.guild?.channels.cache.find(
            (ch) =>
              ch instanceof TextChannel &&
              ch.topic?.includes(interaction.user.id)
          )
        ) {
          const channel = interaction.guild?.channels.cache.find(
            (ch) =>
              ch instanceof TextChannel &&
              ch.topic?.includes(interaction.user.id)
          ) as TextChannel;
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              `You already have a ticket open in ${channel}.`,
              "error"
            ),
          });
        }

        const categoryName = interaction.values[0];
        const categoryData = await db.ticket_Categories.findFirst({
          where: {
            guildId: interaction.guildId || "",
            categoryName: categoryName,
          },
        });

        if (!categoryData) {
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              "Category not found.",
              "error"
            ),
          });
        }

        const ticketdata = await db.ticket_Settings.findFirst({
          where: {
            guildId: interaction.guildId || "",
          },
        });

        if (!ticketdata) {
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              "Ticket settings not found.",
              "error"
            ),
          });
        }

        const channel = await interaction.guild?.channels.create({
          name: "ticket-" + interaction.user.username,
          type: ChannelType.GuildText,
          topic: interaction.user.id,
          parent: categoryData.categoryParent,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
            {
              id: ticketdata.staffRoleId,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
              ],
            },
          ],
        });

        const embed = await Embed.build(
          "Random",
          "Ticket Created",
          interaction.guild?.name || " ",
          interaction.guild?.iconURL() || null,
          "`🎫` Ticket Created",
          `**User:** ${interaction.user} (\`${interaction.user.id}\`)\n**Category:** \`${categoryName}\``,
          interaction.guild?.iconURL() || null
        );

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket:close")
            .setLabel("Close")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("ticket:staffmenu-" + ticketdata.staffRoleId)
            .setLabel("Staff Menu")
            .setEmoji("🎓")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("ticket:claim-" + ticketdata.staffRoleId)
            .setLabel("Claim")
            .setEmoji("✋")
            .setStyle(ButtonStyle.Success)
        );

        await channel?.send({
          embeds: [embed],
          components: [row],
          content: `<@${interaction.user.id}> | <@&${ticketdata.staffRoleId}>`,
        });

        return await interaction.editReply({
          content: await Response.Generate(
            interaction,
            `Ticket created in ${channel}.`,
            "success"
          ),
        });
        break;
    }
  }
}

module.exports = { VerifyButton };
