"use client";
import React, { useState, useEffect } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import { Shield, ShieldAlert, Wifi, Zap, Activity, Server, Radio, Crosshair, Users, GlobeLock } from "lucide-react";

export default function Dashboard() {
    const [scenario, setScenario] = useState("clear");
    const [protocol, setProtocol] = useState("quic");
    const [overhead, setOverhead] = useState(20);
    const [statsHistory, setStatsHistory] = useState<{ time: string, rawLoss: number, finalLoss: number, robustness: number, latency: number }[]>([]);
    const [currentStats, setCurrentStats] = useState({ robustness: 100, latency: 50, rawLoss: 0, finalLoss: 0, status: 'M2M 協同中' });
    const [tick, setTick] = useState(0);

    // 定期觸發模擬
    useEffect(() => {
        const interval = setInterval(() => setTick((t) => t + 1), 2000);
        return () => clearInterval(interval);
    }, []);

    // 核心模擬邏輯 (AL-FEC & Security Metrics)
    useEffect(() => {
        const K = 100;
        const R = Math.floor(K * (overhead / 100));
        const N_total = K + R;
        const packets = Array(N_total).fill(true);
        let baseLatency = 40; // M2M base latency in ms

        // Attack Scenarios based on CM03
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
            baseLatency = 60;
        } else if (scenario === "jamming") {
            // 蓄意電磁干擾 (Targeted EW Jamming) - High frequency bursts
            let i = 0;
            while (i < N_total) {
                if (Math.random() < 0.15) {
                    const burstSize = Math.floor(Math.random() * 8) + 3; // 3 to 10 packets lost
                    for (let j = 0; j < burstSize && i + j < N_total; j++) packets[i + j] = false;
                    i += burstSize;
                } else {
                    i++;
                }
            }
            baseLatency = 80;
        } else if (scenario === "topology_break") {
            // 拓撲斷裂 / Leader Down - Massive contiguous loss
            const start = Math.floor(Math.random() * (N_total - 40));
            for (let i = 0; i < 40; i++) packets[start + i] = false;
            baseLatency = 120;
        }

        const N_received_raw = packets.filter(Boolean).length;
        const rawLossCount = N_total - N_received_raw;
        const rawLossRate = (rawLossCount / N_total) * 100;

        // Simulate Head-of-Line Blocking & Tactical Latency
        let N_received = 0;
        let tacticalLatency = baseLatency;

        if (protocol === "tcp") {
            const firstLossIndex = packets.findIndex(p => p === false);
            if (firstLossIndex === -1) {
                N_received = N_total;
            } else {
                N_received = firstLossIndex;
                // TCP Latency Penalty during packet loss (Retransmission timeouts)
                tacticalLatency += (rawLossCount * 45); // e.g. 45ms penalty per lost packet queueing
            }
        } else {
            N_received = N_received_raw;
            // QUIC avoids HoL blocking, latency remains relatively stable even under attack
            tacticalLatency += (rawLossCount * 2);
        }

        const isSuccess = N_received >= K;
        const finalLossRate = isSuccess ? 0 : ((K - N_received) / K) * 100;

        // CM03 Swarm Robustness Score (0-100)
        // Formula: Combination of successful M2M decode and Tactical Latency
        let robustness = 100 - finalLossRate;
        if (tacticalLatency > 200) {
            robustness -= Math.min(50, (tacticalLatency - 200) * 0.1);
        }
        robustness = Math.max(0, Math.min(100, robustness));

        let statusText = "M2M 協同中";
        if (!isSuccess) statusText = "⚠️ 擊殺鍊中斷";
        if (tacticalLatency > 400) statusText = "☠️ 蜂群失控";
        if (scenario === "jamming" && isSuccess) statusText = "🛡️ 成功反制干擾";

        const newStats = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            robustness: parseFloat(robustness.toFixed(1)),
            latency: Math.floor(tacticalLatency),
            rawLoss: parseFloat(rawLossRate.toFixed(1)),
            finalLoss: parseFloat(Math.max(0, finalLossRate).toFixed(1)),
            status: statusText,
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
            <aside className="w-full md:w-80 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 shadow-2xl z-10 overflow-y-auto">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2 text-cyan-400">
                        <GlobeLock className="w-6 h-6 text-red-500" /> Swarm Defender
                    </h1>
                    <p className="text-xs text-gray-500 mt-2">CM03 蜂群網路抗毀滅實驗室</p>
                </div>

                <div className="flex flex-col gap-5">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                            <Crosshair className="w-4 h-4 text-red-400" /> 戰場威脅情境 (Threat Level)
                        </label>
                        <select
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-gray-200"
                        >
                            <option value="clear">🟢 基礎編隊協同 (1% 隨機丟包)</option>
                            <option value="rain">🟡 雨衰與雲層 (5% 突發丟包)</option>
                            <option value="jamming">🔴 蓄意電磁干擾 (Targeted Jamming)</option>
                            <option value="topology_break">💥 蜂群拓撲斷裂 (Leader Down {">"}40)</option>
                        </select>
                        {scenario === "jamming" && <p className="text-xs text-red-400 animate-pulse mt-1">⚠️ 偵測到高頻惡意干擾電波</p>}
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2 text-gray-300">
                            <Zap className="w-4 h-4 text-yellow-400" /> M2M 通訊協定
                        </label>
                        <div className="flex bg-gray-800 p-1 rounded-lg">
                            <button
                                onClick={() => setProtocol("tcp")}
                                className={`flex-1 py-1.5 text-xs rounded-md transition ${protocol === "tcp" ? "bg-red-500/20 text-red-400 font-bold border border-red-500/30" : "text-gray-400"}`}
                            >TCP (具隊頭阻塞)</button>
                            <button
                                onClick={() => setProtocol("quic")}
                                className={`flex-1 py-1.5 text-xs rounded-md transition ${protocol === "quic" ? "bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30" : "text-gray-400"}`}
                            >QUIC (分散式抗阻)</button>
                        </div>
                    </div>

                    <div className="space-y-3 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                        <label className="text-sm font-semibold flex items-center justify-between text-gray-300">
                            <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-400" /> 主動式 AL-FEC 冗餘</span>
                            <span className="text-cyan-400 font-mono text-lg">{overhead}%</span>
                        </label>
                        <input type="range" min="0" max="50" value={overhead} onChange={(e) => setOverhead(Number(e.target.value))} className="w-full accent-cyan-500 mt-2" />
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                            <span>節能 (高風險)</span>
                            <span>耗頻寬 (高防禦)</span>
                        </div>
                        <div className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-2 flex justify-between">
                            <span>防禦頻寬代價:</span>
                            <span className="text-yellow-400 font-mono">+{overhead} Mbps</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 右側：主畫面 */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* 動畫區塊 - 蜂群拓撲 */}
                <section className={`flex-[0.35] p-6 flex justify-center items-center relative border-b shadow-inner transition-colors duration-500 ${scenario === 'jamming' || scenario === 'topology_break' ? 'bg-red-950/20 border-red-900/50' : 'bg-gray-950 border-gray-800'}`}>
                    <div className="absolute top-4 left-6 text-sm font-semibold text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4" /> BVLOS 蜂群拓撲狀態
                    </div>
                    <div className="w-full h-full flex flex-col justify-between items-center py-2 relative">
                        <div className="flex flex-col items-center gap-1 z-10">
                            <Server className={`w-8 h-8 ${scenario === 'jamming' ? 'text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.8)]' : 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]'}`} />
                            <span className="text-[10px] font-bold font-mono text-gray-200 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">LEO Command</span>
                        </div>

                        <div className="absolute inset-y-12 flex justify-center w-full z-0 overflow-hidden">
                            <SwarmAnimation protocol={protocol} scenario={scenario} tick={tick} />
                        </div>

                        <div className="flex flex-col items-center gap-1 z-10 mt-auto">
                            <div className="flex gap-4">
                                <Wifi className="w-6 h-6 text-gray-400 opacity-50" />
                                <Radio className="w-8 h-8 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
                                <Wifi className="w-6 h-6 text-gray-400 opacity-50" />
                            </div>
                            <span className="text-[10px] font-bold font-mono text-gray-900 bg-cyan-400 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(34,211,238,0.4)]">Drone Swarm Mesh</span>
                        </div>
                    </div>
                </section>

                {/* 數據儀表板 */}
                <section className="flex-[0.65] p-6 bg-gray-950 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <StatCard
                            title="群體強健性 (Robustness)"
                            value={`${currentStats.robustness}`}
                            unit="pts"
                            icon={<Shield />}
                            color={currentStats.robustness > 80 ? "text-green-400" : currentStats.robustness > 40 ? "text-yellow-400" : "text-red-500"}
                            bg={currentStats.robustness > 80 ? "bg-green-500/10 border-green-500/20" : currentStats.robustness > 40 ? "bg-yellow-500/10 border-yellow-500/20" : "bg-red-500/10 border-red-500/30"}
                        />
                        <StatCard
                            title="戰術指令延遲 (Tactical Latency)"
                            value={`${currentStats.latency}`}
                            unit="ms"
                            icon={<Activity />}
                            color={currentStats.latency < 100 ? "text-cyan-400" : currentStats.latency < 300 ? "text-yellow-400" : "text-red-500"}
                        />
                        <StatCard
                            title="原始丟包 (Attack Damage)"
                            value={`${currentStats.rawLoss}`}
                            unit="%"
                            icon={<GlobeLock />}
                            color={scenario === "clear" ? "text-gray-400" : "text-red-400"}
                        />
                        <StatCard
                            title="蜂群狀態 (Swarm Status)"
                            value={currentStats.finalLoss === 0 ? "0%" : `${currentStats.finalLoss}%`}
                            unit="Loss"
                            subtitle={currentStats.status}
                            icon={<ShieldAlert />}
                            bg={currentStats.status.includes("中斷") || currentStats.status.includes("失控") ? "bg-red-900/40 border-red-500/50" : "bg-gray-900 border-gray-800"}
                            color={currentStats.status.includes("中斷") || currentStats.status.includes("失控") ? "text-red-400" : "text-green-400"}
                        />
                    </div>

                    <div className="h-56 bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={statsHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRobustness" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickMargin={8} />
                                <YAxis yAxisId="left" stroke="#6b7280" fontSize={10} domain={[0, 100]} />
                                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={10} domain={[0, 'auto']} />
                                <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", color: "#f3f4f6", fontSize: "12px", borderRadius: "8px" }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />

                                <Area yAxisId="left" type="monotone" dataKey="robustness" name="抗毀滅指數 (Pts)" stroke="#22d3ee" fillOpacity={1} fill="url(#colorRobustness)" strokeWidth={2} isAnimationActive={false} />
                                <Line yAxisId="left" type="stepAfter" dataKey="finalLoss" name="有效丟包 (%)" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
                                <Line yAxisId="right" type="monotone" dataKey="latency" name="戰術延遲 (ms)" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="3 3" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </main>
        </div>
    );
}

