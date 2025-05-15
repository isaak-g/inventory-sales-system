import React, { useEffect, useState } from "react";
import { FiTrendingUp, FiRefreshCw } from "react-icons/fi";
import Sidebar from "../components/layout/Sidebar";   //  Import Sidebar

const AIInsights = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://127.0.0.1:5000/api/ai/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error("Failed to fetch AI recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading AI Insights...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 ml-[250px]">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2 text-blue-800">
            <FiTrendingUp className="text-blue-600" /> AI Product Insights
            </h1>

          <button
            onClick={fetchRecommendations}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <InsightCard title="🔥 Top Sellers">
            {recommendations.top_sellers.map((item, idx) => (
              <InsightItem key={idx} name={item.name} badge={`${item.total_sold} sold`} />
            ))}
          </InsightCard>

          <InsightCard title="🛒 Restock Suggestions">
            {recommendations.restock_suggestions.map((item, idx) => (
              <InsightItem key={idx} name={item} />
            ))}
          </InsightCard>

          <InsightCard title="📊 Category Trends">
            {recommendations.category_trends.map((item, idx) => (
              <InsightItem key={idx} name={item.category} badge={`${item.total_sold} sold`} />
            ))}
          </InsightCard>

          <InsightCard title="📅 Trending This Month">
            {recommendations.time_based_recommendations.map((item, idx) => (
              <InsightItem key={idx} name={item.name} badge={`${item.total_sold} sold`} />
            ))}
          </InsightCard>

          {/* Frequently Bought Together */}
          <InsightCard title="🤝 Frequently Bought Together">
            {recommendations.frequently_bought_together.length > 0 ? (
              recommendations.frequently_bought_together.map((item, idx) => (
                <InsightItem key={idx} name={item} />
              ))
            ) : (
              <div className="text-gray-500 text-center py-4">No data available. Coming soon!</div>
            )}
          </InsightCard>
        </div>
      </main>
    </div>
  );
};

const InsightCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 hover:shadow-lg transition">
    <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
    <ul className="space-y-3">{children}</ul>
  </div>
);

const InsightItem = ({ name, badge }) => (
  <li className="flex items-center justify-between">
    <span className="text-gray-700">{name}</span>
    {badge && (
      <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
        {badge}
      </span>
    )}
  </li>
);

export default AIInsights;
