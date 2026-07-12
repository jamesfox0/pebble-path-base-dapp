"use client";

import { Check, CircleDot, Loader2, Map, Search, Send, Shell, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { parseEventLogs, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  COLORS,
  MAX_COLOR_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
  WEIGHTS,
  pebblePathAbi,
  pebblePathContractAddress,
} from "@/lib/pebble-path";

const PRESETS = [
  { title: "First step", colorName: "Moss", note: "A small mark for the thing that finally moved today.", weight: "Light" },
  { title: "Clear ask", colorName: "Tide", note: "One request, one reply, no extra noise around it.", weight: "Steady" },
  { title: "Hard lesson", colorName: "Clay", note: "A rough edge worth keeping visible for the next build.", weight: "Heavy" },
] as const;

function shortAddress(address?: Address) {
  if (!address || address === "0x0000000000000000000000000000000000000000") return "--";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(value?: bigint) {
  if (!value) return "--";
  return new Date(Number(value) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function friendlyError(error: unknown) {
  if (!(error instanceof Error)) return "Transaction was cancelled.";
  if (error.message.includes("User rejected")) return "Request cancelled in wallet.";
  if (error.message.includes("Invalid title")) return "Title needs 1 to 36 characters.";
  if (error.message.includes("Invalid color")) return "Choose a color.";
  if (error.message.includes("Invalid note")) return "Note needs 1 to 128 characters.";
  if (error.message.includes("Invalid weight")) return "Choose a weight.";
  return error.message;
}

function colorFor(name: string) {
  return COLORS.find((color) => color.name === name)?.hex ?? COLORS[0].hex;
}

function PebbleCard({ title, colorName, note, weight, maker, createdAt }: {
  title: string;
  colorName: string;
  note: string;
  weight: string;
  maker?: Address;
  createdAt?: bigint;
}) {
  return (
    <article className="pebble-card" style={{ "--pebble-color": colorFor(colorName) } as React.CSSProperties}>
      <div className="rake-lines"><span /><span /><span /><span /></div>
      <div className="stone"><Shell /><strong>{weight || "Stone"}</strong></div>
      <div className="stone-copy">
        <p>{colorName || "Color"}</p>
        <h2>{title || "Untitled pebble"}</h2>
        <blockquote>{note || "Drop a memory pebble on Base."}</blockquote>
      </div>
      <footer>
        <div><span>Maker</span><strong>{shortAddress(maker)}</strong></div>
        <div><span>Dropped</span><strong>{formatDate(createdAt)}</strong></div>
      </footer>
    </article>
  );
}

export function PebblePathApp() {
  const [pebbleIdInput, setPebbleIdInput] = useState("1");
  const [title, setTitle] = useState<string>(PRESETS[0].title);
  const [colorName, setColorName] = useState<string>(PRESETS[0].colorName);
  const [note, setNote] = useState<string>(PRESETS[0].note);
  const [weight, setWeight] = useState<string>(PRESETS[0].weight);
  const [message, setMessage] = useState("Drop one memory pebble on Base and load any pebble by ID.");
  const [lastAction, setLastAction] = useState<"drop" | null>(null);

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync } = useDisconnect();
  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
    } catch {}
  }
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: hash, writeContractAsync, isPending: writing } = useWriteContract();
  const { data: receipt, isLoading: confirming } = useWaitForTransactionReceipt({ hash });
  const selectedConnector = connectors.find((connector) => connector.id === "injected") ?? connectors.find((connector) => connector.id === "baseAccount") ?? connectors[0];
  const parsedPebbleId = BigInt(Math.max(1, Number(pebbleIdInput || "1")));

  const pebbleQuery = useReadContract({
    abi: pebblePathAbi,
    address: pebblePathContractAddress,
    functionName: "getPebble",
    args: [parsedPebbleId],
    query: { enabled: Boolean(pebblePathContractAddress), refetchInterval: 12000 },
  });
  const totalQuery = useReadContract({
    abi: pebblePathAbi,
    address: pebblePathContractAddress,
    functionName: "nextPebbleId",
    query: { enabled: Boolean(pebblePathContractAddress), refetchInterval: 12000 },
  });

  const tuple = pebbleQuery.data as readonly [Address, string, string, string, string, bigint] | undefined;
  const livePebble = useMemo(() => tuple ? {
    maker: tuple[0],
    title: tuple[1],
    colorName: tuple[2],
    note: tuple[3],
    weight: tuple[4],
    createdAt: tuple[5],
  } : undefined, [tuple]);

  const totalPebbles = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;
  const validFields =
    title.trim().length > 0 &&
    title.trim().length <= MAX_TITLE_LENGTH &&
    colorName.trim().length > 0 &&
    colorName.trim().length <= MAX_COLOR_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_NOTE_LENGTH &&
    weight.trim().length > 0;
  const dropBlocker = !pebblePathContractAddress
    ? "Contract not deployed yet. Run npm run deploy:contract, then add NEXT_PUBLIC_PEBBLE_PATH_CONTRACT_ADDRESS."
    : !isConnected
      ? "Connect wallet first."
      : chainId !== base.id
        ? "Switch to Base first."
        : !validFields
          ? "Fill title, color, note, and weight."
          : "";

  useEffect(() => {
    if (!receipt || lastAction !== "drop") return;
    void totalQuery.refetch();
    void pebbleQuery.refetch();
    const logs = parseEventLogs({ abi: pebblePathAbi, logs: receipt.logs, eventName: "PebbleDropped" });
    const pebbleId = logs[0]?.args.pebbleId;
    window.setTimeout(() => {
      if (pebbleId) setPebbleIdInput(pebbleId.toString());
      setMessage(pebbleId ? `Pebble #${pebbleId.toString()} dropped on Base.` : "Pebble dropped on Base.");
    }, 0);
  }, [lastAction, receipt, totalQuery, pebbleQuery]);

  async function connectWallet() {
    const queue = [connectors.find((connector) => connector.id === "injected"), connectors.find((connector) => connector.id === "baseAccount"), selectedConnector]
      .filter((connector): connector is NonNullable<typeof selectedConnector> => Boolean(connector))
      .filter((connector, index, list) => list.findIndex((item) => item.id === connector.id) === index);
    if (!queue.length) {
      setMessage("No wallet connector found. Open this app inside Base App or a wallet browser.");
      return;
    }
    let lastError: unknown;
    setMessage("Opening wallet connection...");
    for (const connector of queue) {
      try {
        await connectAsync({ connector });
        setMessage("Wallet connected. Drop the pebble when ready.");
        return;
      } catch (error) {
        lastError = error;
      }
    }
    setMessage(friendlyError(lastError));
  }

  async function dropPebble() {
    const contractAddress = pebblePathContractAddress;
    if (dropBlocker) {
      setMessage(dropBlocker);
      return;
    }
    if (!contractAddress) return;
    try {
      setLastAction("drop");
      setMessage("Confirm the Pebble Path drop in your wallet.");
      await writeContractAsync({
        address: contractAddress,
        abi: pebblePathAbi,
        functionName: "dropPebble",
        args: [title.trim(), colorName.trim(), note.trim(), weight.trim()],
        chainId: base.id,
      });
      setMessage("Pebble sent. Waiting for Base confirmation...");
    } catch (error) {
      setMessage(friendlyError(error));
    }
  }

  function applyPreset(index: number) {
    const preset = PRESETS[index];
    setTitle(preset.title);
    setColorName(preset.colorName);
    setNote(preset.note);
    setWeight(preset.weight);
  }

  return (
    <main className="pebble-shell">
      <section className="pebble-hero">
        <div className="hero-mark"><CircleDot /><div><p>Pebble Path</p><h1>Drop a pebble.</h1></div></div>
        <div className="hero-count"><span>Pebbles</span><strong>{totalPebbles}</strong><span>Base</span></div>
      </section>

      <section className="path-grid">
        <div className="drop-panel">
          <div className="panel-head"><Map /><div><p>Stone table</p><strong>{isConnected ? shortAddress(address) : "Connect to drop"}</strong></div></div>
          <div className="preset-row">{PRESETS.map((preset, index) => <button key={preset.title} type="button" onClick={() => applyPreset(index)}>{preset.title}</button>)}</div>
          <label><span>Title</span><input value={title} maxLength={MAX_TITLE_LENGTH} onChange={(event) => setTitle(event.target.value)} /></label>
          <label><span>Note</span><textarea value={note} maxLength={MAX_NOTE_LENGTH} onChange={(event) => setNote(event.target.value)} /></label>
          <div className="color-row">{COLORS.map((item) => <button key={item.name} className={colorName === item.name ? "active" : ""} style={{ "--swatch": item.hex } as React.CSSProperties} type="button" onClick={() => setColorName(item.name)}><span />{item.name}</button>)}</div>
          <div className="weight-row">{WEIGHTS.map((item) => <button key={item} className={weight === item ? "active" : ""} type="button" onClick={() => setWeight(item)}>{weight === item ? <Check /> : <CircleDot />}{item}</button>)}</div>
          <div className="actions">
            {!isConnected ? (
              <button className="connect" disabled={connecting} onClick={connectWallet}>{connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Connect wallet</button>
            ) : chainId !== base.id ? (
              <button className="connect" disabled={switching} onClick={() => switchChain({ chainId: base.id })}>{switching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}Switch to Base</button>
            ) : (
              <button className="disconnect" onClick={disconnectWallet}>{shortAddress(address)}</button>
            )}
            <button className="drop" disabled={writing || confirming} onClick={dropPebble}>{writing || confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Drop on Base</button>
          </div>
          <p className="message">{message}</p>
        </div>

        <div className="path-panel">
          <PebbleCard title={livePebble?.title || title} colorName={livePebble?.colorName || colorName} note={livePebble?.note || note} weight={livePebble?.weight || weight} maker={livePebble?.maker} createdAt={livePebble?.createdAt} />
          <section className="lookup"><div><Search /><h2>Load pebble</h2></div><label><span>Pebble ID</span><input value={pebbleIdInput} onChange={(event) => setPebbleIdInput(event.target.value.replace(/\D/g, ""))} /></label></section>
          <section className="about"><Shell /><strong>Pebble Path keeps a tiny memory, color, weight, wallet, and timestamp visible on Base.</strong></section>
        </div>
      </section>
    </main>
  );
}