function StatCard({ title, value, unit, subtitle, icon, color, bg = "bg-gray-900 border-gray-800" }: any) {
    return (
        <div className={`${bg} border p-4 rounded-xl flex items-center justify-between shadow-lg transition-colors duration-300 relative overflow-hidden`}>
            <div className="z-10">
                <h3 className="text-gray-500 text-xs font-semibold mb-1 uppercase tracking-wider">{title}</h3>
                <div className="flex items-baseline gap-1">
                    <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
                    {unit && <div className={`text-xs font-medium opacity-70 ${color}`}>{unit}</div>}
                </div>
                {subtitle && <div className={`mt-1 text-xs font-bold bg-black/30 inline-block px-2 py-0.5 rounded ${color}`}>{subtitle}</div>}
            </div>
            <div className={`opacity-20 absolute -right-2 -bottom-2 transform scale-150 ${color}`}>{icon}</div>
        </div>
    );
}

function SwarmAnimation({ protocol, scenario, tick }: { protocol: string, scenario: string, tick: number }) {
    const [links, setLinks] = useState<any[]>([]);

    useEffect(() => {
        // Generate communication links between LEO and 3 Drone nodes
        const nodes = [-40, 0, 40]; // X offsets
        let newLinks: any[] = [];

        nodes.forEach((offset, nodeIndex) => {
            const dropRate = scenario === 'clear' ? 0.05 : scenario === 'rain' ? 0.3 : scenario === 'jamming' ? 0.7 : 0.9;

            for (let i = 0; i < 3; i++) {
                const isDrop = Math.random() < dropRate;
                // Force topology break on center node
                const forceDrop = scenario === 'topology_break' && nodeIndex === 1;

                newLinks.push({
                    id: `${tick}-${nodeIndex}-${i}`,
                    xOffset: offset,
                    delay: Math.random() * 0.5,
                    lost: forceDrop || isDrop,
                    stalled: false // Evaluated later for TCP
                });
            }
        });

        if (protocol === "tcp") {
            // Apply HoL blocking broadly if there are drops
            const hasDrop = newLinks.some(l => l.lost);
            if (hasDrop) {
                newLinks = newLinks.map(l => l.lost ? l : { ...l, stalled: Math.random() > 0.3 });
            }
        }

        setLinks(newLinks);
    }, [tick, protocol, scenario]);

    return (
        <div className="relative w-full h-[180px] my-2 perspective-1000">
            <style>{`
        @keyframes streamData {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(30px) scale(1); }
          80% { opacity: 1; transform: translateY(120px) scale(1); }
          100% { transform: translateY(150px) scale(0.5); opacity: 0; }
        }
        @keyframes streamStalled {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(30px) scale(1); }
          50% { opacity: 1; transform: translateY(60px) scale(1.5); background-color: #facc15; box-shadow: 0 0 10px #facc15; }
          100% { opacity: 0; transform: translateY(60px) scale(2); background-color: #facc15; }
        }
        @keyframes streamLost {
          0% { transform: translateY(0) scale(0.5); opacity: 1; background-color: #22d3ee; }
          40% { transform: translateY(50px) scale(1.2); opacity: 1; background-color: #ef4444; box-shadow: 0 0 20px #ef4444; }
          50% { transform: translateY(50px) scale(3); opacity: 0; background-color: #ef4444; }
          100% { transform: translateY(50px) scale(3); opacity: 0; }
        }
      `}</style>

            {links.map((link) => {
                let animationName = "streamData";
                let colorClass = "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]";

                if (link.lost) {
                    animationName = "streamLost";
                    colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]";
                } else if (link.stalled) {
                    animationName = "streamStalled";
                    colorClass = "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]";
                }

                return (
                    <div
                        key={link.id}
                        className={`absolute top-0 w-1.5 h-6 rounded-full ${colorClass}`}
                        style={{
                            left: `calc(50% + ${link.xOffset}px)`,
                            animation: `${animationName} 1.2s forwards ease-in-out`,
                            animationDelay: `${link.delay}s`,
                            opacity: 0,
                        }}
                    />
                );
            })}

            {/* Jamming Effects overlay */}
            {scenario === 'jamming' && (
                <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay animate-pulse pointer-events-none" />
            )}
        </div>
    );
}
