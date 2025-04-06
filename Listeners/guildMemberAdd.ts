import { Listener, ListenerOptions } from "@sapphire/framework";
import Logger from "../lib/Logger";
import { PrismaClient } from "@prisma/client";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  GuildMember,
  TextChannel,
} from "discord.js";
import Embed from "../lib/Embed";
const db = new PrismaClient();
class GuildMemberAddListener extends Listener {
  constructor(
    context: Listener.LoaderContext,
    options: ListenerOptions | undefined
  ) {
    super(context, { ...options, event: "guildMemberAdd" });
  }
  async run(member: GuildMember): Promise<void> {
    const welcomedata = await db.welcome.findUnique({
      where: {
        guildId: member.guild.id,
      },
    });

    if (!welcomedata) return;

    const channel = member.guild.channels.cache.get(
      welcomedata.channelId
    ) as TextChannel;
    if (!channel) return;

    const embed = Embed.build(
      "Random",
      "Welcome System",
      member.guild.name,
      member.user.displayAvatarURL(),
      "`👋` Welcome",
      `Hey ${member}\nWelcome to \`${member.guild.name}\``,
      member.user.displayAvatarURL()
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`membercount`)
        .setLabel(`Members: ${member.guild.memberCount}`)
        .setEmoji("👥")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );
    await channel.send({ embeds: [embed], components: [row] });
  }
}

export default GuildMemberAddListener;
