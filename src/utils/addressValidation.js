// src/utils/addressValidation.js
import { ethers } from 'ethers';

// Для проверки Bitcoin-адресов (начинаются на "1", "3" или "bc1")
export function isValidBitcoinAddress(address) {
  const btcRegex = /^(1|3)[a-km-zA-HJ-NP-Z0-9]{25,34}$|^(bc1)[a-z0-9]{39,59}$/;
  return btcRegex.test(address);
}

// Для проверки Ethereum-адресов с использованием ethers.js:
export function isValidEthereumAddress(address) {
  return ethers.utils.isAddress(address);
}

// Для проверки TRC20 (Tron) адресов (обычно начинаются с "T" и имеют 34 символа)
export function isValidTrc20Address(address) {
  const trcRegex = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
  return trcRegex.test(address);
}
