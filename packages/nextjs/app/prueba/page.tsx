"use client";

import React, { useEffect, useRef, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

interface Fish {
  id: number;
  type: string;
  x: number;
  y: number;
  color: string;
  points: number;
  reward: bigint;
  caught: boolean;
}

const JesusTokenAbi = deployedContracts[31337].JesusToken.abi;

export default function Pesca() {
  const { address: connectedAddress } = useAccount();
  const [score, setScore] = useState(0);
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [handPosition, setHandPosition] = useState({ x: -100, y: -100, visible: false });
  const pondRef = useRef<HTMLDivElement>(null);

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

  const fishTypes = [
    { type: "axolote", color: "bg-orange-400", points: 30, reward: parseEther("1"), catchProb: 0.4 },
    { type: "mojarra", color: "bg-blue-500", points: 15, reward: parseEther("2"), catchProb: 0.7 },
    { type: "bagre", color: "bg-purple-600", points: 20, reward: parseEther("3"), catchProb: 0.5 },
    { type: "charal", color: "bg-green-500", points: 10, reward: parseEther("4"), catchProb: 0.85 },
    { type: "carpa", color: "bg-red-500", points: 25, reward: parseEther("5"), catchProb: 0.6 },
  ];

  // Inicializar peces
  useEffect(() => {
    if (!pondRef.current) return;

    const pondWidth = pondRef.current.clientWidth;
    const pondHeight = pondRef.current.clientHeight;
    const newFishes: Fish[] = [];

    for (let i = 0; i < 7; i++) {
      const type = fishTypes[Math.floor(Math.random() * fishTypes.length)];
      newFishes.push({
        id: i,
        type: type.type,
        x: Math.random() * (pondWidth - 60) + 30,
        y: Math.random() * (pondHeight - 60) + 30,
        color: type.color,
        points: type.points,
        reward: type.reward,
        caught: false,
      });
    }

    setFishes(newFishes);
  }, []);

  const handlePondClick = (e: React.MouseEvent) => {
    if (!connectedAddress) return;

    const pond = pondRef.current;
    if (!pond) return;

    const rect = pond.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Mostrar la mano/malla
    setHandPosition({ x, y, visible: true });

    // Ocultar después de animación
    setTimeout(() => setHandPosition(prev => ({ ...prev, visible: false })), 300);

    // Verificar si se atrapó un pez
    const updatedFishes = fishes.map(fish => {
      if (fish.caught) return fish;

      const distance = Math.sqrt(Math.pow(fish.x - x, 2) + Math.pow(fish.y - y, 2));
      const fishType = fishTypes.find(ft => ft.type === fish.type);

      if (distance < 30 && fishType && Math.random() < fishType.catchProb) {
        // Recompensa en tokens
        writeContractAsync({
          address: deployedContracts[31337].JesusToken.address,
          abi: JesusTokenAbi,
          functionName: "mint",
          args: [connectedAddress, fishType.reward],
        });

        setScore(prev => prev + fishType.points);
        return { ...fish, caught: true };
      }
      return fish;
    });

    setFishes(updatedFishes);
  };

  // Mover peces aleatoriamente
  useEffect(() => {
    if (fishes.length === 0) return;

    const interval = setInterval(() => {
      setFishes(prevFishes =>
        prevFishes.map(fish => {
          if (fish.caught) return fish;

          return {
            ...fish,
            x: Math.max(30, Math.min(fish.x + (Math.random() * 10 - 5), pondRef.current?.clientWidth || 400 - 30)),
            y: Math.max(30, Math.min(fish.y + (Math.random() * 10 - 5), pondRef.current?.clientHeight || 400 - 30)),
          };
        }),
      );
    }, 500);

    return () => clearInterval(interval);
  }, [fishes]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-yellow-200 font-sans">
      <h1 className="text-4xl font-bold text-orange-600 my-4">🎣 Pesca Mexicana</h1>

      <div className="flex flex-col items-center mb-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg hover:from-red-600 hover:to-red-700 transition"
        >
          🎪 Volver a la feria
        </button>

        <div className="mt-4 text-2xl font-bold text-green-800">Puntaje: {score}</div>

        {connectedAddress && (
          <div className="text-lg text-blue-800">Tokens: {balance ? formatEther(balance) : "0"}</div>
        )}

        {(isPending || isConfirming) && <div className="text-yellow-600 animate-pulse">Minting tokens...</div>}
      </div>

      <div
        ref={pondRef}
        onClick={handlePondClick}
        className="relative w-96 h-96 bg-blue-400 rounded-full border-8 border-blue-700 overflow-hidden shadow-xl cursor-pointer"
      >
        {/* Peces */}
        {fishes.map(fish => (
          <div
            key={fish.id}
            className={`absolute w-12 h-8 ${fish.color} rounded-full ${fish.caught ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
            style={{
              left: `${fish.x}px`,
              top: `${fish.y}px`,
              transform: `rotate(${Math.random() * 30 - 15}deg)`,
            }}
          >
            <div className="absolute top-1 right-2 w-2 h-2 bg-white rounded-full"></div>
            <div className="absolute top-1 right-1 w-1 h-1 bg-black rounded-full"></div>
            <div className="absolute top-3 -left-2 w-4 h-2 bg-blue-300 transform -rotate-45"></div>
          </div>
        ))}

        {/* Mano/Malla de pesca */}
        {handPosition.visible && (
          <div
            className="absolute w-12 h-12 bg-yellow-400 border-4 border-brown-800 rounded-lg shadow-md"
            style={{
              left: `${handPosition.x - 24}px`,
              top: `${handPosition.y - 24}px`,
              animation: "catchAnimation 0.3s",
            }}
          ></div>
        )}

        {/* Efecto de agua */}
        <div className="absolute inset-0 bg-blue-300 opacity-20 pointer-events-none"></div>
      </div>

      {!connectedAddress && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg">
          Conecta tu wallet para ganar tokens cuando pesques!
        </div>
      )}

      <style jsx>{`
        @keyframes catchAnimation {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
