import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const CardGrid = ({ items }) => {
    const [displayItems, setDisplayItems] = useState([]);

    // Function to pick N random unique items
    const getRandomItems = (arr, n) => {
        const shuffled = [...arr].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, n);
    };

    // Update display items based on screen width
    const updateDisplayItems = () => {
        const width = window.innerWidth;
        if (width < 640) {
            // mobile → 1 item
            setDisplayItems(getRandomItems(items, 3));
        } else if (width < 1024) {
            // tablet → 2 items
            setDisplayItems(getRandomItems(items, 4));
        } else {
            // desktop → 3 items
            setDisplayItems(getRandomItems(items, 6));
        }
    };

    useEffect(() => {
        updateDisplayItems();
        window.addEventListener("resize", updateDisplayItems);
        return () => window.removeEventListener("resize", updateDisplayItems);
    }, [items]);

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
                        <Link to={`dashboard/livesession/${issue._id}`}>session</Link>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CardGrid;

