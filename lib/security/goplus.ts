export interface GoPlusTokenSecurity {
  isHoneypot: boolean | null;
  buyTax: number | null;
  sellTax: number | null;
  ownerAddress: string | null;
  ownerBalance: string | null;
  creatorAddress: string | null;
  isMintable: boolean | null;
  canBlacklist: boolean | null;
  canPause: boolean | null;
  isProxy: boolean | null;
  hiddenOwner: boolean | null;
  personalSlippageModifiable: boolean | null;
  selfdestruct: boolean | null;
  failOpen: boolean | null;
  slippageModifiable: boolean | null;
  hasExternalCall: boolean | null;
  isAntiWhale: boolean | null;
  tradingCooldown: boolean | null;
  transferPausable: boolean | null;
  isTrueToken: boolean | null;
  isWhitelisted: boolean | null;
  isBlacklisted: boolean | null;
  holderCount: number | null;
  totalSupply: string | null;
  lpTotalSupply: string | null;
  lpHolderCount: number | null;
}

interface GoPlusResponse {
  code: number;
  message: string;
  result: Record<string, Record<string, string>>;
}

const GOPLUS_API = "https://api.gopluslabs.io/api/v1/token_security";

export async function fetchTokenSecurity(chainId: number, address: string): Promise<GoPlusTokenSecurity> {
  const url = `${GOPLUS_API}/${chainId}?contract_addresses=${address}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return emptyResult();

    const data: GoPlusResponse = await res.json();
    if (data.code !== 1 || !data.result) return emptyResult();

    const item = data.result[address.toLowerCase()];
    if (!item) return emptyResult();

    return {
      isHoneypot: parseBool(item.is_honeypot),
      buyTax: parseNumber(item.buy_tax),
      sellTax: parseNumber(item.sell_tax),
      ownerAddress: item.owner_address || null,
      ownerBalance: item.owner_balance || null,
      creatorAddress: item.creator_address || null,
      isMintable: parseBool(item.is_mintable),
      canBlacklist: parseBool(item.can_take_back_ownership),
      canPause: parseBool(item.transfer_pausable),
      isProxy: parseBool(item.is_proxy),
      hiddenOwner: parseBool(item.hidden_owner),
      personalSlippageModifiable: parseBool(item.personal_slippage_modifiable),
      selfdestruct: parseBool(item.selfdestruct),
      failOpen: parseBool(item.external_call),
      slippageModifiable: parseBool(item.slippage_modifiable),
      hasExternalCall: parseBool(item.external_call),
      isAntiWhale: parseBool(item.is_anti_whale),
      tradingCooldown: parseBool(item.trading_cooldown),
      transferPausable: parseBool(item.transfer_pausable),
      isTrueToken: parseBool(item.is_true_token),
      isWhitelisted: parseBool(item.is_whitelisted),
      isBlacklisted: parseBool(item.is_blacklisted),
      holderCount: parseNumber(item.holder_count),
      totalSupply: item.total_supply || null,
      lpTotalSupply: item.lp_total_supply || null,
      lpHolderCount: parseNumber(item.lp_holder_count),
    };
  } catch {
    return emptyResult();
  }
}

function emptyResult(): GoPlusTokenSecurity {
  return {
    isHoneypot: null,
    buyTax: null,
    sellTax: null,
    ownerAddress: null,
    ownerBalance: null,
    creatorAddress: null,
    isMintable: null,
    canBlacklist: null,
    canPause: null,
    isProxy: null,
    hiddenOwner: null,
    personalSlippageModifiable: null,
    selfdestruct: null,
    failOpen: null,
    slippageModifiable: null,
    hasExternalCall: null,
    isAntiWhale: null,
    tradingCooldown: null,
    transferPausable: null,
    isTrueToken: null,
    isWhitelisted: null,
    isBlacklisted: null,
    holderCount: null,
    totalSupply: null,
    lpTotalSupply: null,
    lpHolderCount: null,
  };
}

function parseBool(val: string | undefined): boolean | null {
  if (val === undefined || val === "") return null;
  if (val === "1" || val === "true") return true;
  if (val === "0" || val === "false") return false;
  return null;
}

function parseNumber(val: string | undefined): number | null {
  if (!val || val === "") return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}
