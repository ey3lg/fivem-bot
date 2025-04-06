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
  ColorResolvable,
  Events,
  GuildMember,
  TextChannel,
} from "discord.js";

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
import Response from "../../lib/Response";
import Embed from "../../lib/Embed";
class BugReportCommand extends Command {
  constructor(
    context: Command.LoaderContext,
    options: CommandOptions | undefined
  ) {
    super(context, {
      ...options,
      name: "bugreport-submit",
      description: "Submit the bug",
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
          o.setName("bug").setDescription("enter the bug").setRequired(true)
        )
        .addAttachmentOption((o) =>
          o.setName("image").setDescription("Bug image").setRequired(true)
        )
    );
  }

  async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<unknown> {
    await interaction.deferReply({ flags: "Ephemeral" });
    const opt = interaction.options;
    if (!interaction.guild) {
      return await interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Failed to setup the bugreport system, guild is invalid.",
          "error"
        ),
      });
    }
    const data = await db.bugReport.findUnique({
      where: { guildId: interaction.guild.id },
    });
    if (!data) {
      return await interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Bugreport is disabled.",
          "error"
        ),
      });
    }

    const bug = opt.getString("bug");
    const image = opt.getAttachment("image");

    const channel = interaction.guild.channels.cache.get(
      data.channelId
    ) as TextChannel;
    if (!channel) {
      return await interaction.editReply({
        content: await Response.Generate(
          interaction,
          "Bugreport channel is invalid.",
          "error"
        ),
      });
    }

    const embed = await Embed.build(
      "Random",
      "Bug Report",
      interaction.guild.name,
      interaction.guild.iconURL(),
      "`🐞` New Bug",
      `**User:** ${interaction.user} (\`${interaction.user.id}\`)\n**Bug:** \`${bug}\`\n**Image:** [Click Here](${image?.url})`,
      interaction.guild.iconURL()
    );

    await channel.send({ embeds: [embed] });
    return await interaction.editReply({
      content: await Response.Generate(
        interaction,
        "Report submitted successfully.",
        "success"
      ),
    });
  }
}

module.exports = { BugReportCommand };
