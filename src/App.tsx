import { useState, useEffect, useRef } from 'react'
import { useTcpSender } from './TcpBridgeComponent'
import rockImage from './assets/rockImage.jpg'
import paperImage from './assets/paper.png'
import scissorsImage from './assets/scissorsImage.jpg'

import './App.css'

const moveImages: Record<string, string> = {
  Rock: rockImage,
  Paper: paperImage,
  Scissors: scissorsImage,
};

const movesList = ["Rock", "Paper", "Scissors"];

function App() {
  const [phase, setPhase] = useState<string>("spinning"); // "spinning" -> "player-locked" -> "revealed"
  const [playerMove, setPlayerMove] = useState<string | null>(null);
  const [cpuMove, setCpuMove] = useState<string | null>(null);

  // Cycling display states for slot machine effect
  const [displayPlayer, setDisplayPlayer] = useState<string>("Rock");
  const [displayCpu, setDisplayCpu] = useState<string>("Rock");

  const { sendData, latestMessage } = useTcpSender('ws://localhost:8080');

  // Keep a ref of the latest message so timers always see the most up-to-date value without closure bugs
  const latestMessageRef = useRef(latestMessage);
  useEffect(() => {
    latestMessageRef.current = latestMessage;
  }, [latestMessage]);

  // Helper to calculate CPU move based on outcome
  const calculateCpuMove = (player: string, outcome: string) => {
    if (!outcome) return player;
    const cleanOutcome = outcome.trim().toLowerCase();
    if (cleanOutcome === "draw") return player;
    if (cleanOutcome === "win") {
      if (player === "Rock") return "Scissors";
      if (player === "Paper") return "Rock";
      if (player === "Scissors") return "Paper";
    } else if (cleanOutcome === "lose") {
      if (player === "Rock") return "Paper";
      if (player === "Paper") return "Scissors";
      if (player === "Scissors") return "Rock";
    }
    return player;
  };

  // Continuous cycling/spinning effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phase === "spinning") {
      interval = setInterval(() => {
        //Random Image for both player and CPU while spinning
        //Could have used a predefined array of images and cycled through them, 
        // but this is cooler
        setDisplayPlayer(movesList[Math.floor(Math.random() * movesList.length)]);
        setDisplayCpu(movesList[Math.floor(Math.random() * movesList.length)]);

      }, 100);
    } else if (phase === "player-locked") {
      interval = setInterval(() => {
        setDisplayCpu(movesList[Math.floor(Math.random() * movesList.length)]);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [phase]);

  // Auto-reset back to spinning after showing the result for 3 seconds
  useEffect(() => {
    if (phase === "revealed") {
      const resetTimer = setTimeout(() => {
        setPhase("spinning");
        setPlayerMove(null);
        setCpuMove(null);
      }, 3000);

      return () => clearTimeout(resetTimer);
    }
  }, [phase]);

  const handleMove = (move: string) => {
    if (phase !== "spinning") return; // Prevent clicking while rolling/revealed

    setPlayerMove(move);
    setPhase("player-locked"); // Freeze player, keep CPU spinning
    sendData(move);

    // After 1 second of CPU spinning, safely lock in the result using the ref
    setTimeout(() => {
      const outcome = latestMessageRef.current || "Draw";
      const calculatedCpu = calculateCpuMove(move, outcome);
      setCpuMove(calculatedCpu);
      setPhase("revealed");
    }, 1000);
  };

  const activePlayerImage = (phase === "spinning")
    ? moveImages[displayPlayer]
    : moveImages[playerMove!];

  const activeCpuImage = (phase === "revealed" && cpuMove)
    ? moveImages[cpuMove]
    : moveImages[displayCpu];

  return (
    <div className="flex flex-col h-screen w-screen justify-between p-6 bg-gray-50">

      {/* Top Section: Split Screen for Player vs CPU */}
      <div className="flex flex-row h-3/4 w-full gap-4">

        {/* Left Half: Player */}
        <div className="w-1/2 flex flex-col items-center justify-center border-2 border-blue-400 rounded-xl bg-white shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">You</h2>
          <div className="flex flex-col items-center">
            <img
              src={activePlayerImage}
              alt="Player Move"
              className={`w-48 h-48 object-contain rounded-xl border p-2 shadow-md mb-4 ${phase === "spinning" ? "animate-shake" : ""
                }`}
            />
            <p className="text-xl font-semibold text-gray-700">
              {phase === "spinning" ? "Rolling..." : playerMove}
            </p>
          </div>
        </div>

        {/* Right Half: CPU */}
        <div className="w-1/2 flex flex-col items-center justify-center border-2 border-red-400 rounded-xl bg-white shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 text-red-600">CPU</h2>
          <div className="flex flex-col items-center">
            <img
              src={activeCpuImage}
              alt="CPU Move"
              className={`w-48 h-48 object-contain rounded-xl border p-2 shadow-md mb-4 ${phase === "spinning" || phase === "player-locked" ? "animate-shake" : ""
                }`}
            />
            <p className="text-xl font-semibold text-gray-700">
              {phase === "revealed" ? cpuMove : "Rolling..."}
            </p>
          </div>
        </div>

      </div>

      {/* Middle Section: Game Outcome Message */}
      <div className="text-center my-4">
        <h3 className="text-xl font-bold text-gray-800">Result:</h3>
        <p className="text-2xl font-extrabold text-indigo-600 uppercase">
          {phase === "revealed" ? latestMessage : "Make your move!"}
        </p>
      </div>

      {/* Bottom Section: Action Buttons */}
      <div className="flex justify-center gap-6 h-1/6 items-center">
        <button
          type="button"
          disabled={phase !== "spinning"}
          className="px-6 py-3 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 shadow-md transition-all"
          onClick={() => handleMove("Rock")}
        >
          Rock! 🪨
        </button>
        <button
          type="button"
          disabled={phase !== "spinning"}
          className="px-6 py-3 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 shadow-md transition-all"
          onClick={() => handleMove("Paper")}
        >
          Paper! 📄
        </button>
        <button
          type="button"
          disabled={phase !== "spinning"}
          className="px-6 py-3 text-lg font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 shadow-md transition-all"
          onClick={() => handleMove("Scissors")}
        >
          Scissors! ✂️
        </button>
      </div>

    </div>
  )
}

export default App