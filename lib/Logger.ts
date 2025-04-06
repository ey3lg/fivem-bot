import chalk from "chalk";
import moment from "moment";

class log {
  private typeMap = new Map([
    ["error", { color: chalk.red.bold, label: "[ERROR]" }],
    ["info", { color: chalk.cyan.bold, label: "[INFO]" }],
    ["warn", { color: chalk.yellow.bold, label: "[WARN]" }],
    ["success", { color: chalk.green.bold, label: "[SUCCESS]" }],
  ]);
  private format(type: string, message: string): string {
    const data = this.typeMap.get(type);
    const time = moment().format("DD/MM/YYYY HH:mm:ss");
    return data
      ? chalk.grey.bold(`[${time}] `) + data.color(`${data.label} ${message}`)
      : chalk.grey.bold(`[${time}] `) + chalk.white.bold(message);
  }
  private log(message: string, type: string): void {
    console.log(this.format(type, message));
  }

  error(message: string): void {
    this.log(message, "error");
  }

  success(message: string): void {
    this.log(message, "success");
  }

  warn(message: string): void {
    this.log(message, "warn");
  }

  info(message: string): void {
    this.log(message, "info");
  }
}

export default new log();
