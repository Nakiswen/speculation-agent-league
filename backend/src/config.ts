import * as dotenv from "dotenv";
dotenv.config();

export const config = {
  privateKey: process.env.PRIVATE_KEY || "",
  rpcUrl: process.env.RPC_URL || "https://testnet.monad.xyz",
  leagueAddress: process.env.LEAGUE_ADDRESS || "",
  tokenAddress: process.env.TOKEN_ADDRESS || "",
  port: parseInt(process.env.PORT || "3001", 10),
  epochIntervalMs: parseInt(process.env.EPOCH_INTERVAL_MS || "30000", 10),
};
