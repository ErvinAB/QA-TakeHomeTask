import { randomUUID } from "crypto";

export interface AccountData {
  name: string;
  type: "asset" | "expense" | "revenue" | "liability";
  currency_code: string;
  account_role?: string;
  notes?: string;
}

export interface TransactionData {
  type: "withdrawal" | "deposit" | "transfer";
  date: string;
  amount: string;
  description: string;
  source_name: string;
  destination_name: string;
  currency_code?: string;
  category_name?: string;
}

function uniqueSuffix(region: string, testId: string): string {
  const worker = process.env.PLAYWRIGHT_WORKER_INDEX ?? "0";
  const ciRun = process.env.GITHUB_RUN_ID ?? process.env.CI_RUN ?? "local";
  const shortRun = ciRun.slice(-8);
  const testShort = testId.replace(/[^a-zA-Z0-9]/g, "").slice(-12);
  const uuid = randomUUID().split("-")[0];
  return `${region}_${shortRun}_w${worker}_${testShort}_${uuid}`;
}

export function createAssetAccount(
  region: string,
  testId: string,
  currencyCode: string
): AccountData {
  const id = uniqueSuffix(region, testId);
  return {
    name: `QA Asset ${id}`,
    type: "asset",
    currency_code: currencyCode,
    account_role: "defaultAsset",
    notes: "Test account created by QA automation",
  };
}

export function createExpenseAccount(
  region: string,
  testId: string,
  currencyCode: string
): AccountData {
  const id = uniqueSuffix(region, testId);
  return {
    name: `QA Expense ${id}`,
    type: "expense",
    currency_code: currencyCode,
    notes: "Test expense account",
  };
}

export function createWithdrawal(
  sourceName: string,
  destinationName: string,
  amount: string,
  description: string,
  currencyCode?: string
): TransactionData {
  return {
    type: "withdrawal",
    date: new Date().toISOString().split("T")[0],
    amount,
    description,
    source_name: sourceName,
    destination_name: destinationName,
    currency_code: currencyCode,
  };
}
