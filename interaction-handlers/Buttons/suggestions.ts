import {
  InteractionHandler,
  InteractionHandlerOptions,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import Response from "../../lib/Response";
import { PrismaClient } from "@prisma/client";
import Embed from "../../lib/Embed";

const db = new PrismaClient();

class SuggestionHandler extends InteractionHandler {
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
    return interaction.customId.startsWith("suggestions:")
      ? this.some()
      : this.none();
  }

  async run(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" });

    if (!interaction.guild) {
      return interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Guild not found",
          "error"
        ),
      });
    }

    const [_, action] = interaction.customId.split(":");

    const suggestion = await db.suggestion_Messages.findUnique({
      where: {
        messageId: interaction.message.id,
        guildId: interaction.guild.id,
      },
    });

    if (!suggestion) {
      return interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Suggestion not found",
          "error"
        ),
      });
    }

    if (action === "v" || action === "x") {
      const existingVote = await db.suggestions_Votes.findUnique({
        where: {
          messageId: interaction.message.id,
          userId: interaction.user.id,
        },
      });

      if (existingVote) {
        if (existingVote.voteType === action) {
          await db.suggestions_Votes.delete({ where: { id: existingVote.id } });
        } else {
          await db.suggestions_Votes.update({
            where: { id: existingVote.id },
            data: { voteType: action },
          });
        }
      } else {
        await db.suggestions_Votes.create({
          data: {
            guildId: interaction.guild.id,
            messageId: interaction.message.id,
            userId: interaction.user.id,
            voteType: action,
          },
        });
      }

      const upVotes = await db.suggestions_Votes.count({
        where: { messageId: interaction.message.id, voteType: "v" },
      });
      const downVotes = await db.suggestions_Votes.count({
        where: { messageId: interaction.message.id, voteType: "x" },
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`suggestions:v`)
          .setLabel(`${upVotes}`)
          .setEmoji("👍")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`suggestions:x`)
          .setLabel(`${downVotes}`)
          .setEmoji("👎")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`suggestions:view`)
          .setLabel("View Voters")
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.message.edit({ components: [row] });
      return interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Vote updated.",
          "success"
        ),
      });
    }

    if (action === "view") {
      const voters = await db.suggestions_Votes.findMany({
        where: { messageId: interaction.message.id },
        select: { userId: true, voteType: true },
      });

      if (voters.length === 0) {
        return interaction.editReply({
          content: await Response.Generate(
            interaction,
            "No votes yet.",
            "info"
          ),
        });
      }

      const upVoters =
        voters
          .filter((v) => v.voteType === "v")
          .map((v) => `<@${v.userId}>`)
          .join(", ") || "None";
      const downVoters =
        voters
          .filter((v) => v.voteType === "x")
          .map((v) => `<@${v.userId}>`)
          .join(", ") || "None";

      const embed = Embed.build(
        "Random",
        "Suggestion Votes",
        interaction.guild.name,
        interaction.guild.iconURL() || null,
        "`💡` Suggestion Votes",
        `**__Upvotes:__**\n${upVoters}\n\n**__Downvotes:__**\n${downVoters}`,
        interaction.guild.iconURL() || null
      );
      return interaction.editReply({
        embeds: [embed],
      });
    }
  }
}

module.exports = { SuggestionHandler };
