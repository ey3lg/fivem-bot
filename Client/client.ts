import {
  ApplicationCommandRegistries,
  RegisterBehavior,
  SapphireClient,
} from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";

class Client extends SapphireClient {
  constructor() {
    super({
      intents: Object.values(GatewayIntentBits) as number[],
      partials: Object.values(Partials) as number[],
    });
  }

  public async login(token: string): Promise<string> {
    ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(
      RegisterBehavior.BulkOverwrite
    );
    return super.login(token);
  }
}

export default Client;
