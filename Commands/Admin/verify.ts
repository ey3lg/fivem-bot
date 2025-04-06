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
  TextChannel,
} from "discord.js";
import Embed from "../../lib/Embed";
import Response from "../../lib/Response";
class VerifyCommand extends Command {
  constructor(
    context: Command.LoaderContext,
    options: CommandOptions | undefined
  ) {
    super(context, {
      ...options,
      name: "verify",
      description: "verify",
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
            .setDescription("Setup the verify system")
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("The verify channel")
                .setRequired(true)
            )
            .addStringOption((o) =>
              o
                .setName("color")
                .setDescription("Hex color of the embed")
                .setRequired(true)
            )
            .addRoleOption((o) =>
              o
                .setName("role")
                .setDescription("Verified role")
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName("delete")
            .setDescription("Disable the verify system")
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("The verify channel")
                .setRequired(true)
            )
            .addStringOption((o) =>
              o
                .setName("messageid")
                .setDescription("The verify messageid")
                .setRequired(true)
            )
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
      case "delete":
        await interaction.deferReply({ flags: "Ephemeral" });
        return await this.runDelete(interaction);
    }
  }

  async runSetup(_interaction: ChatInputCommandInteraction) {
    const opt = _interaction.options;
    const channel = opt.getChannel("channel") as TextChannel;
    const role = opt.getRole("role");
    const color = opt.getString("color");
    const embedcolor = /^#[0-9A-F]{6}$/i.test(color || "")
      ? (color as ColorResolvable)
      : null;

    if (!embedcolor)
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The embed color is not in hex format.",
          "error"
        ),
      });

    const embed = Embed.build(
      embedcolor,
      "Verify System",
      _interaction.guild?.name || " ",
      _interaction.guild?.iconURL() || null,
      "`✅` Verify system",
      "Click on the `✅ Verify` below to be verified.",
      _interaction.guild?.iconURL() || null
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify:${role?.id}`)
        .setLabel("Verify")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Secondary)
    );

    if (!channel) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The channel is not found.",
          "error"
        ),
      });
    }
    await channel.send({ embeds: [embed], components: [row] });

    return await _interaction.editReply({
      content: await Response.Generate(
        _interaction,
        "Successfully setuped the verify system!",
        "success"
      ),
    });
  }

  async runDelete(_interaction: ChatInputCommandInteraction) {
    const opt = _interaction.options;
    const messageid = opt.getString("messageid");
    const channel = opt.getChannel("channel") as TextChannel;
    if (!messageid) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The message ID is invalid or not provided.",
          "error"
        ),
      });
    }
    const message = await channel.messages.fetch(messageid);
    try {
      await message.delete();
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Successfully disabled the verify system!",
          "success"
        ),
      });
    } catch (e) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The message ID is invalid or not provided.",
          "error"
        ),
      });
    }
  }
}

module.exports = { VerifyCommand };
