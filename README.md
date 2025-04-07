# Fivem Discord Bot

**Fivem Discord Bot** built with **TypeScript**
## 🚀 Features
- ⚡ **Custom Discord Bot**: A flexible, easy-to-extend bot template.
- 🛠️ **Built with TypeScript**: Type safety and modern features for a smooth development experience.
- 🔄 **Modular Architecture**: Supports various modules for events, commands, and more.
- 🔗 **Seamless Database Integration**: Works with **[Prisma](https://www.prisma.io/)** for efficient database management.
- 🧩 **SapphireJS Framework**: Designed to provide a clean and scalable architecture.
- ⚡ **Efficient and Lightweight**: Built on **[Discord.js](https://discord.js.org/)** for powerful interactions with the Discord API.
## 💻 Installation

- Clone the repository:

```bash
git clone https://github.com/ey3lg/discord-bot-template.git
```

- Change `.env-example` to `.env`

and set your **discord bot token** there.

- Install the dependencies:
```
npm install
```
- Start the bot:
```
npx ts-node bot.ts
```

## 📊 Repo Stats

### GitHub Stats for fivem-bot

[![GitHub Stats](https://github-readme-stats.vercel.app/api?username=ey3lg&repo=fivem-bot&show_icons=true&hide_title=true&hide=prs&count_private=true&theme=radical)](https://github.com/ey3lg/fivem-bot)

### Most Used Languages

[![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=ey3lg&repo=fivem-bot&layout=compact&theme=radical)](https://github.com/ey3lg/fivem-bot)

## 🔗 Links

- [Discord.js Documentation](https://discord.js.org/#/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [SapphireJS Documentation](https://github.com/sapphiredev/framework)
- [TypeScript Documentation](https://www.typescriptlang.org/)

# 🧩 Creating a New Command

This guide explains how to create a new slash command using the Sapphire framework, Prisma, buttons, and utility classes like `Embed` and `Response`.

---

## 1. Create the Command File

In the `commands/` directory (e.g. `commands/utility/`), create a new TypeScript file for your command: 

2. Base Command Structure

Use this basic structure for a slash command:

```ts

import {
  Command,
  CommandOptions,
  ApplicationCommandRegistry,
  ChatInputCommandInteraction
} from "@sapphire/framework";

class YourCommand extends Command {
  constructor(context: Command.LoaderContext, options?: CommandOptions) {
    super(context, {
      ...options,
      name: "your-command",
      description: "Description here",
    });
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        // Add options below
    );
  }

  async chatInputRun(interaction: ChatInputCommandInteraction) {
    // Command logic here
  }
}

module.exports = { YourCommand };

```

3. Add Slash Command Options

You can add options like strings, users, integers, etc.

```ts
.addStringOption((option) =>
  option
    .setName("suggest")
    .setDescription("Enter your suggestion")
    .setRequired(true)
)
```



## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Get Involved
Feel free to open issues or contribute to the project. Pull requests are always welcome! ✨

- Report Bugs: Open an issue for bugs or improvements.

- Contribute: Fork the repo, create a new branch, and submit a pull request. We'd love to have you contribute! 🤝

