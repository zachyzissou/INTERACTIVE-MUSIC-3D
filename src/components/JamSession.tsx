// src/components/JamSession.tsx
'use client'
// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react'
import { logger } from '../lib/logger'

// Temporary mock for motion during migration
const motion: any = new Proxy({}, {
  get: () => (props: any) => React.createElement('div', props)
})

interface Participant {
  id: string
  name: string
  connected: boolean
  audioLevel: number
}

interface JamMessage {
  type: 'note' | 'chord' | 'beat' | 'sync'
  objectId: string
  data: any
  timestamp: number
  userId: string
}

export function JamSession() {
  const [isHosting, setIsHosting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map())
  const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map())
  const localStream = useRef<MediaStream | null>(null)

  // WebRTC configuration
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const createRoom = async () => {
    try {
      const code = generateRoomCode()
      setRoomCode(code)
      setIsHosting(true)
      setIsConnected(true)
      
      // Get user media for audio sharing
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      
      logger.info(`Created jam session room: ${code}`)
    } catch (err) {
      setError('Failed to create room: ' + String(err))
      logger.error('Failed to create jam session room: ' + String(err))
    }
  }

  const joinRoom = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a room code')
      return
    }

    try {
      setIsConnected(true)
      
      // Get user media
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      })
      
      // In a real implementation, this would connect to a signaling server
      // For now, we'll simulate the connection
      logger.info(`Joining jam session room: ${joinCode}`)
      
      // Simulate adding the host as a participant
      setParticipants([
        { id: 'host', name: 'Host', connected: true, audioLevel: 0 }
      ])
      
    } catch (err) {
      setError('Failed to join room: ' + String(err))
      logger.error('Failed to join jam session room: ' + String(err))
      setIsConnected(false)
    }
  }

  const leaveSession = () => {
    // Clean up connections
    peerConnections.current.forEach(pc => pc.close())
    dataChannels.current.clear()
    peerConnections.current.clear()
    
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
      localStream.current = null
    }
    
    setIsConnected(false)
    setIsHosting(false)
    setParticipants([])
    setRoomCode('')
    setJoinCode('')
    setError(null)
    
    logger.info('Left jam session')
  }

  const sendJamMessage = (message: Omit<JamMessage, 'timestamp' | 'userId'>) => {
    const fullMessage: JamMessage = {
      ...message,
      timestamp: Date.now(),
      userId: 'local' // In real implementation, this would be the user's ID
    }
    
    // Broadcast to all connected peers
    dataChannels.current.forEach(channel => {
      if (channel.readyState === 'open') {
        channel.send(JSON.stringify(fullMessage))
      }
    })
    
    logger.debug('Sent jam message: ' + JSON.stringify(fullMessage))
  }

  // Expose jam message sender globally for integration with audio system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      ;(window as any).__sendJamMessage = sendJamMessage
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed top-4 left-4 bg-black/80 backdrop-blur-md text-white p-4 rounded-lg border border-purple-500/30 min-w-[300px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Jam Session
        </h3>
        {isConnected && (
          <button
            onClick={leaveSession}
            className="text-red-400 hover:text-red-300 transition-colors"
            aria-label="Leave jam session"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-2 rounded mb-4">
          {error}
        </div>
      )}

      {!isConnected ? (
        <div className="space-y-4">
          <button
            onClick={createRoom}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Create Room
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/80 text-gray-400">or</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter room code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-gray-800/50 border border-gray-600 text-white p-2 rounded-lg focus:border-purple-500 focus:outline-none"
              maxLength={6}
            />
            <button
              onClick={joinRoom}
              disabled={!joinCode.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {isHosting && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg">
              <div className="font-semibold mb-1">Room Code:</div>
              <div className="text-2xl font-mono tracking-wider">{roomCode}</div>
              <div className="text-sm text-green-300 mt-1">Share this code with others</div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-semibold text-gray-300 mb-2">
              Participants ({participants.length + 1})
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-purple-500/20 p-2 rounded">
                <span className="font-medium">You</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                  <span>{participant.name}</span>
                  <div className={`w-2 h-2 rounded-full ${participant.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-400 p-2 bg-gray-800/50 rounded">
            🎵 Musical interactions are synchronized across all participants
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default JamSession
