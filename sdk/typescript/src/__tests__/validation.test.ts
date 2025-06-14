import { 
  isValidAddress, 
  isValidAmount, 
  isValidModelId, 
  isValidChain, 
  isValidPrivateKey 
} from '../core/validation';

describe('Validation Utilities', () => {
  describe('isValidAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(isValidAddress('0x1234567890123456789012345678901234567890')).toBe(true);
      expect(isValidAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('invalid')).toBe(false);
      expect(isValidAddress('')).toBe(false);
      expect(isValidAddress('0x')).toBe(false);
    });
  });

  describe('isValidAmount', () => {
    it('should validate positive amounts', () => {
      expect(isValidAmount('1.0')).toBe(true);
      expect(isValidAmount('0.1')).toBe(true);
      expect(isValidAmount('1000')).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(isValidAmount('0')).toBe(false);
      expect(isValidAmount('-1')).toBe(false);
      expect(isValidAmount('invalid')).toBe(false);
      expect(isValidAmount('')).toBe(false);
    });
  });

  describe('isValidModelId', () => {
    it('should validate correct model IDs', () => {
      expect(isValidModelId('valid-model-id')).toBe(true);
      expect(isValidModelId('model123')).toBe(true);
      expect(isValidModelId('a')).toBe(true);
    });

    it('should reject invalid model IDs', () => {
      expect(isValidModelId('')).toBe(false);
      expect(isValidModelId('a'.repeat(101))).toBe(false);
    });
  });

  describe('isValidChain', () => {
    it('should validate supported chains', () => {
      expect(isValidChain('base')).toBe(true);
      expect(isValidChain('arbitrum')).toBe(true);
      expect(isValidChain('optimism')).toBe(true);
      expect(isValidChain('polygon')).toBe(true);
      expect(isValidChain('ethereum')).toBe(true);
    });

    it('should reject unsupported chains', () => {
      expect(isValidChain('invalid')).toBe(false);
      expect(isValidChain('')).toBe(false);
      expect(isValidChain('bitcoin')).toBe(false);
    });
  });

  describe('isValidPrivateKey', () => {
    it('should validate correct private keys', () => {
      expect(isValidPrivateKey('0x' + '1'.repeat(64))).toBe(true);
      expect(isValidPrivateKey('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')).toBe(true);
    });

    it('should reject invalid private keys', () => {
      expect(isValidPrivateKey('invalid')).toBe(false);
      expect(isValidPrivateKey('0x123')).toBe(false);
      expect(isValidPrivateKey('')).toBe(false);
    });
  });
}); 