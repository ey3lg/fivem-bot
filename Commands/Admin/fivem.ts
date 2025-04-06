import {
  ApplicationCommandRegistry,
  Awaitable,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  ChannelType,
  ChatInputCommandInteraction,
  TextChannel,
} from "discord.js";
import Embed from "../../lib/Embed";
import Response from "../../lib/Response";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

class FivemCommand extends Command {
  constructor(context: Command.LoaderContext, options?: CommandOptions) {
    super(context, {
      ...options,
      name: "fivem",
      description: "fivem",
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
            .setDescription("Setup the fivem system")
            .addStringOption((o) =>
              o
                .setName("ip")
                .setDescription("The fivem server ip")
                .setRequired(true)
            )
            .addStringOption((o) =>
              o
                .setName("port")
                .setDescription("The fivem server port")
                .setRequired(true)
            )
            .addChannelOption((o) =>
              o
                .setName("channel")
                .setDescription("the fivem channel")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand((command) =>
          command.setName("delete").setDescription("Disable the fivem system")
        )
    );
  }

  async chatInputRun(
    interaction: ChatInputCommandInteraction
  ): Promise<unknown> {
    await interaction.deferReply({ flags: "Ephemeral" });
    return this[
      interaction.options.getSubcommand() === "setup" ? "runSetup" : "runDelete"
    ](interaction);
  }

  async runSetup(interaction: ChatInputCommandInteraction) {
    const ip = interaction.options.getString("ip", true);
    const port = interaction.options.getString("port", true);
    const channel = interaction.options.getChannel(
      "channel"
    ) as TextChannel | null;

    if (!channel || !this.validateInputs(ip, port)) {
      return await this.replyError(interaction, "Invalid inputs.");
    }

    if (!interaction.guild) {
      return await this.replyError(interaction, "The guild is not available.");
    }

    const serverExists = await db.fivem.findFirst({
      where: { guildId: interaction.guild.id },
    });
    if (serverExists) {
      return await this.replyError(interaction, "The server is already setup.");
    }

    await db.fivem.create({
      data: {
        guildId: interaction.guild.id,
        ip,
        port,
        playerlistchannel: channel.id,
      },
    });

    return await interaction.editReply({
      content: await Response.Generate(
        interaction,
        "Successfully setup the verify system!",
        "success"
      ),
    });
  }

  async runDelete(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      return await this.replyError(interaction, "The guild is not available.");
    }

    const server = await db.fivem.findFirst({
      where: { guildId: interaction.guild.id },
    });
    if (!server) {
      return await this.replyError(
        interaction,
        "The fivem system is not setup."
      );
    }
    const messagee = await db.fivem_playerlist_message.findFirst({
      where: { guildId: interaction.guild.id },
    });

    if (messagee) {
      const channel = interaction.guild.channels.cache.get(
        server.playerlistchannel
      ) as TextChannel;
      if (channel) {
        try {
          const msg = await channel.messages.fetch(messagee.messageId);
          if (msg) {
            await msg.delete();
          }
        } catch (error) {
          console.error(error);
        }
      }
    }
    await db.fivem.delete({ where: { id: server.id } });
    if (messagee) {
      await db.fivem_playerlist_message.delete({
        where: { id: messagee.id },
      });
    }

    return await interaction.editReply({
      content: await Response.Generate(
        interaction,
        "Successfully disabled the verify system!",
        "success"
      ),
    });
  }

  private async replyError(
    interaction: ChatInputCommandInteraction,
    message: string
  ) {
    return await interaction.editReply({
      content: await Response.Generate(interaction, message, "error"),
    });
  }

  private validateInputs(ip: string, port: string): boolean {
    const ipRegex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const portRegex = /^[0-9]{1,5}$/;

    return ipRegex.test(ip) && portRegex.test(port);
  }
}

module.exports = { FivemCommand };
