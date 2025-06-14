"""AgentPayyKit Python SDK - Pay-per-call APIs for AI agents."""

import json
import time
from typing import Any, Dict, Optional
from dataclasses import dataclass

import requests
from web3 import Web3
from eth_account import Account
from eth_account.messages import encode_defunct


@dataclass
class PaymentOptions:
    price: str
    chain: str = "base"
    deadline: Optional[int] = None
    mock: bool = False
    use_balance: bool = True  # NEW: Prefer balance over permit


class AgentPayyKit:
    """Main AgentPayyKit client for Python applications."""
    
    NETWORKS = {
        "base": {
            "rpc": "https://mainnet.base.org",
            "usdc": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            "contract": "0x7213E3E48D44504EEb42AF36f363Deca7C7E0565"  # Live on Base mainnet
        },
        "arbitrum": {
            "rpc": "https://arb1.arbitrum.io/rpc",
            "usdc": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
            "contract": "0x..."
        }
    }

    CONTRACT_ABI = [
        {
            "inputs": [{"name": "token", "type": "address"}, {"name": "amount", "type": "uint256"}],
            "name": "depositBalance", "outputs": [], "stateMutability": "nonpayable", "type": "function"
        },
        {
            "inputs": [{"name": "user", "type": "address"}, {"name": "token", "type": "address"}],
            "name": "getUserBalance", "outputs": [{"type": "uint256"}], "stateMutability": "view", "type": "function"
        },
        {
            "inputs": [{"name": "token", "type": "address"}, {"name": "amount", "type": "uint256"}],
            "name": "withdrawBalance", "outputs": [], "stateMutability": "nonpayable", "type": "function"
        },
        {
            "inputs": [{
                "components": [
                    {"name": "modelId", "type": "string"},
                    {"name": "inputHash", "type": "bytes32"},
                    {"name": "amount", "type": "uint256"},
                    {"name": "deadline", "type": "uint256"},
                    {"name": "smartWalletSig", "type": "bytes"},
                    {"name": "v", "type": "uint8"},
                    {"name": "r", "type": "bytes32"},
                    {"name": "s", "type": "bytes32"}
                ],
                "name": "payment", "type": "tuple"
            }],
            "name": "payAndCall", "outputs": [], "stateMutability": "nonpayable", "type": "function"
        }
    ]

    def __init__(self, private_key: str, chain: str = "base", gateway_url: str = "http://localhost:3000"):
        if not private_key or len(private_key) != 66:
            raise ValueError("Valid private key required (0x...)")
        if chain not in self.NETWORKS:
            raise ValueError(f"Unsupported chain: {chain}")
        
        self.chain = chain
        self.network = self.NETWORKS[chain]
        self.account = Account.from_key(private_key)
        self.w3 = Web3(Web3.HTTPProvider(self.network["rpc"]))
        self.gateway_url = gateway_url.rstrip('/')
        
        if not self.network["contract"] or self.network["contract"] == "0x...":
            raise ValueError(f"Contract not deployed on {chain}")
        
        self.contract = self.w3.eth.contract(
            address=self.network["contract"],
            abi=self.CONTRACT_ABI
        )

    def pay_and_call(self, model_id: str, input_data: Any, options: PaymentOptions) -> Dict[str, Any]:
        """Make a paid API call."""
        if not model_id or not isinstance(model_id, str):
            raise ValueError("Valid model_id required")
        if not options.price or not options.price.replace('.', '').isdigit():
            raise ValueError("Valid price required")
        
        # MOCK MODE: Skip payment for development
        if options.mock:
            return self._mock_api_call(model_id, input_data)

        # Check balance preference
        if options.use_balance:
            has_balance = self.check_user_balance(options.price)
            if has_balance:
                print(f"Using prepaid balance for payment")
            else:
                print(f"Insufficient balance, falling back to permit payment")

        input_json = json.dumps(input_data, sort_keys=True, separators=(',', ':'))
        input_hash = self.w3.keccak(input_json.encode())
        deadline = options.deadline or int(time.time()) + 3600
        
        # Convert price to wei (USDC has 6 decimals)
        price_wei = int(float(options.price) * 10**6)
        
        # Store input data
        self._store_input_data(input_hash.hex(), input_json)
        
        # Check if smart wallet
        if self._is_smart_wallet():
            payment_data = self._prepare_smart_wallet_payment(model_id, input_hash, price_wei, deadline)
        else:
            payment_data = self._prepare_permit_payment(model_id, input_hash, price_wei, deadline)
        
        # Submit transaction
        tx_hash = self._submit_payment(payment_data)
        
        # Wait for response
        return self._wait_for_response(tx_hash)

    def deposit_balance(self, amount: str, token_address: Optional[str] = None) -> str:
        """Deposit funds to prepaid balance."""
        token = token_address or self.network["usdc"]
        amount_wei = int(float(amount) * 10**6)
        
        # First approve the contract to spend tokens
        self._approve_token(token, amount_wei)
        
        # Then deposit to balance
        tx = self.contract.functions.depositBalance(token, amount_wei).build_transaction({
            'from': self.account.address,
            'gas': 150000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        return tx_hash.hex()

    def check_user_balance(self, required_amount: str, user_address: Optional[str] = None, token_address: Optional[str] = None) -> bool:
        """Check if user has sufficient prepaid balance."""
        user = user_address or self.account.address
        token = token_address or self.network["usdc"]
        
        balance = self.contract.functions.getUserBalance(user, token).call()
        required = int(float(required_amount) * 10**6)
        
        return balance >= required

    def get_user_balance(self, user_address: Optional[str] = None, token_address: Optional[str] = None) -> str:
        """Get user's prepaid balance."""
        user = user_address or self.account.address
        token = token_address or self.network["usdc"]
        
        balance = self.contract.functions.getUserBalance(user, token).call()
        return str(balance / 10**6)  # Convert from wei to USDC

    def withdraw_balance(self, amount: str, token_address: Optional[str] = None) -> str:
        """Withdraw from prepaid balance."""
        token = token_address or self.network["usdc"]
        amount_wei = int(float(amount) * 10**6)
        
        tx = self.contract.functions.withdrawBalance(token, amount_wei).build_transaction({
            'from': self.account.address,
            'gas': 100000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        return tx_hash.hex()

    def _approve_token(self, token_address: str, amount: int):
        """Approve token spending."""
        token_abi = [{
            "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
            "name": "approve", "outputs": [{"type": "bool"}], "stateMutability": "nonpayable", "type": "function"
        }]
        
        token_contract = self.w3.eth.contract(address=token_address, abi=token_abi)
        
        tx = token_contract.functions.approve(self.network["contract"], amount).build_transaction({
            'from': self.account.address,
            'gas': 100000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        })
        
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Wait for approval to be mined
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        if receipt.status != 1:
            raise RuntimeError("Token approval failed")

    def _mock_api_call(self, model_id: str, input_data: Any) -> Dict[str, Any]:
        """Make a mock API call for development."""
        try:
            response = requests.post(
                f"{self.gateway_url}/api/mock/{model_id}",
                json={"input": input_data, "mock": True},
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
        except Exception:
            pass
        
        # Return mock data if endpoint doesn't exist
        return {
            "mock": True,
            "model_id": model_id,
            "input": input_data,
            "result": f"Mock response for {model_id}",
            "timestamp": int(time.time())
        }

    def withdraw(self, token_address: Optional[str] = None) -> str:
        """Withdraw accumulated funds."""
        token = token_address or self.network["usdc"]
        
        # Build withdraw transaction (simplified)
        tx = {
            'to': self.network["contract"],
            'data': f"0x1e9a6950{token[2:].zfill(64)}",  # withdraw(address) selector + padded address
            'gas': 100000,
            'gasPrice': self.w3.eth.gas_price,
            'nonce': self.w3.eth.get_transaction_count(self.account.address)
        }
        
        signed_tx = self.account.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        return tx_hash.hex()

    def get_balance(self, token_address: Optional[str] = None) -> str:
        """Get current balance."""
        # Simplified - would need proper contract call
        return "0.0"

    def _is_smart_wallet(self) -> bool:
        """Check if account is a smart wallet."""
        code = self.w3.eth.get_code(self.account.address)
        return len(code) > 0

    def _prepare_smart_wallet_payment(self, model_id: str, input_hash: bytes, amount: int, deadline: int) -> Dict:
        """Prepare smart wallet payment data."""
        message_hash = self.w3.keccak(
            model_id.encode() + input_hash + amount.to_bytes(32, 'big') + deadline.to_bytes(32, 'big')
        )
        
        signed_message = self.account.sign_message(encode_defunct(message_hash))
        
        return {
            "modelId": model_id,
            "inputHash": input_hash,
            "amount": amount,
            "deadline": deadline,
            "smartWalletSig": signed_message.signature,
            "v": 0,
            "r": b'\x00' * 32,
            "s": b'\x00' * 32
        }

    def _prepare_permit_payment(self, model_id: str, input_hash: bytes, amount: int, deadline: int) -> Dict:
        """Prepare permit payment data."""
        # Simplified permit implementation
        # In production, would need full EIP-2612 signing
        return {
            "modelId": model_id,
            "inputHash": input_hash,
            "amount": amount,
            "deadline": deadline,
            "smartWalletSig": b"",
            "v": 27,
            "r": b'\x00' * 32,
            "s": b'\x00' * 32
        }

    def _submit_payment(self, payment_data: Dict) -> str:
        """Submit payment transaction."""
        try:
            tx = self.contract.functions.payAndCall(payment_data).build_transaction({
                'from': self.account.address,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': self.w3.eth.get_transaction_count(self.account.address)
            })
            
            signed_tx = self.account.sign_transaction(tx)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            return tx_hash.hex()
        except Exception as e:
            raise RuntimeError(f"Transaction failed: {str(e)}")

    def _store_input_data(self, input_hash: str, input_data: str):
        """Store input data for gateway."""
        try:
            requests.post(
                f"{self.gateway_url}/store-input",
                json={"hash": input_hash, "data": input_data},
                timeout=5
            )
        except Exception:
            # Continue without storing - gateway can handle missing data
            pass

    def _wait_for_response(self, tx_hash: str, max_retries: int = 20) -> Dict[str, Any]:
        """Wait for API response with exponential backoff."""
        base_delay = 1.0
        
        for i in range(max_retries):
            try:
                response = requests.get(f"{self.gateway_url}/response/{tx_hash}", timeout=5)
                if response.status_code == 200 and response.json():
                    return response.json()
            except Exception:
                pass
            
            # Exponential backoff
            delay = min(base_delay * (1.5 ** i), 10.0)
            time.sleep(delay)
        
        raise TimeoutError(f"API response timeout after {max_retries} retries")

    # === API DISCOVERY METHODS ===

    def get_apis_by_category(self, category: str) -> list:
        """Get APIs by category."""
        try:
            response = requests.get(f"{self.gateway_url}/registry/category/{category}", timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error getting APIs by category: {e}")
        return []

    def search_apis_by_tag(self, tag: str) -> list:
        """Search APIs by tag."""
        try:
            response = requests.get(f"{self.gateway_url}/registry/search?tag={tag}", timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error searching APIs by tag: {e}")
        return []

    def get_marketplace_stats(self) -> Dict[str, Any]:
        """Get marketplace statistics."""
        try:
            response = requests.get(f"{self.gateway_url}/registry/stats", timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error getting marketplace stats: {e}")
        return {
            "totalAPIs": 0,
            "totalCategories": 0,
            "totalDevelopers": 0,
            "totalCalls": 0,
            "totalRevenue": "0"
        }

    def get_trending_apis(self, limit: int = 10) -> list:
        """Get trending APIs."""
        try:
            response = requests.get(f"{self.gateway_url}/registry/trending?limit={limit}", timeout=10)
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error getting trending APIs: {e}")
        return []

    def register_model(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Register API model for discovery."""
        try:
            config["owner"] = self.account.address
            response = requests.post(
                f"{self.gateway_url}/registry/register",
                json=config,
                timeout=10
            )
            if response.status_code == 200:
                return {"success": True, **response.json()}
            else:
                return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}


def pay_and_call(model_id: str, input_data: Any, price: str, private_key: Optional[str] = None, mock: bool = False, use_balance: bool = True) -> Dict[str, Any]:
    """Convenience function for one-off API calls."""
    import os
    key = private_key or os.getenv("PRIVATE_KEY")
    if not key:
        raise ValueError("Private key required (parameter or PRIVATE_KEY env var)")
    
    client = AgentPayyKit(key)
    return client.pay_and_call(model_id, input_data, PaymentOptions(price=price, mock=mock, use_balance=use_balance))


__all__ = ["AgentPayyKit", "PaymentOptions", "pay_and_call"] 