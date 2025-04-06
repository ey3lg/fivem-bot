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
  Message,
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
    return interaction.customId.startsWith("staffticket:")
      ? this.some()
      : this.none();
  }

  async run(interaction: ButtonInteraction) {
    const action = interaction.customId.split(":")[1].split("-")[0];
    switch (action) {
      case "rename":
        const channel = interaction.channel as TextChannel;
        await interaction.reply({
          content: Response.Generate(
            interaction,
            "Enter the new ticket name!",
            "success"
          ),
          flags: "Ephemeral",
        });
        const filter = (m: Message) => m.author.id === interaction.user.id;
        const collector = channel.createMessageCollector({
          filter,
          time: 60000,
        });
        collector.on("collect", async (m) => {
          await channel.setName(m.content);
          await m.delete();
          await interaction.followUp({
            content: Response.Generate(
              interaction,
              "Ticket name changed!",
              "success"
            ),
            flags: "Ephemeral",
          });
          collector.stop();
        });
        collector.on("end", async () => {
          await interaction.followUp({
            content: Response.Generate(
              interaction,
              "Ticket name change timed out!",
              "error"
            ),
            flags: "Ephemeral",
          });
        });
        break;
      case "adduser":
        await interaction.reply({
          content: Response.Generate(
            interaction,
            "Mention the user",
            "success"
          ),
          flags: "Ephemeral",
        });
        const channel2 = interaction.channel as TextChannel;
        const filter22 = (m2: Message) => m2.author.id === interaction.user.id;
        const collector2 = channel2.createMessageCollector({
          filter: filter22,
          time: 60000,
        });
        collector2.on("collect", async (m2) => {
          const user = m2.mentions.members?.first() as GuildMember;
          if (!user)
            return await interaction.followUp({
              content: Response.Generate(
                interaction,
                "User not found!",
                "error"
              ),
              flags: "Ephemeral",
            });
          await channel2.permissionOverwrites.edit(user, {
            ViewChannel: true,
            SendMessages: true,
          });
          await m2.delete();
          await interaction.followUp({
            content: Response.Generate(
              interaction,
              "User added to ticket!",
              "success"
            ),
            flags: "Ephemeral",
          });
          collector2.stop();
        });
        collector2.on("end", async () => {
          await interaction.followUp({
            content: Response.Generate(
              interaction,
              "User add timed out!",
              "error"
            ),
            flags: "Ephemeral",
          });
        });
        break;
      case "removeuser":
        await interaction.reply({
          content: Response.Generate(
            interaction,
            "Mention the user",
            "success"
          ),
          flags: "Ephemeral",
        });
        const channel3 = interaction.channel as TextChannel;
        const filter33 = (m3: Message) => m3.author.id === interaction.user.id;
        const collector3 = channel3.createMessageCollector({
          filter: filter33,
          time: 60000,
        });
        collector3.on("collect", async (m3) => {
          const user = m3.mentions.members?.first() as GuildMember;
          if (!user)
            return await interaction.followUp({
              content: Response.Generate(
                interaction,
                "User not found!",
                "error"
              ),
              flags: "Ephemeral",
            });
          await channel3.permissionOverwrites.edit(user, {
            ViewChannel: false,
            SendMessages: false,
          });
          await m3.delete();
          await interaction.followUp({
            content: Response.Generate(
              interaction,
              "User removed from ticket!",
              "success"
            ),
            flags: "Ephemeral",
          });
          collector3.stop();
        });
        collector3.on("end", async () => {
          await interaction.followUp({
            content: Response.Generate(
              interaction,
              "User remove timed out!",
              "error"
            ),
            flags: "Ephemeral",
          });
        });
        break;
    }
  }
}

module.exports = { VerifyButton };
