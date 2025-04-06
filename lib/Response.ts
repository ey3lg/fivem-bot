import {
  BaseInteraction,
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  Message,
  StringSelectMenuInteraction,
} from "discord.js";

class Res {
  Generate(
    interaction:
      | CommandInteraction
      | ButtonInteraction
      | StringSelectMenuInteraction,
    response: string,
    type: string
  ): string {
    return (
      response
        .split(" ")
        .map((word, i) => (i % 2 === 0 ? `**${word}**` : word))
        .join(" ") + ` \`${type === "success" ? "✅" : "❌"}\``
    );
  }
}

export default new Res();
