import {
  ApplicationCommandRegistry,
  Awaitable,
  ChatInputCommand,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import { PrismaClient } from "@prisma/client";
import Response from "../../lib/Response";
import Embed from "../../lib/Embed";

const db = new PrismaClient();

class SuggestionsCommand extends Command {
  constructor(context: Command.LoaderContext, options?: CommandOptions) {
    super(context, {
      ...options,
      name: "suggestions-submit",
      description: "Submit a suggestion",
      preconditions: ["GuildOnly"],
      requiredUserPermissions: ["SendMessages"],
    });
  }

  registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    registry.registerChatInputCommand((cmd) =>
      cmd
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((o) =>
          o
            .setName("suggest")
            .setDescription("Enter your suggestion")
            .setRequired(true)
        )
    );
  }

  async chatInputRun(
    interaction: ChatInputCommandInteraction
  ): Promise<unknown> {
    await interaction.deferReply({ ephemeral: true });

    if (!interaction.guild) {
      return interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Invalid guild.",
          "error"
        ),
      });
    }

    const data = await db.suggestions.findUnique({
      where: { guildId: interaction.guild.id },
    });
    if (!data) {
      return interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Suggestions are disabled.",
          "error"
        ),
      });
    }

    const suggest = interaction.options.getString("suggest")!;
    const channel = interaction.guild.channels.cache.get(
      data.channelId
    ) as TextChannel;
    if (!channel) {
      return interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Invalid suggestions channel.",
          "error"
        ),
      });
    }

    const embed = await Embed.build(
      "Random",
      "Suggestions",
      interaction.guild.name,
      interaction.guild.iconURL(),
      "`💡` New Suggestion",
      `**User:** ${interaction.user} (\`${interaction.user.id}\`)\n**Suggest:** \`${suggest}\``,
      interaction.guild.iconURL()
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`suggestions:v`)
        .setLabel("0")
        .setEmoji("👍")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`suggestions:x`)
        .setLabel("0")
        .setEmoji("👎")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`suggestions:view`)
        .setLabel("View Voters")
        .setStyle(ButtonStyle.Secondary)
    );

    const message = await channel.send({ embeds: [embed], components: [row] });

    await db.suggestion_Messages.create({
      data: { guildId: interaction.guild.id, messageId: message.id },
    });

    return interaction.editReply({
      content: await Response.Generate(
        interaction,
        "Suggestion submitted successfully.",
        "success"
      ),
    });
  }
}

module.exports = { SuggestionsCommand };
