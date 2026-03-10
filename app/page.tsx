"use client";
import React, { useState, useEffect } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Shield, ShieldAlert, Wifi, Zap, Activity, Server, Radio } from "lucide-react";

export default function Dashboard() {
    const [scenario, setScenario] = useState("clear");
    const [protocol, setProtocol] = useState("quic");
    const [overhead, setOverhead] = useState(10);
    const [statsHistory, setStatsHistory] = useState<{ time: string, rawLoss: number, finalLoss: number, efficiency: number }[]>([]);
    const [currentStats, setCurrentStats] = useState({ efficiency: 100, rawLoss: 0, finalLoss: 0, status: '等待中' });
    const [tick, setTick] = useState(0);

    // 定期觸發模擬
    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 2000);
        return () => clearInterval(interval);
    }, []);

    // 核心模擬邏輯 (AL-FEC)
    useEffect(() => {
        const K = 100;
        const R = Math.floor(K * (overhead / 100));
        const N_total = K + R;
        const packets = Array(N_total).fill(true);

        if (scenario === "clear") {
            for (let i = 0; i < N_total; i++) if (Math.random() < 0.01) packets[i] = false;
        } else if (scenario === "rain") {
            let i = 0;
            while (i < N_total) {
                if (Math.random() < 0.05) {
                    for (let j = 0; j < 5 && i + j < N_total; j++) packets[i + j] = false;
                    i += 5;
                } else {
                    i++;
                }
            }
        } else if (scenario === "handover") {
            const start = Math.floor(Math.random() * (N_total - 25));
            for (let i = 0; i < 25; i++) packets[start + i] = false;
        }

        const N_received = packets.filter(Boolean).length;
        const rawLossCount = N_total - N_received;
        const rawLossRate = (rawLossCount / N_total) * 100;

        const isSuccess = N_received >= K;
        const finalLossRate = isSuccess ? 0 : ((K - N_received) / K) * 100;
        const efficiency = (K / N_total) * 100;

        const newStats = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            efficiency: parseFloat(efficiency.toFixed(1)),
            rawLoss: parseFloat(rawLossRate.toFixed(1)),
            finalLoss: parseFloat(finalLossRate.toFixed(1)),
            status: isSuccess ? "修復成功" : "影像破圖",
        };

        setCurrentStats(newStats);
        setStatsHistory((prev) => {
            const next = [...prev, newStats];
            return next.length > 15 ? next.slice(1) : next;
        });
    }, [tick, scenario, overhead]);

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col md:flex-row font-sans">
            {/* 左側：控制面板 */}
            <aside className="w-full md:w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-8 shadow-2xl z-10">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                        <Radio className="w-6 h-6" /> UAV-LEO Simulator
                    </h1>
                    <p className="text-xs text-gray-500 mt-2">QUIC + AL-FEC 效能實驗室</p>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                            <Activity className="w-4 h-4" /> LEO 情境模式
                        </label>
                        <select
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="clear">☀️ 晴朗空域 (1% 隨機丟包)</option>
                            <option value="rain">🌧️ 雨衰與雲層 (5% 連續突發丟包)</option>
                            <option value="handover">🛰️ 低軌衛星換手 ({">"}20 絕對斷線)</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                            <Zap className="w-4 h-4" /> 通訊協定
                        </label>
                        <div className="flex bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => setProtocol("tcp")}
                                className={`flex-1 py-1.5 text-sm rounded-md transition ${protocol === "tcp" ? "bg-red-500/20 text-red-400 font-bold" : "text-gray-400"}`}
                            >TCP (隊頭阻塞)</button>
                            <button
                                onClick={() => setProtocol("quic")}
                                className={`flex-1 py-1.5 text-sm rounded-md transition ${protocol === "quic" ? "bg-blue-500/20 text-blue-400 font-bold" : "text-gray-400"}`}
                            >QUIC (無阻塞)</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center justify-between text-gray-300">
                            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> AL-FEC 冗餘</span>
                            <span className="text-blue-400 font-mono">{overhead}%</span>
                        </label>
                        <input type="range" min="0" max="20" value={overhead} onChange={(e) => setOverhead(Number(e.target.value))} className="w-full accent-blue-500" />
                    </div>
                </div>
            </aside>

            {/* 右側：主畫面 */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* 動畫區塊 */}
                <section className="flex-[0.4] bg-gray-950 p-6 flex justify-center items-center relative border-b border-gray-800 shadow-inner">
                    <div className="absolute top-4 left-6 text-sm font-semibold text-gray-500">即時傳輸視覺化</div>
                    <div className="w-full h-full flex flex-col justify-between items-center py-4 relative">
                        <div className="flex flex-col items-center gap-1 z-10">
                            <Server className="w-10 h-10 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                            <span className="text-xs font-bold font-mono text-blue-400 bg-blue-900/30 px-2 py-1 rounded">LEO 衛星</span>
                        </div>

                        <div className="absolute inset-y-16 flex justify-center w-full z-0 overflow-hidden">
                            <StreamAnimation protocol={protocol} scenario={scenario} tick={tick} />
                        </div>

                        <div className="flex flex-col items-center gap-1 z-10">
                            <span className="text-xs font-bold font-mono text-gray-300 bg-gray-800 px-2 py-1 rounded">UAV 無人機</span>
                            <Wifi className="w-8 h-8 text-gray-300" />
                        </div>
                    </div>
                </section>

                {/* 數據儀表板 */}
                <section className="flex-[0.6] p-6 bg-gray-950 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <StatCard title="網路效率 (Efficiency)" value={`${currentStats.efficiency}%`} icon={<Activity />} color="text-blue-400" />
                        <StatCard title="原始丟包率 (Before FEC)" value={`${currentStats.rawLoss}%`} icon={<ShieldAlert />} color="text-yellow-400" />
                        <StatCard
                            title="影像狀態 (After FEC)"
                            value={currentStats.finalLoss === 0 ? "0%" : `${currentStats.finalLoss}%`}
                            subtitle={currentStats.status}
                            icon={<Shield />}
                            bg={currentStats.status === "修復成功" ? "bg-green-500/10 border-green-500/30" : "bg-red-500/10 border-red-500/30"}
                            color={currentStats.status === "修復成功" ? "text-green-400" : "text-red-400"}
                        />
                    </div>

                    <div className="h-64 bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={statsHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} tickMargin={10} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: "#1f2937", borderColor: "#374151", color: "#f3f4f6" }} />
                                <Legend />
                                <Line type="monotone" dataKey="rawLoss" name="原始丟包 (%)" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                                <Line type="monotone" dataKey="finalLoss" name="FEC後丟包 (%)" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </main>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, color, bg = "bg-gray-900 border-gray-800" }: any) {
    return (
        <div className={`${bg} border p-5 rounded-xl flex items-center justify-between shadow-lg transition-colors duration-300`}>
            <div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                <div className={`text-3xl font-bold font-mono ${color}`}>{value}</div>
                {subtitle && <div className={`mt-1 text-sm font-bold ${color}`}>{subtitle}</div>}
            </div>
            <div className={`opacity-80 ${color} p-3 rounded-full bg-gray-950/50`}>{icon}</div>
        </div>
    );
}

