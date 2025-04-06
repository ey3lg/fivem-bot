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
  CategoryChannel,
  ChannelType,
  ChatInputCommandInteraction,
  ColorResolvable,
  Role,
  TextChannel,
} from "discord.js";
import Embed from "../../lib/Embed";
import Response from "../../lib/Response";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

class TicketCommand extends Command {
  constructor(
    context: Command.LoaderContext,
    options: CommandOptions | undefined
  ) {
    super(context, {
      ...options,
      name: "ticket",
      description: "ticket",
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
            .setDescription("Setup the ticket system")
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("The ticket channel")
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
                .setName("staffrole")
                .setDescription("Staff role")
                .setRequired(true)
            )
            .addChannelOption((o) =>
              o
                .setName("logschannel")
                .setDescription("The logs channel")
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName("delete")
            .setDescription("Disable the ticket system")
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("The verify channel")
                .setRequired(true)
            )
            .addStringOption((o) =>
              o
                .setName("messageid")
                .setDescription("The verify message ID")
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName("add-category")
            .setDescription("Add a category to the ticket system")
            .addChannelOption((o) =>
              o
                .setName("category")
                .setDescription("The parent")
                .setRequired(true)
                .addChannelTypes([ChannelType.GuildCategory])
            )
            .addStringOption((o) =>
              o.setName("name").setDescription("name").setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName("remove-category")
            .setDescription("Remove a category from the ticket system")
            .addStringOption((o) =>
              o.setName("name").setDescription("name").setRequired(true)
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
      case "delete":
        await interaction.deferReply({ flags: "Ephemeral" });
        return await this.runDelete(interaction);
      case "add-category":
        await interaction.deferReply({ flags: "Ephemeral" });
        return await this.runAddCategory(interaction);
      case "remove-category":
        await interaction.deferReply({ flags: "Ephemeral" });
        return await this.runRemoveCategory(interaction);
    }
  }

  async runSetup(_interaction: ChatInputCommandInteraction) {
    const opt = _interaction.options;
    const channel = opt.getChannel("channel") as TextChannel;
    const logschannel = opt.getChannel("logschannel") as TextChannel;
    const staffole = opt.getRole("staffrole") as Role;
    const color = opt.getString("color");
    const embedcolor = /^#[0-9A-F]{6}$/i.test(color || "")
      ? (color as ColorResolvable)
      : null;

    if (!embedcolor) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The embed color is not in hex format.",
          "error"
        ),
      });
    }

    const embed = Embed.build(
      embedcolor,
      "Ticket System",
      _interaction.guild?.name || " ",
      _interaction.guild?.iconURL() || null,
      "`🎫` Ticket system",
      "Click on the `🎫 Create ticket` below to create a ticket.",
      _interaction.guild?.iconURL() || null
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket:select`)
        .setLabel("Create ticket")
        .setEmoji("🎫")
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

    if (!_interaction.guildId) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Guild ID is not available.",
          "error"
        ),
      });
    }

    const data = await db.ticket_Settings.findFirst({
      where: {
        guildId: _interaction.guildId,
      },
    });

    if (!logschannel) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The logs channel is not found.",
          "error"
        ),
      });
    }

    if (data) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The ticket system is already set up.",
          "error"
        ),
      });
    }

    await db.ticket_Settings.create({
      data: {
        guildId: _interaction.guildId,
        logsChannelId: logschannel.id,
        staffRoleId: staffole?.id,
      },
    });
    await channel.send({ embeds: [embed], components: [row] });

    return await _interaction.editReply({
      content: await Response.Generate(
        _interaction,
        "Successfully set up the ticket system!",
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
    if (!_interaction.guildId) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Guild ID is not available.",
          "error"
        ),
      });
    }

    try {
      const data = await db.ticket_Settings.findFirst({
        where: {
          guildId: _interaction.guildId,
        },
      });

      if (!data) {
        return await _interaction.editReply({
          content: await Response.Generate(
            _interaction,
            "The ticket system is not set up.",
            "error"
          ),
        });
      }

      await db.ticket_Settings.delete({
        where: {
          id: data.id,
        },
      });
      const message = await channel.messages.fetch(messageid);
      await message.delete();
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Successfully disabled the ticket system!",
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

  async runAddCategory(_interaction: ChatInputCommandInteraction) {
    const opt = _interaction.options;
    const name = opt.getString("name");
    const category = opt.getChannel("category") as CategoryChannel;
    if (!category) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The category is not found.",
          "error"
        ),
      });
    }
    if (!name) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The name is invalid or not provided.",
          "error"
        ),
      });
    }

    if (!_interaction.guildId) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Guild ID is not available.",
          "error"
        ),
      });
    }

    try {
      const data = await db.ticket_Categories.findFirst({
        where: {
          guildId: _interaction.guildId,
          categoryName: name,
        },
      });

      if (data) {
        return await _interaction.editReply({
          content: await Response.Generate(
            _interaction,
            "The category is already added",
            "error"
          ),
        });
      }

      await db.ticket_Categories.create({
        data: {
          guildId: _interaction.guildId,
          categoryName: name,
          categoryParent: category.id,
        },
      });

      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Successfully added the category!",
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

  async runRemoveCategory(_interaction: ChatInputCommandInteraction) {
    const opt = _interaction.options;
    const name = opt.getString("name");
    if (!_interaction.guildId) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Guild ID is not available.",
          "error"
        ),
      });
    }
    if (!name) {
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "The name is invalid or not provided.",
          "error"
        ),
      });
    }

    try {
      const data = await db.ticket_Categories.findFirst({
        where: {
          guildId: _interaction.guildId,
          categoryName: name,
        },
      });

      if (!data) {
        return await _interaction.editReply({
          content: await Response.Generate(
            _interaction,
            "The category is not found",
            "error"
          ),
        });
      }

      await db.ticket_Categories.delete({
        where: {
          id: data.id,
        },
      });
      return await _interaction.editReply({
        content: await Response.Generate(
          _interaction,
          "Successfully deleted the category!",
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

module.exports = { TicketCommand };
