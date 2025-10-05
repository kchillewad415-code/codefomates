import React, { useEffect, useRef, useState } from 'react';
import { Video, MessageSquare } from "lucide-react";
import { io } from 'socket.io-client';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export default function LiveSession({ user }) {
  const { roomId } = useParams();
    const [messages, setMessages] = useState([
    { id: 1, sender: "Needy", text: "Hi, I need help with my API call." },
    { id: 2, sender: "Solver", text: "Sure, let’s take a look." },
  ]);
    const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [showVideoSection, setShowVideoSection] = useState(false);
  const videoSectionRef = useRef(null);
  const socketRef = useRef();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenShareVideoRef = useRef(null);
  const peerRef = useRef();
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const screenTrackRef = useRef(null);
  const messagesEndRef = useRef(null);
    const [issueFile, setIssueFile] = useState(null);

    // Ensure camera video element always gets the latest stream
    useEffect(() => {
      if (localVideoRef.current && cameraStream) {
        localVideoRef.current.srcObject = cameraStream;
      } else if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }, [cameraStream]);

    // Ensure screen share video element always gets the latest stream
    useEffect(() => {
      if (screenShareVideoRef.current && screenStream) {
        screenShareVideoRef.current.srcObject = screenStream;
      } else if (screenShareVideoRef.current) {
        screenShareVideoRef.current.srcObject = null;
      }
    }, [screenStream]);

  useEffect(() => {
    // Use logged-in user's name and email if available
    let name = user?.username || "Anonymous";
    let mail = user?.email || "";
    setUsername(name);
    setEmail(mail);

    // Fetch chat history from backend for this room
      setLoading(true); // Set loading to true before the API call
      axios.get(`${API_URL}/chat/${roomId}`).then(res => {
      setMessages(res.data.map(msg => ({
        id: msg._id,
        sender: msg.sender,
        text: msg.message,
        time: msg.time
      })));
        setLoading(false); // Set loading to false after the messages are set
    });

      // Fetch issue details to get attached file
      axios.get(`${API_URL}/issues/${roomId}`).then(res => {
        if (res.data && res.data.file && res.data.file.filename) {
          setIssueFile(res.data.file.filename);
        } else {
          setIssueFile(null);
        }
      }).catch(() => setIssueFile(null));

    socketRef.current = io(SOCKET_URL);
    // Pass username when joining room
    socketRef.current.emit('joinRoom', roomId, name);

    socketRef.current.on('chatHistory', (msgs) => {
      setMessages(msgs.map(msg => ({
        id: msg._id,
        sender: msg.sender,
        text: msg.message,
        time: msg.time
      })));
    });

    socketRef.current.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, { id: Date.now(), sender: msg.sender, text: msg.message, time: msg.time }]);
    });

    // Video signaling handlers
    socketRef.current.on('offer', async (offer) => {
      if (!peerRef.current) await startVideo(false);
      await peerRef.current.setRemoteDescription(offer);
      const answer = await peerRef.current.createAnswer();
      await peerRef.current.setLocalDescription(answer);
      socketRef.current.emit('answer', answer);
    });
    socketRef.current.on('answer', async (answer) => {
      await peerRef.current.setRemoteDescription(answer);
    });
    socketRef.current.on('ice-candidate', async (candidate) => {
      try {
        await peerRef.current.addIceCandidate(candidate);
      } catch (e) { console.error(e); }
    });
    // Update remote video on new track
    if (peerRef.current) {
      peerRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };
    }

    return () => {
      socketRef.current.disconnect();
    };
  }, [user, roomId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socketRef.current.emit('chatMessage', {
        roomId,
        message: input,
        sender: username,
        email: email,
      });
      setInput("");
    }
  };

  const startVideo = async (isCaller = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setIsVideoStarted(true);
    setCameraStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    // Setup peer connection for camera stream (if needed)
    // ...existing code...
  };

  const endVideo = () => {
    setIsVideoStarted(false);
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    // ...existing code...
  };

  const shareScreen = async () => {
    try {
      const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);
      setScreenStream(sStream);
      if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = sStream;
      sStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      setIsScreenSharing(false);
      console.error('Screen share error:', err);
    }
  };

  const stopScreenShare = async () => {
    setIsScreenSharing(false);
    if (screenShareVideoRef.current && screenShareVideoRef.current.srcObject) {
      screenShareVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      screenShareVideoRef.current.srcObject = null;
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6 ">
      {/* Chat Section */}
  <div className="flex-1 bg-white rounded-xl shadow p-4 flex flex-col" style={{ height: 'calc(100vh - 265px)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <div className="flex items-center justify-between mb-2 text-gray-700">
          <span className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Chat
          </span>
          {/* Small video icon at the top right of chat */}
          <button
            className="p-1 md:hidden rounded-full bg-blue-100 hover:bg-blue-200"
            onClick={() => {
              setShowVideoSection(true);
              setTimeout(() => {
                if (videoSectionRef.current) {
                  videoSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
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
                    className={`p-2 rounded-xl max-w-xs text-sm flex flex-col ${
                      isOwn ? "bg-blue-100 items-end" : "bg-gray-200 items-start"
                    }`}
                    style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', marginLeft: isOwn ? 'auto' : 0, marginRight: isOwn ? 0 : 'auto', textAlign: 'left' }}
                  >
                    <div style={{ textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>{msg.sender}</strong>
                    </div>
                    <div style={{ textAlign: 'left', width: '100%' }}>{msg.text}</div>
                    <span className="block text-xs text-gray-500">
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

      {/* Video Section for desktop, icon for mobile */}
  <div ref={videoSectionRef} className={`flex-1 bg-white rounded-xl shadow p-4 flex flex-col justify-center items-center ${showVideoSection ? '' : 'hidden'} md:block`}>
        {/* Mobile: show icon if not expanded, else show video section */}
        <div className="w-full md:block">
          {/* Show video section on desktop or if expanded on mobile */}
          <div className={`w-full ${showVideoSection ? '' : 'hidden'} md:block`}>
            {/* Close button for mobile */}
            <div className="md:hidden flex justify-end mb-2">
              <button
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={() => setShowVideoSection(false)}
                aria-label="Close Video Section"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="16" y2="16"/><line x1="16" y1="4" x2="4" y2="16"/></svg>
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2 text-gray-700">
              <Video className="w-5 h-5" /> Video Call
            </div>
            <div className="w-full h-64 bg-black rounded-xl text-white flex flex-col items-center justify-center">
              <div className={isScreenSharing ? "flex flex-row items-center justify-center w-full h-full" : "flex flex-row items-center justify-center w-full h-full"}>
                {isScreenSharing ? (
                  isVideoStarted ? (
                    <>
                      {/* Screen share takes 80% width */}
                      <div style={{ width: '80%', height: '100%', background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginRight: '4px' }}>
                        <video ref={screenShareVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'black' }} />
                        <button
                          className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded hover:bg-gray-900"
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
                      </div>
                      {/* Local and remote videos stack vertically in 20% */}
                      <div style={{ width: '20%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ flex: 1, background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: '2px' }}>
                          <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'black', transform: 'scaleX(-1)' }} />
                        </div>
                        <div style={{ flex: 1, background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                          {/* Uncomment and connect remote stream for real use */}
                          {/* <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'black' }} /> */}
                          
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <video ref={screenShareVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'black' }} />
                      <button
                        className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white px-3 py-1 rounded hover:bg-gray-900"
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
                    </div>
                  )
                ) : (
                  <>
                    {/* Local video placeholder */}
                    <div style={{ width: '45%', height: '100%', background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {isVideoStarted ? (
                        <video ref={localVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'black', transform: 'scaleX(-1)' }} />
                      ) : null}
                    </div>
                    {/* Remote video placeholder */}
                    <div style={{ width: '45%', height: '100%', background: '#222', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {/* Uncomment and connect remote stream for real use */}
                      {/* <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', borderRadius: '8px', background: 'black' }} /> */}
                      
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-row gap-4 mt-4">
              {/* Show Start Video only when camera is not started */}
              {!isVideoStarted && (
                <button onClick={() => startVideo(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl">Start Video</button>
              )}
              {/* Show End Video only when camera is started */}
              {isVideoStarted && (
                <button onClick={endVideo} className="bg-red-600 text-white px-4 py-2 rounded-xl">Stop Video</button>
              )}
              {/* Show Share Screen only when not already sharing screen */}
              {!isScreenSharing && (
                <button onClick={shareScreen} className="bg-teal-700 text-white px-4 py-2 rounded-xl">Share Screen</button>
              )}
              {/* Show Stop Sharing only when screen sharing is active */}
              {isScreenSharing && (
                <button onClick={stopScreenShare} className="bg-yellow-600 text-white px-4 py-2 rounded-xl">Stop Sharing</button>
              )}
              {/* Show attached file link if available */}
              {issueFile && (
                <a
                  href={`${API_URL}/uploads/${issueFile}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center justify-center hover:bg-indigo-700"
                  style={{ textDecoration: 'none' }}
                >
                  View Attached File
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

