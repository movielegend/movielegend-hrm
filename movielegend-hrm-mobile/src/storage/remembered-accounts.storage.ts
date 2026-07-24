import * as SecureStore from 'expo-secure-store';

const REMEMBERED_ACCOUNTS_KEY = 'remembered_accounts';
const MAX_REMEMBERED_ACCOUNTS = 10;

export interface RememberedAccount {
  phone: string;
  password: string;
  updatedAt: number;
}

export async function getRememberedAccounts(): Promise<RememberedAccount[]> {
  try {
    const raw = await SecureStore.getItemAsync(REMEMBERED_ACCOUNTS_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as RememberedAccount[];
  } catch {
    return [];
  }
}

async function saveRememberedAccounts(accounts: RememberedAccount[]): Promise<void> {
  await SecureStore.setItemAsync(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function rememberAccount(phone: string, password: string): Promise<void> {
  const accounts = await getRememberedAccounts();

  // Không tạo duplicate theo số điện thoại.
  const remaining = accounts.filter((account) => account.phone !== phone);

  const next: RememberedAccount[] = [
    {
      phone,
      password,
      updatedAt: Date.now(),
    },
    ...remaining,
  ];

  await saveRememberedAccounts(next.slice(0, MAX_REMEMBERED_ACCOUNTS));
}

export async function removeRememberedAccount(phone: string): Promise<void> {
  const accounts = await getRememberedAccounts();
  const next = accounts.filter((account) => account.phone !== phone);
  await saveRememberedAccounts(next);
}

export async function clearAllRememberedAccounts(): Promise<void> {
  await SecureStore.deleteItemAsync(REMEMBERED_ACCOUNTS_KEY);
}
