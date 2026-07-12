# Pebble Path Deployment Notes

App Name: Pebble Path
Tagline: Drop a pebble
Description: Drop a small memory pebble with color, note, wallet, and time on Base, then load any pebble by ID.

## Required env

```bash
NEXT_PUBLIC_BASE_APP_ID=6a0bf2e36b7916c4b40951b5
NEXT_PUBLIC_BUILDER_CODE=bc_s6zob3vw
NEXT_PUBLIC_PEBBLE_PATH_CONTRACT_ADDRESS=0x1f744b710fb11172747f524a4a323352a12c5579
BASE_RPC_URL=replace_with_rpc_url
```

## Order

1. Add Base App ID after Base.dev shows it.
2. Link and deploy with the Vercel token in `Vercel.txt`.
3. Run `npm run deploy:contract`.
4. Add `NEXT_PUBLIC_PEBBLE_PATH_CONTRACT_ADDRESS` to Vercel Production.
5. Add Builder Code after Base.dev shows it.
6. Deploy again with `vercel --prod --token=...`.
