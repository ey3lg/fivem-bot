import {
  InteractionHandler,
  InteractionHandlerOptions,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import { ButtonInteraction, GuildMember, Interaction } from "discord.js";
import Response from "../../lib/Response";

class VerifyButton extends InteractionHandler {
  constructor(
    ctx: InteractionHandler.LoaderContext,
    options: InteractionHandlerOptions
  ) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  async parse(interaction: ButtonInteraction) {
    return interaction.customId.startsWith("verify:")
      ? this.some()
      : this.none();
  }

  async run(interaction: ButtonInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" });
    const roleId = interaction.customId.split(":")[1];
    const member = interaction.member as GuildMember;
    if (member.roles.cache.has(roleId)) {
      return await interaction.editReply({
        content: await Response.Generate(
          interaction,
          "You are already verified",
          "error"
        ),
      });
    }

    await member.roles.add(roleId);
    return await interaction.editReply({
      content: await Response.Generate(
        interaction,
        "You are now verified",
        "success"
      ),
    });
  }
}

module.exports = { VerifyButton };