function StreamAnimation({ protocol, scenario, tick }: { protocol: string, scenario: string, tick: number }) {
    const [dots, setDots] = useState<any[]>([]);

    useEffect(() => {
        let newDots = Array.from({ length: 7 }).map((_, i) => ({
            id: `${tick}-${i}`,
            delay: i * 0.15,
            lost: false,
            stalled: false
        }));

        if (scenario === "handover" || scenario === "rain") {
            newDots[2].lost = true;
            if (scenario === "handover") {
                newDots[3].lost = true;
                newDots[4].lost = true;
            }
        } else {
            if (Math.random() < 0.2) newDots[3].lost = true; // 展現零星丟包
        }

        if (protocol === "tcp") {
            const lossIndex = newDots.findIndex(d => d.lost);
            if (lossIndex !== -1) {
                for (let i = lossIndex + 1; i < newDots.length; i++) newDots[i].stalled = true;
            }
        }

        setDots(newDots);
    }, [tick, protocol, scenario]);

    return (
        <div className="relative w-32 h-full my-4">
            <style>{`
        @keyframes flyQuic {
          0% { transform: translateY(180px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-20px); opacity: 0; }
        }
        @keyframes flyTcpStall {
          0% { transform: translateY(180px); opacity: 0; }
          20% { opacity: 1; }
          50% { transform: translateY(80px); opacity: 1; }
          100% { transform: translateY(80px); opacity: 1; }
        }
        @keyframes fadeDrop {
          0% { transform: translateY(180px); opacity: 1; background-color: #3b82f6;}
          50% { transform: translateY(80px); opacity: 1; background-color: #ef4444;}
          100% { transform: translateY(80px); opacity: 0; transform: scale(3); background-color: #ef4444;}
        }
      `}</style>

            {dots.map((dot) => {
                let animationName = "flyQuic";
                if (dot.lost) animationName = "fadeDrop";
                else if (dot.stalled) animationName = "flyTcpStall";

                return (
                    <div
                        key={dot.id}
                        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)] bg-blue-500"
                        style={{
                            animation: `${animationName} 1.5s forwards linear`,
                            animationDelay: `${dot.delay}s`,
                            opacity: 0,
                        }}
                    />
                );
            })}
        </div>
    );
}
