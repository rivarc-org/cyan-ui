import { apiRequest } from './client';
import type { EncryptResponse, GenerateResponse } from './types';

export const cryptoApi = {
  encrypt: (value: string) =>
    apiRequest<EncryptResponse>('/crypto/encrypt', {
      method: 'POST',
      body: JSON.stringify({ value }),
    }),

  generate: (length?: number) =>
    apiRequest<GenerateResponse>('/crypto/generate', {
      method: 'POST',
      body: JSON.stringify(length ? { length } : {}),
    }),
};
