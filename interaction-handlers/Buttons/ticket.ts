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
  EmbedBuilder,
  GuildMember,
  Interaction,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";
import Response from "../../lib/Response";
import { PrismaClient } from "@prisma/client";
import Embed from "../../lib/Embed";
const db = new PrismaClient();
import { createTranscript } from "discord-html-transcripts";
class VerifyButton extends InteractionHandler {
  constructor(
    ctx: InteractionHandler.LoaderContext,
    options: InteractionHandlerOptions
  ) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  async parse(interaction: ButtonInteraction) {
    return interaction.customId.startsWith("ticket:")
      ? this.some()
      : this.none();
  }

  async run(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" });
    const action = interaction.customId.split(":")[1].split("-")[0];

    switch (action) {
      case "select":
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

        if (!interaction.guildId) {
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              "Guild not found.",
              "error"
            ),
          });
        }

        const ticketcategories = await db.ticket_Categories.findMany({
          where: {
            guildId: interaction.guildId,
          },
        });

        if (ticketcategories.length === 0) {
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              "No ticket categories found.",
              "error"
            ),
          });
        }

        const select =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("ticket:category")
              .setPlaceholder("Select a category")
              .addOptions(
                ticketcategories.map((category) => ({
                  label: category.categoryName,
                  value: category.categoryName,
                }))
              )
          );

        const embed = await Embed.build(
          "Random",
          "Ticket Select",
          interaction.guild?.name || " ",
          interaction.guild?.iconURL() || null,
          "`🎫` Ticket System",
          "Select a category to open a ticket.",
          interaction.guild?.iconURL() || null
        );

        await interaction.editReply({
          embeds: [embed],
          components: [select],
        });
        break;
      case "close":
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

        const channel = interaction.channel as TextChannel;
        const topic = channel.topic;

        if (!topic) {
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              "Ticket not found.",
              "error"
            ),
          });
        }

        const transcript = await createTranscript(channel, {
          limit: -1,
          saveImages: true,
          filename: `${channel.name}.html`,
        });

        const embed2 = await Embed.build(
          "Random",
          "Ticket Closed",
          interaction.guild?.name || " ",
          interaction.guild?.iconURL() || null,
          "`🎫` Ticket Closed",
          `**User:** ${interaction.user} (\`${
            interaction.user.id
          }\`)\n**Created by:** <@${topic}> (\`${topic}\`)\n**Closed at:** <t:${Math.floor(
            Date.now() / 1000
          )}:R>\n**Created at:** <t:${Math.floor(
            channel.createdTimestamp / 1000
          )}:R>`,
          interaction.guild?.iconURL() || null
        );

        const logChannel = interaction.guild?.channels.cache.find(
          (ch) => ch.id === ticketdata.logsChannelId
        ) as TextChannel;
        if (logChannel) {
          await logChannel.send({
            embeds: [embed2],
            files: [transcript],
          });
        }
        const countdownMessage = await channel.send({
          content: `Ticket will be deleted in 5 seconds.`,
        });

        for (let i = 5; i > 0; i--) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await countdownMessage.edit({
            content: `Ticket will be deleted in ${i} seconds.`,
          });
        }

        await countdownMessage.delete();
        await channel.delete();

        break;

      case "staffmenu":
        const member = interaction.member as GuildMember;
        const staffRoleId = interaction.customId.split("-")[1];
        if (!member.roles.cache.has(staffRoleId)) {
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              "You do not have permission to use this button.",
              "error"
            ),
          });
        }
        const embed3 = await Embed.build(
          "Random",
          "Ticket Staff Menu",
          interaction.guild?.name || " ",
          interaction.guild?.iconURL() || null,
          "`🎫` Ticket Staff Menu",
          `Click on the buttons below to manage the ticket.`,
          interaction.guild?.iconURL() || null
        );
        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("staffticket:rename")
            .setLabel("Rename")
            .setEmoji("✏️")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("staffticket:adduser")
            .setLabel("Add User")
            .setEmoji("➕")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("staffticket:removeuser")
            .setLabel("Remove User")
            .setEmoji("➖")
            .setStyle(ButtonStyle.Primary)
        );

        return await interaction.editReply({
          embeds: [embed3],
          components: [row2],
        });
        break;
      case "claim":
        const member2 = interaction.member as GuildMember;
        const staffRoleId2 = interaction.customId.split("-")[1];
        if (!member2.roles.cache.has(staffRoleId2)) {
          return await interaction.editReply({
            content: await Response.Generate(
              interaction,
              "You do not have permission to use this button.",
              "error"
            ),
          });
        }
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("ticket:close")
            .setLabel("Close")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("ticket:staffmenu-" + staffRoleId2)
            .setLabel("Staff Menu")
            .setEmoji("🎓")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("ticket:claim-" + staffRoleId2)
            .setLabel("Claimed by " + interaction.user.username)
            .setDisabled(true)
            .setEmoji("✋")
            .setStyle(ButtonStyle.Success)
        );

        const channel2 = interaction.channel as TextChannel;
        await channel2.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Green")
              .setDescription(
                `Ticket claimed by ${interaction.user} (\`${interaction.user.id}\`)`
              ),
          ],
        });

        await interaction.message.edit({
          components: [row],
        });

        return await interaction.editReply({
          content: await Response.Generate(
            interaction,
            "Ticket claimed.",
            "success"
          ),
        });
        break;
    }
  }
}

module.exports = { VerifyButton };
