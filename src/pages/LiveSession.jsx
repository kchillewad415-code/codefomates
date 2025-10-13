import React, { useEffect, useRef, useState } from 'react';
import { Video, MessageSquare } from "lucide-react";
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import API from "../api";

const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function LiveSession({ user }) {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [issueFile, setIssueFile] = useState(null);
  const [issue, setIssue] = useState(null);
  const [isOfferer, setIsOfferer] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [mobileScreenShareError, setMobileScreenShareError] = useState("");

  // Removed videoSectionRef
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const peerRef = useRef();
  const screenShareVideoRef = useRef(null);



  const RTC_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      // If you have a TURN server, add it here:
      // { urls: "turn:your.turn.server:3478", username: "user", credential: "pass" }
    ]
  };

  useEffect(() => {
  if (!peerRef.current) {
    initPeerConnection();
  }
  // eslint-disable-next-line
}, []);
  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load initial data and setup socket
  useEffect(() => {
    const name = user?.username || "Anonymous";
    const mail = user?.email || "";
    setUsername(name);
    setEmail(mail);

    // Fetch chat history
    setLoading(true);
    axios.get(`${API_URL}/chat/${roomId}`).then(res => {
      setMessages(res.data.map(msg => ({
        id: msg._id,
        sender: msg.sender,
        text: msg.message,
        time: msg.time
      })));
      setLoading(false);
    }).catch(() => setLoading(false));

    // Fetch issue file
    axios.get(`${API_URL}/issues/${roomId}`).then(res => {
      if (res.data?.solution) setSolutionProvided(res.data.solution);
      if (res.data) setIssue(res.data);
      if (res.data?.file?.filename) setIssueFile(res.data.file.filename);
      else setIssueFile(null);
    }).catch(() => setIssueFile(null));

    // Setup socket
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinRoom', roomId, name, (role) => {
      setIsOfferer(role === 'offerer');
    });
    // Listen for remote screen share layout events (register ONCE, not inside chatMessage)
    socketRef.current.on('screenShareLayout', (active) => {
      setRemoteScreenSharing(active);
    });
    socketRef.current.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, { id: Date.now(), sender: msg.sender, text: msg.message, time: msg.time }]);
    });

    // WebRTC signaling
    socketRef.current.on('offer', async (offer) => {
      if (peerRef.current.signalingState !== 'stable') {
        await peerRef.current.setLocalDescription({ type: 'rollback' });
      }
      await peerRef.current.setRemoteDescription(offer);
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit('answer', { roomId, answer });
    });

    socketRef.current.on('answer', async (answer) => {
      if (peerRef.current) await peerRef.current.setRemoteDescription(answer);
    });

    socketRef.current.on('ice-candidate', async (candidate) => {
      try { if (peerRef.current) await peerRef.current.addIceCandidate(candidate); }
      catch (e) { console.error(e); }
    });

    return () => {
      socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, [user, roomId]);

  // Send chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current.emit('chatMessage', { roomId, message: input, sender: username, email });
    setInput("");
  };

  const peer = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });

  // Initialize peer connection
const initPeerConnection = () => {
  if (peerRef.current) {
    try { peerRef.current.close(); } catch (e) { }
    peerRef.current = null;
  }
  const pc = new RTCPeerConnection(RTC_CONFIG);
  peerRef.current = pc;

  pc.ontrack = (event) => {
    if (screenShareVideoRef.current) {
      const newStream = new MediaStream();
      pc.getReceivers().forEach(r => {
        if (r.track && (r.track.kind === 'video' || r.track.kind === 'audio') && r.track.readyState === 'live') {
          newStream.addTrack(r.track);
        }
      });
      screenShareVideoRef.current.srcObject = newStream;
      screenShareVideoRef.current.onloadedmetadata = () => screenShareVideoRef.current.play().catch(() => { });
    }
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socketRef.current.emit('ice-candidate', { roomId, candidate: event.candidate });
    }
  };
  pc.onnegotiationneeded = async () => {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('offer', { roomId, offer: pc.localDescription });
    } catch (err) {
      console.error("Negotiation error:", err);
    }
  };
  return pc;
};
  // Helper: create and send offer (used when caller starts)
  const createAndSendOffer = async () => {
    if (!peerRef.current) return;
    try {
      if (peerRef.current.signalingState !== 'stable') return;
      const offer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(offer);
      socketRef.current.emit('offer', { roomId, offer });
    } catch (err) {
      console.error("Offer error:", err);
    }
  };
  // Video/camera logic removed

  // Share screen (with audio)
