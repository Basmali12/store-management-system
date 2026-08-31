const bytesToHex = (bytes: Uint8Array) =>
  Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('');

const digest = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
};

export const createPasswordCredential = async (password: string): Promise<string> => {
  const saltBytes = crypto.getRandomValues(new Uint8Array(16));
  const salt = bytesToHex(saltBytes);
  return `${salt}:${await digest(`${salt}:${password}`)}`;
};

export const verifyPassword = async (password: string, credential?: string): Promise<boolean> => {
  if (!credential) return false;
  const [salt, expected] = credential.split(':');
  if (!salt || !expected) return false;
  return (await digest(`${salt}:${password}`)) === expected;
};
