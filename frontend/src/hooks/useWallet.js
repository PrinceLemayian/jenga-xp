import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { FUJI_CHAIN_ID, FUJI_CHAIN_ID_HEX, FUJI_NETWORK } from "../constants";

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const hydrate = useCallback(async () => {
    if (!window.ethereum) return;

    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    const network = await web3Provider.getNetwork();
    const accounts = await window.ethereum.request({ method: "eth_accounts" });

    setProvider(web3Provider);
    setChainId(Number(network.chainId));

    if (accounts.length > 0) {
      const web3Signer = await web3Provider.getSigner();
      setSigner(web3Signer);
      setAddress(await web3Signer.getAddress());
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
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [FUJI_NETWORK],
        });
        await hydrate();
        setError(null);
        return true;
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
      await hydrate();

      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const network = await web3Provider.getNetwork();

      if (Number(network.chainId) !== FUJI_CHAIN_ID) {
        await switchToFuji();
      }
    } catch (err) {
      setError(err.message || "Could not connect wallet.");
    } finally {
      setConnecting(false);
    }
  }, [hydrate, switchToFuji]);

  useEffect(() => {
    hydrate().catch(() => {});

    if (!window.ethereum) return undefined;

    const handleAccounts = () => hydrate().catch(() => {});
    const handleChain = () => hydrate().catch(() => {});

    window.ethereum.on("accountsChanged", handleAccounts);
    window.ethereum.on("chainChanged", handleChain);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccounts);
      window.ethereum.removeListener("chainChanged", handleChain);
    };
  }, [hydrate]);

  return {
    address,
    provider,
    signer,
    chainId,
    error,
    connecting,
    isWrongNetwork: Boolean(address && chainId && chainId !== FUJI_CHAIN_ID),
    connect,
    switchToFuji,
  };
}
