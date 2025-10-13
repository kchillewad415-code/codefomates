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
  const [solutionProvided, setSolutionProvided] = useState("");
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const [mobileScreenShareError, setMobileScreenShareError] = useState("");

  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const isNegotiatingRef = useRef(false);
  const iceQueueRef = useRef([]);

  const RTC_CONFIG = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
    ]
  };

  // Auto-scroll chat
  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize socket, fetch data and setup listeners
  useEffect(() => {
    const name = user?.username || "Anonymous";
    const mail = user?.email || "";
    setUsername(name);
    setEmail(mail);

    setLoading(true);
    axios.get(`${API_URL}/chat/${roomId}`)
      .then(res => {
        setMessages(res.data.map(msg => ({ id: msg._id, sender: msg.sender, text: msg.message, time: msg.time })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    axios.get(`${API_URL}/issues/${roomId}`)
      .then(res => {
        if (res.data?.solution) setSolutionProvided(res.data.solution);
        if (res.data) setIssue(res.data);
        if (res.data?.file?.filename) setIssueFile(res.data.file.filename);
        else setIssueFile(null);
      })
      .catch(() => setIssueFile(null));

    // Setup socket
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinRoom', roomId, name);

    // Socket handlers
    const handleScreenShareLayout = (active) => setRemoteScreenSharing(active);
    const handleChatMessage = (msg) => {
      setMessages(prev => [...prev, { id: Date.now(), sender: msg.sender, text: msg.message, time: msg.time }]);
    };
const handleOffer = async ({ offer }) => {
  if (!offer) return; // ignore empty offers

  if (!peerRef.current) initPeerConnection();

  try {
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
    await flushIceQueue();
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);
    socketRef.current.emit("answer", { roomId, answer });
  } catch (err) {
    console.error("handleOffer error:", err);
  }
};
const handleAnswer = async ({ answer }) => {
  if (!answer) return;
  try {
    await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    await flushIceQueue();
  } catch (err) {
    console.error("handleAnswer error:", err);
  }
};
    const handleIceCandidate = async ({ candidate }) => {
        if (!candidate) return; // ignore null candidates
  if (!peerRef.current) return; // no connection yet

  try {
    // Only add if remote description is set
    if (peerRef.current.remoteDescription) {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      // queue ICE until remoteDescription is ready
      iceQueueRef.current.push(candidate);
    }
  } catch (err) {
    console.error("addIceCandidate error:", err);
  }
    };
    const handleScreenShareStopped = () => {
      // Remote stopped: clear remote video and recreate peer for future sessions
      setRemoteScreenSharing(false);
      if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = null;
      if (peerRef.current) { try { peerRef.current.close(); } catch (e) {} peerRef.current = null; }
    };
    const handleForceClearVideo = () => {
      if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = null;
      setRemoteScreenSharing(false);
    };

    socketRef.current.on('screenShareLayout', handleScreenShareLayout);
    socketRef.current.on('chatMessage', handleChatMessage);
    socketRef.current.on('offer', handleOffer);
    socketRef.current.on('answer', handleAnswer);
    socketRef.current.on('ice-candidate', handleIceCandidate);
    socketRef.current.on('screenShareStopped', handleScreenShareStopped);
    socketRef.current.on('forceClearVideo', handleForceClearVideo);

    return () => {
      if (!socketRef.current) return;
      socketRef.current.off('screenShareLayout', handleScreenShareLayout);
      socketRef.current.off('chatMessage', handleChatMessage);
      socketRef.current.off('offer', handleOffer);
      socketRef.current.off('answer', handleAnswer);
      socketRef.current.off('ice-candidate', handleIceCandidate);
      socketRef.current.off('screenShareStopped', handleScreenShareStopped);
      socketRef.current.off('forceClearVideo', handleForceClearVideo);
      socketRef.current.disconnect();
      if (peerRef.current) { try { peerRef.current.close(); } catch(e) {} peerRef.current = null; }
    };
  }, [user, roomId]);

  // Send chat
  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socketRef.current.emit('chatMessage', { roomId, message: input, sender: username, email });
    setInput("");
  };

  // Initialize RTC peer (always fresh)
  const initPeerConnection = () => {
    if (peerRef.current) {
      try { peerRef.current.close(); } catch (e) {}
      peerRef.current = null;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerRef.current = pc;

    pc.ontrack = (event) => {
      // Prefer event.streams if available (clean single-stream attach)
      let remoteStream = null;
      if (event.streams && event.streams[0]) {
        remoteStream = event.streams[0];
      } else {
        remoteStream = new MediaStream();
        event.receivers?.forEach(r => {
          if (r.track) remoteStream.addTrack(r.track);
        });
      }
      if (screenShareVideoRef.current) {
        screenShareVideoRef.current.srcObject = remoteStream;
        screenShareVideoRef.current.onloadedmetadata = () => screenShareVideoRef.current.play().catch(() => {});
      }
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        socketRef.current.emit('ice-candidate', { roomId, candidate: evt.candidate });
      }
    };

    pc.onnegotiationneeded = async () => {
      // prevent overlapping negotiation
      if (isNegotiatingRef.current) return;
      isNegotiatingRef.current = true;
      try {
        if (pc.signalingState !== "stable") {
          // skip if not stable
          return;
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit('offer', { roomId, offer: pc.localDescription });
      } catch (err) {
        console.error("negotiation error:", err);
      } finally {
        isNegotiatingRef.current = false;
      }
    };

    return pc;
  };
const flushIceQueue = async () => {
  if (!peerRef.current || !peerRef.current.remoteDescription) return;
  while (iceQueueRef.current.length) {
    const candidate = iceQueueRef.current.shift();
    try {
      await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error("flushIceQueue failed:", e);
    }
  }
};
  // Helper: create/send offer when we manually want to start negotiation
const createAndSendOffer = async () => {
  const pc = peerRef.current;
  if (!pc || !socketRef.current) return;
  if (isNegotiatingRef.current) return;

  isNegotiatingRef.current = true;

  try {
    // Wait a short tick to ensure tracks are stable
    await new Promise(res => setTimeout(res, 50));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit("offer", { roomId, offer: pc.localDescription });
  } catch (err) {
    console.error("createAndSendOffer error:", err);
  } finally {
    isNegotiatingRef.current = false;
  }
};

  // Share screen
  const shareScreen = async () => {
    if (isMobile) {
      setMobileScreenShareError("Screen sharing is not supported on mobile browsers.");
      return;
    }
    try {
      // always recreate peer
      if (peerRef.current) { try { peerRef.current.close(); } catch (e) {} peerRef.current = null; }
      initPeerConnection();

      const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setIsScreenSharing(true);
      setMobileScreenShareError("");
      setScreenStream(sStream);
      socketRef.current.emit('screenShareLayout', true);

      if (screenShareVideoRef.current) {
        screenShareVideoRef.current.srcObject = sStream;
        screenShareVideoRef.current.onloadedmetadata = () => screenShareVideoRef.current.play().catch(() => {});
      }

      // add tracks
      sStream.getTracks().forEach(track => {
        peerRef.current.addTrack(track, sStream);
      });

      // perform offer/negotiation
      await createAndSendOffer();

      // handle user pressing browser "Stop sharing" button
      const vTrack = sStream.getVideoTracks()[0];
      if (vTrack) vTrack.onended = () => stopScreenShare();
    } catch (err) {
      console.error("shareScreen error:", err);
      setMobileScreenShareError("Screen sharing failed. Your browser may not support it or permission was denied.");
      setIsScreenSharing(false);
    }
  };

  // Stop screen share
  const stopScreenShare = async () => {
    setIsScreenSharing(false);
    socketRef.current.emit('screenShareLayout', false);
    socketRef.current.emit('screenShareStopped', { roomId });

    // clear local video element
    if (screenShareVideoRef.current?.srcObject) {
      try {
        screenShareVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      } catch (e) {}
      screenShareVideoRef.current.srcObject = null;
    }

    if (screenStream) {
      try { screenStream.getTracks().forEach(t => t.stop()); } catch (e) {}
      setScreenStream(null);
    }

    // close peer fully
    if (peerRef.current) {
      try { peerRef.current.close(); } catch (e) {}
      peerRef.current = null;
    }

    // force remote clear as extra safety
    socketRef.current.emit('forceClearVideo', { roomId });
  };

  // Listen for remote screen share stopped (redundant safety)
  useEffect(() => {
    if (!socketRef.current) return;
    const onRemoteStopped = () => {
      setRemoteScreenSharing(false);
      if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = null;
      if (peerRef.current) { try { peerRef.current.close(); } catch (e) {} peerRef.current = null; }
    };
    socketRef.current.on('screenShareStopped', onRemoteStopped);
    return () => socketRef.current?.off('screenShareStopped', onRemoteStopped);
  }, []);

  const handleSolutionChange = (e) => setSolutionProvided(e.target.value);
  const handleSolutionSubmit = (e) => {
    e.preventDefault();
    if (!solutionProvided.trim()) return;
    const updateIssues = { ...issue, solution: solutionProvided };
    updateIssue(updateIssues._id, updateIssues);
  };
  const updateIssue = async (id, updateIssue) => {
    try {
      await API.put(`/issues/${id}`, updateIssue);
      alert("Updated successfully!");
    } catch (err) {
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
          <p><strong>{issue?.title ? `Issue:- ${issue.title}` : ''}</strong></p>
          <button className="p-1 md:hidden rounded-full bg-blue-100 hover:bg-blue-200" aria-label="Show Video Section">
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
                  <div key={msg.id} className={`p-2 rounded-xl max-w-xs text-sm flex flex-col ${isOwn ? "bg-blue-100 items-end" : "bg-gray-200 items-start"}`} style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', marginLeft: isOwn ? 'auto' : 0, marginRight: isOwn ? 0 : 'auto', textAlign: 'left' }}>
                    <div style={{ textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>{msg.sender}</strong>
                    </div>
                    <div style={{ textAlign: 'left', width: '100%' }}>{msg.text}</div>
                    <span className="block w-full text-right text-xs text-gray-500">{msg.time ? new Date(msg.time).toLocaleTimeString() : ''}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-xl" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl">Send</button>
        </form>
      </div>

      {/* Screen Share Section */}
      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center">
        <div className="flex items-center gap-2 mb-2 text-gray-700"><Video className="w-5 h-5" /> Screen Share</div>
        <div className="w-full flex flex-row gap-2 bg-black rounded-xl overflow-hidden" style={{ height: isScreenSharing || remoteScreenSharing? 'calc(100% - 75px)' : '150px', position: "relative" }}>
          <div className="w-full h-full relative bg-gray-900 rounded-xl">
            <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            {(isScreenSharing || remoteScreenSharing) && (
              <>
                <button className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded hover:bg-gray-900" onClick={stopScreenShare}>Stop Sharing</button>
                <button className="absolute top-2 left-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded hover:bg-gray-900" onClick={() => {
                  if (screenShareVideoRef.current) {
                    if (screenShareVideoRef.current.requestFullscreen) screenShareVideoRef.current.requestFullscreen();
                    else if (screenShareVideoRef.current.webkitRequestFullscreen) screenShareVideoRef.current.webkitRequestFullscreen();
                    else if (screenShareVideoRef.current.msRequestFullscreen) screenShareVideoRef.current.msRequestFullscreen();
                  }
                }}>Fullscreen</button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {!isScreenSharing && (
            <button onClick={shareScreen} className={`bg-teal-700 text-white px-4 py-2 rounded-xl ${isMobile ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isMobile}>Share Screen</button>
          )}
          {mobileScreenShareError && <div className="text-red-600 text-sm w-full">{mobileScreenShareError}</div>}
          {issueFile && (
            <a href={`${API_URL}/uploads/${issueFile}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center justify-center" style={{ textDecoration: 'none' }}>
              View Attached File
            </a>
          )}
        </div>

        <div className="mt-4 text-gray-500 text-sm hidden md:block w-full">
          <form className="space-y-4" onSubmit={handleSolutionSubmit}>
            <label className="font-bold">Solution concluded:</label>
            <input type="text" value={solutionProvided} placeholder="Solution" className="w-full px-4 py-2 border rounded-xl my-2" required onChange={handleSolutionChange} />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl ml-2">Submit Solution</button>
          </form>
        </div>
      </div>

      <div className="mt-4 text-gray-500 text-sm md:hidden">
        <form className="space-y-4" onSubmit={handleSolutionSubmit}>
          <label className="font-bold">Solution concluded:</label>
          <input type="text" value={solutionProvided} placeholder="Solution" className="w-full px-4 py-2 border rounded-xl my-2" required onChange={handleSolutionChange} />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-xl ml-2">Submit Solution</button>
        </form>
      </div>
    </div>
  );
}
