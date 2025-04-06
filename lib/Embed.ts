import { ColorResolvable, EmbedBuilder } from "discord.js";
class Embed {
  build(
    color: ColorResolvable | null,
    systemName: string,
    guildName: string,
    guildLogo: string | null,
    title: string,
    description: string,
    thumbnail: string | null
  ): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(color)
      .setAuthor({
        name: `${guildName} | ${systemName}`,
        iconURL: guildLogo || undefined,
      })
      .setThumbnail(thumbnail)
      .setDescription(description)
      .setTitle(title)
      .setFooter({
        text: `© Developed by eyalgreen`,
        iconURL: guildLogo || undefined,
      });
  }
}

export default new Embed();