const shareScreen = async () => {
  if (isMobile) {
    setMobileScreenShareError("Screen sharing is not supported on mobile browsers.");
    return;
  }
  try {
    const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    setIsScreenSharing(true);
    setMobileScreenShareError("");
    socketRef.current.emit('screenShareLayout', true);
    setScreenStream(sStream);
    if (screenShareVideoRef.current) {
      screenShareVideoRef.current.srcObject = sStream;
      screenShareVideoRef.current.onloadedmetadata = () => screenShareVideoRef.current.play().catch(() => { });
    }
    if (!peerRef.current) {
      initPeerConnection();
    }
    // Remove all existing senders before adding new tracks
    const senders = peerRef.current.getSenders();
    senders.forEach(sender => {
      try { peerRef.current.removeTrack(sender); } catch (e) { }
    });
    // Add all tracks (video+audio) to peer connection
    sStream.getTracks().forEach(track => {
      peerRef.current.addTrack(track, sStream);
    });
    // Always renegotiate after adding tracks
    await createAndSendOffer();
    // When user stops sharing from browser UI:
    sStream.getVideoTracks()[0].onended = () => stopScreenShare();
  } catch (err) {
    setMobileScreenShareError("Screen sharing failed. Your browser may not support it or permission was denied.");
    setIsScreenSharing(false);
    console.error("shareScreen error:", err);
  }
};

  // Stop screen share
  const stopScreenShare = async () => {
    setIsScreenSharing(false);
    socketRef.current.emit('screenShareLayout', false);
    if (screenShareVideoRef.current?.srcObject) {
      screenShareVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      screenShareVideoRef.current.srcObject = null;
    }
    if (screenStream) {
      // Remove all tracks from peer connection
      const senders = peerRef.current?.getSenders() || [];
      senders.forEach(sender => {
        try { peerRef.current.removeTrack(sender); } catch (e) { }
      });
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      await createAndSendOffer();
    }
  };
  const [solutionProvided, setSolutionProvided] = useState("");
  const handleSolutionChange = (e) => {
    setSolutionProvided(e.target.value);
  }
  const handleSolutionSubmit = (e) => {
    e.preventDefault();
    if (!solutionProvided.trim()) return;

    const updateIssues = { ...issue, solution: solutionProvided };
    updateIssue(updateIssues._id, updateIssues);
  };

  const updateIssue = async (id, updateIssue) => {
    try {
      const response = API.put(`/issues/${id}`, updateIssue);
      alert("Updated successfully!");
    }
    catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
      {/* Chat Section */}
      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col" style={{ height: 'calc(100vh - 265px)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-2 text-gray-700">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Chat
          </span>
          {/* Small video icon at the top right of chat */}
          <p><strong>{issue?.title ? `Issue:- ${issue.title}` : ''}</strong></p>
          <button
            className="p-1 md:hidden rounded-full bg-blue-100 hover:bg-blue-200"
            onClick={() => {
              setTimeout(() => {
              }, 100); // Wait for section to appear
            }}
            aria-label="Show Video Section"
          >
            <Video className="w-5 h-5 text-blue-600" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4 h-full">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span className="ml-2 text-blue-600">Loading chat...</span>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isOwn = msg.sender === username;
                return (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-xl max-w-xs text-sm flex flex-col ${isOwn ? "bg-blue-100 items-end" : "bg-gray-200 items-start"
                      }`}
                    style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', marginLeft: isOwn ? 'auto' : 0, marginRight: isOwn ? 0 : 'auto', textAlign: 'left' }}
                  >
                    <div style={{ textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>{msg.sender}</strong>
                    </div>
                    <div style={{ textAlign: 'left', width: '100%' }}>{msg.text}</div>
                    <span className="block w-full text-right text-xs text-gray-500">
                      {msg.time ? new Date(msg.time).toLocaleTimeString() : ''}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-xl"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl">
            Send
          </button>
        </form>
      </div>

      {/* Screen Share Section Only */}
      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center">
        <div className="flex items-center gap-2 mb-2 text-gray-700"><Video className="w-5 h-5" /> Screen Share</div>
        <div className="w-full flex flex-row gap-2 bg-black rounded-xl overflow-hidden" style={{ height: isScreenSharing || remoteScreenSharing? 'calc(100% - 75px)' : '150px', position: "relative" }}>
          <div className="w-full h-full relative bg-gray-900 rounded-xl">
            <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {(isScreenSharing || remoteScreenSharing) && (
              <>
                <button className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded hover:bg-gray-900" onClick={stopScreenShare}>Stop Sharing</button>
                <button
                  className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded hover:bg-gray-900"
                  onClick={() => {
                    if (screenShareVideoRef.current) {
                      if (screenShareVideoRef.current.requestFullscreen) {
                        screenShareVideoRef.current.requestFullscreen();
                      } else if (screenShareVideoRef.current.webkitRequestFullscreen) {
                        screenShareVideoRef.current.webkitRequestFullscreen();
                      } else if (screenShareVideoRef.current.msRequestFullscreen) {
                        screenShareVideoRef.current.msRequestFullscreen();
                      }
                    }
                  }}
                >
                  Fullscreen
                </button>
              </>
            )}
          </div>
        </div>
        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-4">
{!isScreenSharing && (
  <button
    onClick={shareScreen}
    className={`bg-teal-700 text-white px-4 py-2 rounded-xl ${isMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
    disabled={isMobile}
  >
    Share Screen
  </button>
)}
{mobileScreenShareError && (
  <div className="text-red-600 text-sm w-full">{mobileScreenShareError}</div>
)}          
{issueFile && (
            <a href={`${API_URL}/uploads/${issueFile}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center justify-center" style={{ textDecoration: 'none' }}>
              View Attached File
            </a>
          )}
        </div>
        <div className="mt-4 text-gray-500 text-sm hidden md:block w-full">
          <form className="space-y-4" onSubmit={handleSolutionSubmit}>
            <label className="font-bold">Solution concluded:</label>
            <input
              type="text"
              value={solutionProvided}
              placeholder="Solution"
              className="w-full px-4 py-2 border rounded-xl my-2"
              required
              onChange={handleSolutionChange} />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl ml-2">Submit Solution</button>
          </form>
        </div>
      </div>
      <div className="mt-4 text-gray-500 text-sm md:hidden">
        <form className="space-y-4" onSubmit={handleSolutionSubmit}>
          <label className="font-bold">Solution concluded:</label>
          <input
            type="text"
            value={solutionProvided}
            placeholder="Solution"
            className="w-full px-4 py-2 border rounded-xl my-2"
            required
            onChange={handleSolutionChange} />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl ml-2">Submit Solution</button>
        </form>
      </div>
    </div>
  );
}
