import { type Address, isAddress } from "viem";

export const MAX_TITLE_LENGTH = 36;
export const MAX_COLOR_LENGTH = 24;
export const MAX_NOTE_LENGTH = 128;
export const COLORS = [
  { name: "Basalt", hex: "#36383d" },
  { name: "Moss", hex: "#6f8f63" },
  { name: "Clay", hex: "#c96f45" },
  { name: "Chalk", hex: "#f2ead8" },
  { name: "Tide", hex: "#6aa7a7" },
  { name: "Plum", hex: "#6f5a8d" },
] as const;
export const WEIGHTS = ["Light", "Steady", "Heavy", "Quiet"] as const;

export const pebblePathAbi = [
  {
    type: "event",
    name: "PebbleDropped",
    inputs: [
      { name: "pebbleId", type: "uint256", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "colorName", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "dropPebble",
    stateMutability: "nonpayable",
    inputs: [
      { name: "title", type: "string" },
      { name: "colorName", type: "string" },
      { name: "note", type: "string" },
      { name: "weight", type: "string" },
    ],
    outputs: [{ name: "pebbleId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getPebble",
    stateMutability: "view",
    inputs: [{ name: "pebbleId", type: "uint256" }],
    outputs: [
      { name: "maker", type: "address" },
      { name: "title", type: "string" },
      { name: "colorName", type: "string" },
      { name: "note", type: "string" },
      { name: "weight", type: "string" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextPebbleId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const configuredPebblePathContractAddress =
  process.env.NEXT_PUBLIC_PEBBLE_PATH_CONTRACT_ADDRESS?.trim();

export const pebblePathContractAddress =
  configuredPebblePathContractAddress &&
  !configuredPebblePathContractAddress.includes("replace_with") &&
  isAddress(configuredPebblePathContractAddress)
    ? (configuredPebblePathContractAddress as Address)
    : undefined;
