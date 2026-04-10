import { Sun, Moon, Check } from 'lucide-react';
import { useState } from 'react';

const SG = { fontFamily: "'Space Grotesk', sans-serif" };

export default function ThemeGuide({ onSelect }) {
  const [chosen, setChosen] = useState('light'); // pre-select light

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="w-[400px] bg-[#18181b] border border-white/[0.1] rounded-3xl p-8 shadow-2xl text-center"
        style={{ animation: 'chatEnter 0.4s cubic-bezier(0,0,0.2,1) both' }}>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3d9e7a] to-[#1e7a57] flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(61,158,122,0.4)]">
          <span className="text-2xl">✦</span>
        </div>

        <h2 className="text-white text-[20px] font-bold mb-1.5" style={SG}>Welcome to DocuChat</h2>
        <p className="text-[#6a6a6f] text-[14px] mb-8">Choose your preferred theme to get started.<br/>You can switch anytime from the chat.</p>

        {/* Theme cards */}
        <div className="flex gap-3 mb-7">
          {/* Light */}
          <button onClick={() => setChosen('light')}
            className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              chosen === 'light' ? 'border-white/70 bg-white/10' : 'border-white/10 bg-white/[0.04] hover:border-white/25'
            }`}
          >
            {chosen === 'light' && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                <Check size={11} className="text-[#111]" strokeWidth={3} />
              </div>
            )}
            {/* Preview */}
            <div className="w-full h-16 rounded-xl bg-white border border-black/10 overflow-hidden flex flex-col p-2 gap-1">
              <div className="w-3/4 h-2 rounded bg-[#e0e0e0]" />
              <div className="w-1/2 h-2 rounded bg-[#e8e8e8]" />
              <div className="self-end w-2/3 h-2 rounded bg-[#ececec] mt-auto" />
            </div>
            <div className="flex items-center gap-1.5">
              <Sun size={14} className="text-yellow-400" />
              <span className="text-white text-[13px] font-semibold">Light</span>
            </div>
            <span className="text-[11px] text-[#5a5a5f]">Clean & bright</span>
          </button>

          {/* Dark */}
          <button onClick={() => setChosen('dark')}
            className={`flex-1 flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
              chosen === 'dark' ? 'border-[#3d9e7a] bg-[#3d9e7a]/10' : 'border-white/10 bg-white/[0.04] hover:border-white/25'
            }`}
          >
            {chosen === 'dark' && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#3d9e7a] flex items-center justify-center">
                <Check size={11} className="text-white" strokeWidth={3} />
              </div>
            )}
            {/* Preview */}
            <div className="w-full h-16 rounded-xl bg-[#111] border border-white/10 overflow-hidden flex flex-col p-2 gap-1">
              <div className="w-3/4 h-2 rounded bg-[#2f2f2f]" />
              <div className="w-1/2 h-2 rounded bg-[#252525]" />
              <div className="self-end w-2/3 h-2 rounded bg-[#2f2f2f] mt-auto" />
            </div>
            <div className="flex items-center gap-1.5">
              <Moon size={14} className="text-[#3d9e7a]" />
              <span className="text-white text-[13px] font-semibold">Dark</span>
            </div>
            <span className="text-[11px] text-[#5a5a5f]">Easy on the eyes</span>
          </button>
        </div>

        <button onClick={() => onSelect(chosen)}
          className="w-full py-3.5 rounded-2xl bg-white text-[#111] font-bold text-[14px] hover:bg-white/90 active:scale-[0.98] transition-all"
          style={SG}>
          Get Started →
        </button>

        <p className="text-[11px] text-[#3a3a3f] mt-3">
          Change anytime with the <Sun size={10} className="inline" /> / <Moon size={10} className="inline" /> button in the chat.
        </p>
      </div>
    </div>
  );
}
