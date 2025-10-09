import React from 'react';
export default function AboutPage() {
  return (
    <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-blue-600 mb-4">About CodeForMates</h2>
        <p className="text-gray-700 text-lg">
          CodeForMates is a peer-to-peer real-time help platform built for developers, by developers.
          Whether you're stuck on a bug or just need someone to brainstorm with, you can instantly
          connect with a problem solver through messaging or video call.
        </p>
        <ul className="list-disc list-inside mt-4 text-gray-600">
          <li>Post issues and get help fast</li>
          <li>Help others when you're free – no time tracking or pressure</li>
          <li>Match based on skill tags and urgency</li>
          <li>Build reputation by solving real-world problems</li>
        </ul>
      </div>
    </div>
  );
}