import { useState, useCallback } from 'react';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { cryptoApi } from '@/api/crypto';
import { cn } from '@/lib/utils';

interface SecureInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SecureInput({ value, onChange, placeholder }: SecureInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [localValue, setLocalValue] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);

  const isEncrypted = value.startsWith('SECRET:');

  const handleBlur = useCallback(async () => {
    // Only encrypt if there's a non-encrypted value
    if (localValue && !localValue.startsWith('SECRET:')) {
      setIsEncrypting(true);
      try {
        const { cipher } = await cryptoApi.encrypt(localValue);
        onChange(cipher);
        setLocalValue(''); // Clear local plaintext
        setDecryptedValue(null); // Clear cached decrypted value
      } catch (err) {
        console.error('Encryption failed:', err);
        // Keep local value on error so user can retry
      } finally {
        setIsEncrypting(false);
      }
    }
  }, [localValue, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (isEncrypted) {
      // User is typing over an encrypted value - clear it
      onChange('');
      setDecryptedValue(null);
    }
    setLocalValue(newValue);
  };

  const handleToggleVisibility = useCallback(async () => {
    if (!isVisible && isEncrypted && !decryptedValue) {
      // Decrypt on first reveal
      setIsDecrypting(true);
      try {
        const { value: plaintext } = await cryptoApi.decrypt(value);
        setDecryptedValue(plaintext);
        setIsVisible(true);
      } catch (err) {
        console.error('Decryption failed:', err);
      } finally {
        setIsDecrypting(false);
      }
    } else {
      setIsVisible(!isVisible);
    }
  }, [isVisible, isEncrypted, decryptedValue, value]);

  const displayValue = isEncrypted
    ? isVisible
      ? decryptedValue || '...'
      : '••••••••'
    : localValue;

  return (
    <div className="relative">
      <input
        type={isVisible ? 'text' : 'password'}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={isEncrypting}
        className={cn(
          'nodrag w-full px-2 py-1 pr-16 text-sm border rounded',
          'focus:outline-none focus:ring-1 focus:ring-blue-500',
          isEncrypted ? 'border-green-300 bg-green-50' : 'border-gray-200',
          isEncrypting && 'opacity-50'
        )}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isEncrypted && (
          <Lock className="w-3 h-3 text-green-600" />
        )}
        {isEncrypting || isDecrypting ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        ) : (
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="p-0.5 text-gray-400 hover:text-gray-600"
          >
            {isVisible ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
