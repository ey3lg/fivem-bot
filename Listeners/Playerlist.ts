import { Listener, ListenerOptions } from "@sapphire/framework";
import Logger from "../lib/Logger";
import { PrismaClient } from "@prisma/client";
import { ChannelType } from "discord.js";
import Fivem from "../lib/Fivem";
import Embed from "../lib/Embed";

const db = new PrismaClient();

class ReadyListener extends Listener {
  constructor(context: Listener.LoaderContext, options?: ListenerOptions) {
    super(context, { ...options, once: true, event: "ready" });
  }

  public async run(...args: unknown[]): Promise<void> {
    await this.updatePlayerList();
    setInterval(() => this.updatePlayerList(), 10000);
  }

  private async updatePlayerList() {
    for (const guild of this.container.client.guilds.cache.values()) {
      const guildSettings = await db.fivem.findFirst({
        where: { guildId: guild.id },
      });

      if (!guildSettings) continue;

      const channel = guild.channels.cache.get(guildSettings.playerlistchannel);
      if (!channel || channel.type !== ChannelType.GuildText) continue;

      const server = new Fivem(guildSettings.ip, Number(guildSettings.port));
      const [players, maxPlayers, status] = await Promise.all([
        server.getPlayers(),
        server.getMaxPlayers(),
        server.getStatus(),
      ]);

      const playerCount = players.length || 0;
      const maxPlayerCount = maxPlayers || 0;
      const statusMessage = status || "OFFLINE";
      const space = Math.round((playerCount / maxPlayerCount) * 100) || 0;

      const playerList =
        players
          .sort((a: any, b: any) => a.id - b.id)
          .map((player) => {
            const discordId =
              player.identifiers
                .find((id: string) => id.startsWith("discord:"))
                ?.replace("discord:", "") || null;
            return `[${player.id}] | ${player.name} | ${
              discordId ? `<@${discordId}>` : "N/A"
            }`;
          })
          .join("\n") || "No players online.";

      const embed = Embed.build(
        "Random",
        "Players List",
        guild.name,
        guild.iconURL() || null,
        `\`📊\` Status: ${statusMessage}\n\`👥\` Players: \`${playerCount}/${maxPlayerCount}\`\n\`🌟\` Space: \`${space}%\``,
        playerList,
        guild.iconURL() || null
      );

      const messagee = await db.fivem_playerlist_message.findFirst({
        where: { guildId: guild.id },
      });

      if (messagee) {
        const msg = await channel.messages
          .fetch(messagee.messageId)
          .catch(() => null);
        if (msg) {
          await msg.edit({ embeds: [embed] });
        } else {
          await this.sendNewPlayerListMessage(channel, embed, guild.id);
        }
      } else {
        await this.sendNewPlayerListMessage(channel, embed, guild.id);
      }
    }
  }

  private async sendNewPlayerListMessage(
    channel: any,
    embed: any,
    guildId: string
  ) {
    const sentMessage = await channel.send({ embeds: [embed] });
    await db.fivem_playerlist_message.create({
      data: {
        guildId: guildId,
        channelId: channel.id,
        messageId: sentMessage.id,
      },
    });
  }
}

export default ReadyListener;
