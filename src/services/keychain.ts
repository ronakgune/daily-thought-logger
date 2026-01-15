/**
 * Keychain service for secure credential storage on macOS
 * Uses keytar for macOS Keychain integration
 * [AI-11] Set up Gemini API service with API key config
 */

import keytar from 'keytar';

const SERVICE_NAME = 'daily-thought-logger';

/**
 * KeychainService provides secure storage for sensitive data
 * using the macOS Keychain via keytar
 */
export class KeychainService {
  private serviceName: string;

  constructor(serviceName: string = SERVICE_NAME) {
    this.serviceName = serviceName;
  }

  /**
   * Store a secret in the keychain
   * @param account - The account identifier (e.g., 'gemini-api-key')
   * @param secret - The secret value to store
   */
  async setSecret(account: string, secret: string): Promise<void> {
    try {
      await keytar.setPassword(this.serviceName, account, secret);
    } catch (error) {
      throw new Error(
        `Failed to store secret in keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieve a secret from the keychain
   * @param account - The account identifier
   * @returns The secret value or null if not found
   */
  async getSecret(account: string): Promise<string | null> {
    try {
      return await keytar.getPassword(this.serviceName, account);
    } catch (error) {
      throw new Error(
        `Failed to retrieve secret from keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a secret from the keychain
   * @param account - The account identifier
   * @returns True if deleted, false if not found
   */
  async deleteSecret(account: string): Promise<boolean> {
    try {
      return await keytar.deletePassword(this.serviceName, account);
    } catch (error) {
      throw new Error(
        `Failed to delete secret from keychain: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a secret exists in the keychain
   * @param account - The account identifier
   * @returns True if the secret exists
   */
  async hasSecret(account: string): Promise<boolean> {
    const secret = await this.getSecret(account);
    return secret !== null;
  }

  /**
   * List all account names stored for this service
   * @returns Array of account identifiers (passwords are NOT included for security)
   */
  async listAccounts(): Promise<string[]> {
    try {
      const credentials = await keytar.findCredentials(this.serviceName);
      return credentials.map((cred) => cred.account);
    } catch (error) {
      throw new Error(
        `Failed to list keychain accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance for common use
export const keychainService = new KeychainService();
