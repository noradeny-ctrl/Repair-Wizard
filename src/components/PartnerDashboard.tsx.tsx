import { useState } from "react";
import { auth } from "../services/firebase";

export default function PartnerDashboard() {
  const [clientMode, setClientMode] = useState(false); // Toggle to hide wholesale prices

  const parts = [
    { name: "A/C Compressor (2024 Toyota Camry)", retail: 310, wholesale: 185, stock: "In Nashville" },
    { name: "Transmission Control Module (GM)", retail: 450, wholesale: 290, stock: "Low Stock" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 border-t-4 border-yellow-500">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-yellow-400">⚡ Partner Command Center</h1>
          <p className="text-gray-400 text-sm">Welcome, {auth.currentUser?.email}</p>
        </div>
        
        {/* THE SECRET TOGGLE */}
        <button 
          onClick={() => setClientMode(!clientMode)}
          className={`px-4 py-2 rounded font-bold text-sm ${clientMode ? 'bg-green-600' : 'bg-gray-700'}`}
        >
          {clientMode ? "👀 Client View (Safe)" : "🔒 Manager View"}
        </button>
      </div>

      {/* QUICK STATS */}
      {!clientMode && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <h3 className="text-gray-400 text-xs">Total Savings (This Month)</h3>
            <p className="text-2xl font-bold text-green-400">$1,240.00</p>
          </div>
          <div className="bg-gray-800 p-4 rounded border border-gray-700">
            <h3 className="text-gray-400 text-xs">Partner Level</h3>
            <p className="text-2xl font-bold text-yellow-500">Gold Westa</p>
          </div>
        </div>
      )}

      {/* WHOLESALE INVENTORY LIST */}
      <h2 className="text-xl font-bold mb-4">🇺🇸 US Direct Inventory</h2>
      <div className="space-y-4">
        {parts.map((part, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 hover:border-yellow-500 transition-colors">
            
            {/* Part Info */}
            <div>
              <h3 className="font-bold">{part.name}</h3>
              <p className="text-xs text-gray-400">{part.stock}</p>
            </div>

            {/* Price Logic */}
            <div className="text-right">
              {clientMode ? (
                // CLIENT VIEW: Only show Retail Price
                <p className="text-xl font-bold text-white">${part.retail}</p>
              ) : (
                // MANAGER VIEW: Show Profit Margin
                <>
                  <p className="text-xs text-red-400 line-through">MSRP: ${part.retail}</p>
                  <p className="text-xl font-bold text-green-400">${part.wholesale}</p>
                  <p className="text-xs text-yellow-600 font-bold">Profit: ${part.retail - part.wholesale}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-8 grid grid-cols-1 gap-3">
        <button className="w-full bg-yellow-500 text-black font-bold py-3 rounded">
          Order Parts (Next Shipment)
        </button>
        <button className="w-full bg-gray-700 text-white font-bold py-3 rounded">
          Generate Technician Report (PDF)
        </button>
      </div>

    </div>
  );
}