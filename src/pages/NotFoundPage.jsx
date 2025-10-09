import React from "react";

export default function NotFoundPage() {
  return (
    <div className="flex justify-center bg-gray-100" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-blue-600 mb-4">404 - Page Not Found</h2>
        <p className="text-gray-700 mb-6">Sorry, the page you are looking for does not exist.</p>
        <a href="/" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">Go to Home</a>
      </div>
    </div>
  );
}
