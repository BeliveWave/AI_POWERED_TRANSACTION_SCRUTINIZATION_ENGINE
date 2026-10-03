export const PRESET_SCENARIOS = [
  {
    id: "normal",
    title: "Normal Payment",
    amount: "24.50",
    item: "Weekly Grocery Essentials",
    category: "5411",
    country: "LK",
    isVpn: false
  },
  {
    id: "velocity",
    title: "Rapid Fire (Velocity Attack)",
    amount: "45.00",
    item: "Quick Store Gift Cards",
    category: "5999",
    country: "LK",
    isVpn: false,
    multiBurst: true
  },
  {
    id: "foreign_vpn",
    title: "Foreign Location (VPN Attack)",
    amount: "420.00",
    item: "Overseas Luxury Electronics",
    category: "5732",
    country: "GB",
    isVpn: true
  },
  {
    id: "high_amount",
    title: "High-Ticket Anomaly ($7,850)",
    amount: "7850.00",
    item: "Diamond Solitaire Platinum Watch",
    category: "5944",
    country: "US",
    isVpn: false
  },
  {
    id: "frozen_card",
    title: "Stolen / Locked Card",
    amount: "12.50",
    item: "Artisan Coffee & Pastries",
    category: "5812",
    country: "LK",
    isVpn: false,
    requiresFrozen: true
  }
];

