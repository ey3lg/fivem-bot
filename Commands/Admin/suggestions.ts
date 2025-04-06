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
class SuggestionCommand extends Command {
  constructor(
    context: Command.LoaderContext,
    options: CommandOptions | undefined
  ) {
    super(context, {
      ...options,
      name: "suggestions",
      description: "suggestions",
      preconditions: ["GuildOnly"],
      requiredUserPermissions: ["Administrator"],
    });
  }

  registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): Awaitable<void> {
    registry.registerChatInputCommand((cmd) =>
      cmd
        .setName(this.name)
        .setDescription(this.description)
        .addSubcommand((command) =>
          command
            .setName("setup")
            .setDescription("Setup the suggestions system")
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("The welcome channel")
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName("disable")
            .setDescription("Disable the suggestions  system")
        )
    );
  }

  async chatInputRun(
    interaction: ChatInputCommandInteraction,
    context: ChatInputCommand.RunContext
  ): Promise<unknown> {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "setup":
        await interaction.deferReply({ flags: "Ephemeral" });
        return await this.runSetup(interaction);
        break;
      case "disable":
        await interaction.deferReply({ flags: "Ephemeral" });
        return await this.runDelete(interaction);
        break;
    }
  }

  async runSetup(_interaction: ChatInputCommandInteraction) {
    const opt = _interaction.options;
    const channel = opt.getChannel("channel") as TextChannel;
    if (!_interaction.guild) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Failed to setup the suggestions system, guild is invalid.",
          "error"
        ),
      });
    }
    const data = await db.suggestions.findUnique({
      where: { guildId: _interaction.guild.id },
    });

    if (data) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The suggestions system is already setuped!",
          "error"
        ),
      });
    }

    await db.suggestions.create({
      data: {
        guildId: _interaction.guild.id,
        channelId: channel.id,
      },
    });

    return await _interaction.editReply({
      content: await Response.Generate(
        _interaction,
        "Successfully setuped the suggestions system!",
        "success"
      ),
    });
  }

  async runDelete(_interaction: ChatInputCommandInteraction) {
    if (!_interaction.guild) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Failed to setup the suggestions system, guild is invalid.",
          "error"
        ),
      });
    }
    const data = await db.suggestions.findUnique({
      where: { guildId: _interaction.guild.id },
    });

    if (!data) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The suggestions system is not setuped!",
          "error"
        ),
      });
    }

    await db.suggestions.delete({
      where: {
        id: data.id,
      },
    });
    return await _interaction.editReply({
      content: await Response.Generate(
        _interaction,
        "Successfully disabled the suggestions system!",
        "success"
      ),
    });
  }
}

module.exports = { SuggestionCommand };
