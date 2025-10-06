import React, { useEffect, useRef, useState } from 'react';
import { Video, MessageSquare } from "lucide-react";
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function LiveSession({ user }) {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showVideoSection, setShowVideoSection] = useState(false);
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [issueFile, setIssueFile] = useState(null);

  const videoSectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const peerRef = useRef();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareVideoRef = useRef(null);

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
      if (res.data?.file?.filename) setIssueFile(res.data.file.filename);
      else setIssueFile(null);
    }).catch(() => setIssueFile(null));

    // Setup socket
    socketRef.current = io(SOCKET_URL);
    socketRef.current.emit('joinRoom', roomId, name);

    socketRef.current.on('chatMessage', (msg) => {
      setMessages(prev => [...prev, { id: Date.now(), sender: msg.sender, text: msg.message, time: msg.time }]);
    });

    // WebRTC signaling
    socketRef.current.on('offer', async (offer) => {
      if (!peerRef.current) await startVideo(false);
      await peerRef.current.setRemoteDescription(offer);
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit('answer', answer);
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

  // Initialize peer connection
  const initPeerConnection = (stream) => {
    peerRef.current = new RTCPeerConnection();
    stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

    peerRef.current.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    peerRef.current.onicecandidate = (event) => {
      if (event.candidate) socketRef.current.emit('ice-candidate', event.candidate);
    };
  };

  // Start camera
  const startVideo = async (isCaller = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setIsVideoStarted(true);
      setCameraStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      initPeerConnection(stream);

      if (isCaller) {
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socketRef.current.emit('offer', offer);
      }
    } catch (err) { console.error(err); }
  };

  // Stop camera
  const endVideo = () => {
    setIsVideoStarted(false);
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  };

  // Share screen
  const shareScreen = async () => {
    try {
      const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);
      setScreenStream(sStream);
      if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = sStream;

      if (peerRef.current) sStream.getTracks().forEach(track => peerRef.current.addTrack(track, sStream));
      sStream.getVideoTracks()[0].onended = stopScreenShare;
    } catch (err) { console.error(err); setIsScreenSharing(false); }
  };

  // Stop screen share
  const stopScreenShare = () => {
    setIsScreenSharing(false);
    if (screenShareVideoRef.current?.srcObject) {
      screenShareVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      screenShareVideoRef.current.srcObject = null;
    }
    if (screenStream) {
      if (peerRef.current) {
        const senders = peerRef.current.getSenders();
        senders.forEach(sender => {
          if (screenStream.getTracks().includes(sender.track)) peerRef.current.removeTrack(sender);
        });
      }
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
      {/* Chat Section */}
      <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col"
           style={{ height: 'calc(100vh - 265px)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-2 text-gray-700">
          <span className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Chat</span>
          <button
            className="p-1 md:hidden rounded-full bg-blue-100 hover:bg-blue-200"
            onClick={() => { setShowVideoSection(true); setTimeout(() => videoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100); }}
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
                  <div key={msg.id} className={`p-2 rounded-xl max-w-xs text-sm flex flex-col ${isOwn ? "bg-blue-100 items-end" : "bg-gray-200 items-start"}`} 
                       style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: '6px' }}><strong>{msg.sender}</strong></div>
                    <div>{msg.text}</div>
                    <span className="block text-xs text-gray-500">{msg.time ? new Date(msg.time).toLocaleTimeString() : ''}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-xl"/>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl">Send</button>
        </form>
      </div>

      {/* Video Section */}
      <div ref={videoSectionRef} className={`flex-1 bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center ${showVideoSection ? '' : 'hidden'} md:block`}>
        <div className="flex items-center gap-2 mb-2 text-gray-700"><Video className="w-5 h-5" /> Video Call</div>

        <div className="w-full flex flex-row gap-2 bg-black rounded-xl overflow-hidden" style={{ height: isScreenSharing ? 'calc(100% - 75px)' : '150px', position:"relative" } }>
          {isScreenSharing ? (
            <>
              <div className="w-full h-full relative bg-gray-900 rounded-xl">
                <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded hover:bg-gray-900" onClick={stopScreenShare}>Stop Sharing</button>
              </div>
              <div className="w-full h-full flex flex-col gap-2"style={{width: "25%", height:"100%"}}>
                <div className="h-full w-full flex-1 bg-gray-900 rounded-xl relative bg-white">
                  <video ref={localVideoRef} autoPlay muted playsInline className={`object-cover transition-all duration-300 rounded-full w-full h-full`} style={{height:"50%"}} />
                  <span className="absolute bottom-1 left-1 text-white text-xs">You</span>
                </div>
                <div className="h-full w-full flex-1 bg-gray-900 rounded-xl relative bg-white">
                  <video ref={remoteVideoRef} autoPlay playsInline className={`object-cover transition-all duration-300 rounded-full w-full h-full`} style={{height:"50%"}}/>
                  <span className="absolute bottom-1 left-1 text-white text-xs">Remote</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1 bg-gray-900 rounded-xl relative">
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-white text-xs">You</span>
              </div>
              <div className="flex-1 bg-gray-900 rounded-xl relative">
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 text-white text-xs">Remote</span>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 mt-4">
          {!isVideoStarted && <button onClick={() => startVideo(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Start Video</button>}
          {isVideoStarted && <button onClick={endVideo} className="bg-red-600 text-white px-4 py-2 rounded-xl">Stop Video</button>}
          {!isScreenSharing && <button onClick={shareScreen} className="bg-teal-700 text-white px-4 py-2 rounded-xl">Share Screen</button>}
          {issueFile && (
            <a href={`${API_URL}/uploads/${issueFile}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 flex items-center justify-center" style={{ textDecoration: 'none' }}>
              View Attached File
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
