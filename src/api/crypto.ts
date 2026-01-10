import { apiRequest } from './client';
import type { EncryptResponse, GenerateResponse, DecryptResponse } from './types';

export const cryptoApi = {
  encrypt: (value: string) =>
    apiRequest<EncryptResponse>('/crypto/encrypt', {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),

  decrypt: (cipher: string) =>
    apiRequest<DecryptResponse>('/crypto/decrypt', {
      method: 'POST',
      body: JSON.stringify({ cipher }),
    }),

  generate: (length?: number) =>
    apiRequest<GenerateResponse>('/crypto/generate', {
      method: 'POST',
      body: JSON.stringify(length ? { length } : {}),
    }),
};
