import React from 'react';
export default function AboutPage() {
  return (
    <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-blue-600 mb-4">About CodeForMates</h2>
        <p className="text-gray-700 text-lg">
          CodeForMates is a real-time peer-to-peer support platform built for developers, by developers. Whether you’re stuck on a tough bug or just want to brainstorm an idea, you can instantly connect with fellow coders via chat or screen share.
        </p>
        <ul className="list-disc list-inside mt-4 text-gray-600">
          <li>Post your issues and get quick, reliable help</li>
          <li>Help others when you're free</li>
          <li>Get issue matched by skill tags and urgency</li>
          <li>Build reputation by solving real-world problems</li>
        </ul>
      </div>
    </div>
  );
}