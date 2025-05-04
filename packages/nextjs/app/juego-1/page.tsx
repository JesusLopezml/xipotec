"use client";

import { useEffect } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

const JesusTokenAbi = deployedContracts[31337].JesusToken.abi;

export default function Juego1() {
  const { address: connectedAddress } = useAccount();
  const { data: hash, isPending, writeContractAsync } = useWriteContract();

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: deployedContracts[31337].JesusToken.address,
    abi: JesusTokenAbi,
    functionName: "balanceOf",
    args: [connectedAddress as `0x${string}`],
    query: {
      enabled: !!connectedAddress,
    },
  });

  async function mint() {
    try {
      await writeContractAsync({
        address: deployedContracts[31337].JesusToken.address,
        abi: JesusTokenAbi,
        functionName: "mint",
        args: [connectedAddress as `0x${string}`, parseEther("1")],
      });
    } catch (error) {
      console.error(error);
    }
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchBalance();
    }
  }, [isConfirmed, refetchBalance]);

  return (
    <div>
      <h1>Juego 1</h1>
      <p>Balance: {balance ? formatEther(balance as bigint) : "Not connected"}</p>
      <button onClick={mint}>Mint</button>
      {hash && <div>Transaction Hash: {hash}</div>}
      {isConfirming && <div>Waiting for confirmation...</div>}
      {isConfirmed && <div>Transaction confirmed.</div>}
    </div>
  );
}
