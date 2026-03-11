# Swarm Defender (CM03 Swarm Network Anti-Destruction Lab)

This is a single-page interactive visualization dashboard built with Next.js, designed to simulate and demonstrate the communication performance of "Unmanned Aerial Vehicle (UAV) Swarms to Low Earth Orbit (LEO) Satellites" under various battlefield threat scenarios.

## 🎯 New Features & Laboratory Characteristics

We have implemented the following core visualization and simulation features in this project:

1. **Dynamic Battlefield Threat Scenarios**
   - 🟢 Clear (Base Formation Coordination): 1% random packet loss.
   - 🟡 Rain (Rain Attenuation & Cloud Cover): 5% burst packet loss.
   - 🔴 Targeted Jamming: High-frequency malicious interference causing massive burst packet losses.
   - 💥 Topology Break: Simulates large-scale continuous packet loss caused by node or leader destruction.
2. **Multi-Protocol Performance Comparison (M2M Protocols)**
   - Real-time switching between TCP and QUIC to observe transmission latency and packet blocking under the same interference environment.
3. **Active Defense Mechanism Adjustability (AL-FEC Redundancy Control)**
   - Allows users to adjust AL-FEC redundancy (0% - 50%) in real-time to observe the trade-off between "Defense Bandwidth Cost" and "Swarm Robustness".
4. **Real-time Data & Topology Animation**
   - Integrates Recharts to provide real-time charts of the anti-destruction index, tactical latency, and effective packet loss rate.
   - Visually demonstrates the transmission status of packets (normal, stalled, lost) between the LEO command and the Drone Swarm Mesh.

## 📡 Core Protocol Supplementary Notes

### QUIC (Quick UDP Internet Connections)
In this simulation, QUIC is designed as a "**Distributed Anti-Blocking**" solution.
* **No Head-of-Line (HoL) Blocking**: When traditional TCP encounters packet loss, it pauses the processing of subsequent data until the lost packet is retransmitted, resulting in extremely high latency (Latency Penalty) for tactical commands. QUIC is based on UDP and allows multiplexing; the loss of packets in a single data stream will not affect other data, ensuring that lower tactical latency can still be maintained under severe battlefield interference.

### AL-FEC (Application-Layer Forward Error Correction)
An active application-layer forward error correction technology.
* **Redundant Repair Mechanism**: When sending original data (K), extra redundant packets (R) are actively included. As long as the total number of packets received at the destination is $\ge$ K (whether original or redundant packets), the data can be perfectly restored.
* **Trading Bandwidth for Time and Survival Rate**: In unstable tactical networks, waiting for retransmissions often leads to missing combat opportunities or complete link disruption. By proactively increasing the "Defense Bandwidth Cost", AL-FEC allows the swarm to correct errors without retransmission when encountering electromagnetic jamming or rain attenuation, significantly improving the overall robustness of the "Kill Chain".

---

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can start editing the page by modifying `app/page.tsx`.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new). Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
