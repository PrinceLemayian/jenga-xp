import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { FUJI_CHAIN_ID, FUJI_CHAIN_ID_HEX, FUJI_NETWORK } from "../constants";

/**
 * Ethers.js v6 Wallet Connection Hook
 * Conforms strictly to official Ethers.js v6 BrowserProvider & Signer specifications.
 */
export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const hydrate = useCallback(async () => {
    if (!window.ethereum) return;

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();
      const accounts = await window.ethereum.request({ method: "eth_accounts" });

      setProvider(web3Provider);
      setChainId(Number(network.chainId));

      if (accounts.length > 0) {
        // Ethers v6: provider.getSigner() returns a Promise<JsonRpcSigner>
        const web3Signer = await web3Provider.getSigner();
        const userAddress = await web3Signer.getAddress();
        setSigner(web3Signer);
        setAddress(userAddress);
      }
    } catch (err) {
      console.warn("Hydrate wallet error:", err);
    }
  }, []);

  const switchToFuji = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is required to connect.");
      return false;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: FUJI_CHAIN_ID_HEX }],
      });
      await hydrate();
      setError(null);
      return true;
    } catch (err) {
      if (err.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [FUJI_NETWORK],
          });
          await hydrate();
          setError(null);
          return true;
        } catch (addErr) {
          setError(addErr.message || "Failed to add Avalanche Fuji network to wallet.");
          return false;
        }
      }

      setError(err.message || "Could not switch to Avalanche Fuji.");
      return false;
    }
  }, [hydrate]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) throw new Error("MetaMask is required to connect.");

      await window.ethereum.request({ method: "eth_requestAccounts" });
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();
      setProvider(web3Provider);
      setChainId(Number(network.chainId));

      if (Number(network.chainId) !== FUJI_CHAIN_ID) {
        await switchToFuji();
      }

      const web3Signer = await web3Provider.getSigner();
      const userAddress = await web3Signer.getAddress();
      setSigner(web3Signer);
      setAddress(userAddress);
    } catch (err) {
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setError("Connection request cancelled in wallet.");
      } else {
        setError(err.message || "Could not connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  }, [switchToFuji]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  }, []);

  useEffect(() => {
    hydrate();

    if (!window.ethereum) return undefined;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        hydrate();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [hydrate, disconnect]);

  return {
    address,
    provider,
    signer,
    chainId,
    error,
    connecting,
    isWrongNetwork: Boolean(address && chainId && chainId !== FUJI_CHAIN_ID),
    connect,
    disconnect,
    switchToFuji,
  };
}
