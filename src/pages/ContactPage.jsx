import React, { useState, useEffect } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Try to get logged-in user info from sessionStorage
    const storedUserProfile = sessionStorage.getItem('loginProfile');
    if (storedUserProfile) {
      const user = JSON.parse(storedUserProfile);
      setForm(f => ({ ...f, name: user.username || '', email: user.email || '' }));
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const res = await fetch(`https://codeformates-backend.vercel.app/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setStatus('Message sent successfully!');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('Failed to send message. Please try again.');
      }
    } catch (err) {
      setStatus('Error sending message.');
    }
  };

  return (
  <div className="bg-gray-100 p-6" style={{ minHeight: 'calc(100vh - 300px)' }}>
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-6">
        <h2 className="text-3xl font-bold text-blue-600 mb-4">Contact Us</h2>
        <p className="text-gray-700 text-lg mb-6">
          Have questions, feedback, or partnership ideas? Reach out to us anytime.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Your Name"
            className="w-full px-4 py-2 border rounded-xl"
            required
          />
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Your Email"
            className="w-full px-4 py-2 border rounded-xl"
            required
          />
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Your Message"
            rows="5"
            className="w-full px-4 py-2 border rounded-xl"
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700"
            disabled={status === 'Sending...'}
          >
            {status === 'Sending...' ? 'Sending...' : 'Send Message'}
          </button>
        </form>
        {status && <div className="mt-4 text-center text-blue-600">{status}</div>}
      </div>
    </div>
  );
}
  