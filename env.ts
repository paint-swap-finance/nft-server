require('dotenv').config();

export const ETHEREUM_RPC = process.env.ETHEREUM_RPC;
export const MORALIS_APP_ID = process.env.MORALIS_APP_ID;
export const MORALIS_SERVER_URL = process.env.MORALIS_SERVER_URL;

export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_USER = process.env.DB_USER || "local";
export const DB_PASSWORD = process.env.DB_PASSWORD || "local";
export const DB_PORT = parseInt(process.env.DB_PORT) || 5432;