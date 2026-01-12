
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, PhoneOff, Sparkles, BrainCircuit, Headphones } from 'lucide-react';

// Decoding and Encoding functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveConsultation: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState('Ready for consultation');
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  const startConsultation = async () => {
    try {
      setStatus('Connecting to AI Stylist...');
      // Fixed: Strictly using process.env.API_KEY as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setStatus('Consultation Active');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Gemini Live Error:', e);
            setStatus('Connection error');
          },
          onclose: () => {
            setIsActive(false);
            setStatus('Consultation ended');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: 'You are an AI Master Stylist for PAWA Salon. You are an expert in hair health, scalp conditions, and face-shape matching for cuts. Speak warmly and provide professional advice.'
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Failed to start microphone');
    }
  };

  const endConsultation = () => {
    sessionRef.current?.close();
    setIsActive(false);
    setStatus('Ready for consultation');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex p-3 bg-indigo-50 rounded-2xl text-indigo-600 mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">AI Live Consultation</h2>
        <p className="text-gray-500 max-w-lg mx-auto">
          Speak directly with our AI Master Stylist. Get real-time advice on styles, colors, and hair care tailored just for you.
        </p>
      </div>

      <div className="bg-white rounded-[40px] p-12 border border-gray-100 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Visual Pulse Background */}
        <div className={`absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
        
        <div className="relative z-10 w-full flex flex-col items-center space-y-12">
          {/* Avatar Area */}
          <div className="relative">
            <div className={`absolute inset-0 bg-indigo-200 rounded-full blur-3xl transition-transform duration-1000 ${isActive ? 'scale-150 animate-pulse' : 'scale-0'}`}></div>
            <div className={`w-40 h-40 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl transition-all duration-500 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <BrainCircuit className="w-16 h-16 text-white" />
            </div>
            {isActive && (
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-full border-4 border-white"></div>
            )}
          </div>

          <div className="text-center space-y-2">
            <p className={`text-lg font-bold transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
              {status}
            </p>
            {isActive && (
              <div className="flex gap-1 justify-center">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-1 bg-indigo-400 rounded-full animate-bounce" style={{ height: `${Math.random()*20 + 10}px`, animationDelay: `${i*0.1}s` }}></div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            {!isActive ? (
              <button 
                onClick={startConsultation}
                className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-bold text-lg shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3"
              >
                <Headphones className="w-6 h-6" /> Start Voice Consult
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-6 rounded-3xl border shadow-lg transition-all ${isMuted ? 'bg-red-50 text-red-600 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}
                >
                  {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
                <button 
                  onClick={endConsultation}
                  className="bg-red-500 text-white p-6 rounded-3xl shadow-xl hover:bg-red-600 transition-all"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
          <p className="font-bold text-indigo-900 mb-2">How it works</p>
          <p className="text-sm text-indigo-700">Gemini AI analyzes your requests and provides professional salon-quality guidance in real-time.</p>
        </div>
        <div className="p-6 bg-purple-50 rounded-3xl border border-purple-100">
          <p className="font-bold text-purple-900 mb-2">Privacy Focus</p>
          <p className="text-sm text-purple-700">Your audio stream is used only for the consultation and is not stored after the session ends.</p>
        </div>
      </div>
    </div>
  );
};

export default LiveConsultation;
