require("dotenv").config();

export const ETHEREUM_RPC = process.env.ETHEREUM_RPC;
export const BINANCE_RPC = process.env.BINANCE_RPC;
export const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
export const SECONDARY_OPENSEA_API_KEY = process.env.SECONDARY_OPENSEA_API_KEY;
export const MORALIS_APP_ID = process.env.MORALIS_APP_ID;
export const MORALIS_SERVER_URL = process.env.MORALIS_SERVER_URL;

export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_NAME = process.env.DB_NAME || "nfts";
export const DB_USER = process.env.DB_USER || "nfts";
export const DB_PASSWORD = process.env.DB_PASSWORD || "local";
export const DB_PORT = parseInt(process.env.DB_PORT) || 5432;

export const API_ONLY = process.env.API_ONLY === "true" ? true : false;
