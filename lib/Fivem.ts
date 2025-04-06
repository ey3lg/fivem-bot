import axios, { AxiosError } from "axios";

class Fivem {
  private axiosInstance;

  constructor(private ip: string, private port: number) {
    if (!ip || !port) {
      throw new Error("IP and port are required.");
    }
    this.axiosInstance = axios.create({
      baseURL: `http://${this.ip}:${this.port}/`,
      timeout: 5000,
    });
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(endpoint);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof AxiosError) {
      throw new Error(`${error.message}`);
    }
    throw new Error(`${String(error)}`);
  }

  async getPlayers(): Promise<any[]> {
    return this.fetch<any[]>("players.json").catch(() => []);
  }

  async getMaxPlayers(): Promise<number> {
    const data = await this.fetch<{ vars: { sv_maxClients: number } }>(
      "info.json"
    );
    return data.vars.sv_maxClients || 0;
  }

  async getStatus(): Promise<string> {
    try {
      await this.fetch("info.json");
      return "ONLINE";
    } catch {
      return "OFFLINE";
    }
  }
}

export default Fivem;
