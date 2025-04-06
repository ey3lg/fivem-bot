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
class WelcomeCommand extends Command {
  constructor(
    context: Command.LoaderContext,
    options: CommandOptions | undefined
  ) {
    super(context, {
      ...options,
      name: "welcome",
      description: "welcome",
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
            .setDescription("Setup the welcome system")
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
            .setDescription("Disable the welcome system")
        )

        .addSubcommand((command) =>
          command.setName("emit").setDescription("Test the welcome system")
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
      case "emit":
        await interaction.deferReply({ flags: "Ephemeral" });
        return await this.runTest(interaction);
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
          "Failed to setup the welcome system, guild is invalid.",
          "error"
        ),
      });
    }
    const data = await db.welcome.findUnique({
      where: { guildId: _interaction.guild.id },
    });

    if (data) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The welcome system is already setuped!",
          "error"
        ),
      });
    }

    await db.welcome.create({
      data: {
        guildId: _interaction.guild.id,
        channelId: channel.id,
      },
    });

    return await _interaction.editReply({
      content: await Response.Generate(
        _interaction,
        "Successfully setuped the welcome system!",
        "success"
      ),
    });
  }

  async runDelete(_interaction: ChatInputCommandInteraction) {
    if (!_interaction.guild) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Failed to setup the welcome system, guild is invalid.",
          "error"
        ),
      });
    }
    const data = await db.welcome.findUnique({
      where: { guildId: _interaction.guild.id },
    });

    if (!data) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The welcome system is not setuped!",
          "error"
        ),
      });
    }

    await db.welcome.delete({
      where: {
        id: data.id,
      },
    });
    return await _interaction.editReply({
      content: await Response.Generate(
        _interaction,
        "Successfully disabled the welcome system!",
        "success"
      ),
    });
  }

  async runTest(_interaction: ChatInputCommandInteraction) {
    const member = _interaction.member;
    if (member && member instanceof GuildMember) {
      await this.container.client.emit(Events.GuildMemberAdd, member);
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Successfully tested the verify system!",
          "success"
        ),
      });
    } else {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Failed to test the welcome system, member is invalid.",
          "error"
        ),
      });
    }
  }
}

module.exports = { WelcomeCommand };
