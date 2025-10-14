import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CardGrid = ({ items }) => {
const [displayItems, setDisplayItems] = useState([]);
  const [layout, setLayout] = useState("");

  // Utility: pick N random unique items
  const getRandomItems = (arr, n) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  };

  // Decide layout (mobile/tablet/desktop)
  const getLayoutInfo = () => {
    const width = window.innerWidth;
    if (width < 640) return { layout: "mobile", count: 3 };
    if (width < 1024) return { layout: "tablet", count: 4 };
    return { layout: "desktop", count: 6 };
  };

  const updateDisplayItems = () => {
    const { layout: newLayout, count } = getLayoutInfo();
    setLayout(newLayout);
    setDisplayItems(getRandomItems(items, count));
  };

  useEffect(() => {
    // Set initial layout
    updateDisplayItems();

    // ✅ Debounce resize event
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const { layout: newLayout } = getLayoutInfo();
        if (layout !== newLayout) updateDisplayItems();
      }, 200);
    };

    window.addEventListener("resize", handleResize);

    // ✅ Shuffle automatically every 5 seconds
    const shuffleInterval = setInterval(() => {
      const { count } = getLayoutInfo();
      setDisplayItems(getRandomItems(items, count));
    }, 5000); // 5 seconds (you can make it 4000 for 4s)

    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      clearInterval(shuffleInterval);
    };
  }, [items, layout]);

    return (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {displayItems.map((issue) => (
                <div
                    key={issue._id}
                    className="bg-gray-800 text-white rounded-xl shadow p-4 flex flex-col sm:justify-between"
                >
                    <div>
                        <h3 className="text-xl text-white font-semibold text-gray-800">
                            {issue.title}
                        </h3>
                        <p className="text-sm text-white mt-3">
                            Language: {issue.language}<span className={
                                issue.urgency === "now"
                                    ? "text-red-700 bg-red-100 border border-red-400 px-2 py-0.5 rounded ml-2 align-middle"
                                    : "text-green-700 bg-green-100 border border-green-400 px-2 py-0.5 rounded ml-2 align-middle"
                            }>Urgency: {issue.urgency}</span>
                        </p>
                    </div>
                    <div className="mt-4 bg-teal-700 text-white px-4 py-2 rounded-xl hover:bg-teal-800">
                        <Link to={`dashboard/livesession/${issue._id}`} aria-label={`Go to the session page of ${issue.title}`} title={issue.title}>session</Link>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CardGrid;

