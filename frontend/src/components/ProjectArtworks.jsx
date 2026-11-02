import React from 'react';

export const ProjectArtwork = ({ id, className = '' }) => {
  switch (id) {
    // -------------------------------------------------------------------------
    // NOYA SKINCARE SUITE
    // -------------------------------------------------------------------------
    case 'noya':
    case 'noya-skincare':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#ebd3c5] via-[#dfbfae] to-[#c99f8d] ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_60%)]" />
          <svg className="absolute -top-4 left-1/4 w-72 h-44 text-emerald-950/25 pointer-events-none transform -rotate-6" viewBox="0 0 200 120" fill="currentColor">
            <path d="M10,20 Q50,40 100,30 Q150,20 190,50 Q160,80 120,60 Q80,80 40,50 Z" />
            <path d="M40,25 C60,5 90,15 100,45 C80,55 50,45 40,25 Z" fill="#2d422a" opacity="0.6" />
            <path d="M80,35 C100,10 130,20 140,55 C120,65 90,55 80,35 Z" fill="#3b5736" opacity="0.7" />
            <path d="M120,40 C140,15 170,25 180,60 C160,70 130,60 120,40 Z" fill="#2d422a" opacity="0.65" />
          </svg>
          <div className="absolute bottom-6 left-12 w-32 h-16 rounded-[40%_60%_70%_30%] bg-gradient-to-br from-[#d9bead] via-[#be9c8a] to-[#997664] shadow-[0_15px_25px_rgba(80,50,35,0.4)] border-t border-white/40" />
          <div className="absolute bottom-4 right-16 w-36 h-20 rounded-[60%_40%_30%_70%] bg-gradient-to-br from-[#dfc5b5] via-[#c4a492] to-[#a07c69] shadow-[0_18px_30px_rgba(80,50,35,0.45)] border-t border-white/50" />

          <div className="relative z-10 flex items-end justify-center gap-6 sm:gap-10 pb-6 sm:pb-8">
            <div className="relative w-44 sm:w-56 h-52 sm:h-64 rounded-xl bg-gradient-to-br from-[#f6c5b9] via-[#f1b4a6] to-[#e49b8c] shadow-[0_20px_45px_rgba(70,30,20,0.35)] border-t border-white/50 p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
              <svg className="absolute right-4 bottom-4 w-28 sm:w-36 h-40 sm:h-52 text-[#8e4a42]/40" viewBox="0 0 100 150" fill="none" stroke="currentColor" strokeWidth="1.2">
                <line x1="50" y1="140" x2="50" y2="10" />
                <path d="M50,30 C30,20 20,40 50,55 C80,40 70,20 50,30 Z" />
                <path d="M50,60 C25,50 15,75 50,90 C85,75 75,50 50,60 Z" />
                <path d="M50,95 C30,85 20,110 50,125 C80,110 70,85 50,95 Z" />
              </svg>
              <div className="relative z-10 pt-4">
                <h4 className="font-serif text-2xl sm:text-3xl text-[#5a2a24] font-normal tracking-wide">Noya</h4>
                <p className="font-serif text-xs sm:text-sm text-[#7e3f36] tracking-widest uppercase mt-0.5">Skincare</p>
              </div>
              <div className="relative z-10 pb-1 text-[8px] text-[#7e3f36]/70 font-mono tracking-widest">PARIS · DUBAI</div>
            </div>

            <div className="relative flex flex-col items-center drop-shadow-[0_20px_35px_rgba(70,30,20,0.4)]">
              <div className="w-9 h-7 rounded-t-lg bg-gradient-to-r from-neutral-100 via-white to-neutral-200 border-t border-white shadow-sm flex items-center justify-center">
                <div className="w-5 h-2 bg-neutral-300 rounded-sm" />
              </div>
              <div className="w-11 h-6 bg-gradient-to-r from-[#d4af37] via-[#fff3b0] to-[#aa8012] shadow-md border-y border-amber-200/60" />
              <div className="w-24 sm:w-32 h-44 sm:h-56 rounded-3xl bg-gradient-to-b from-[#faf4ef] via-[#f3ebe1] to-[#e4d6c7] border border-white/60 p-3 flex flex-col items-center justify-between text-center shadow-lg relative overflow-hidden">
                <div className="pt-8">
                  <h5 className="font-serif text-base sm:text-lg text-[#5a2a24] font-normal tracking-wide">Noya</h5>
                  <p className="font-serif text-[9px] sm:text-[10px] text-[#7e3f36] tracking-widest uppercase">Skincare</p>
                </div>
                <div className="pb-4">
                  <p className="text-[8px] sm:text-[9px] text-[#5a2a24] font-medium tracking-wider">Face Serum</p>
                  <p className="text-[7px] text-[#7e3f36]/80 font-mono mt-0.5">50 ml</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

    case 'noya-box':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#21141c] p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_40%,rgba(244,164,150,0.18),transparent_70%)]" />
          <div className="relative w-64 sm:w-80 h-72 sm:h-96 rounded-2xl bg-gradient-to-br from-[#f8d0c6] via-[#ebb1a4] to-[#d89789] shadow-[0_25px_60px_rgba(0,0,0,0.7)] p-6 sm:p-8 flex flex-col justify-between border-t border-white/60">
            <div className="flex items-center justify-between border-b border-[#823d34]/20 pb-3">
              <span className="font-mono text-[9px] tracking-widest text-[#72322a] uppercase">Rigid Gift Box</span>
              <span className="font-mono text-[9px] text-[#72322a]/70">500 GSM</span>
            </div>
            <div className="my-auto flex flex-col items-center text-center">
              <svg className="w-20 h-28 text-[#6d2f28]/60 mb-3" viewBox="0 0 100 150" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="50" y1="140" x2="50" y2="10" />
                <path d="M50,30 C30,20 20,40 50,55 C80,40 70,20 50,30 Z" />
                <path d="M50,60 C25,50 15,75 50,90 C85,75 75,50 50,60 Z" />
                <path d="M50,95 C30,85 20,110 50,125 C80,110 70,85 50,95 Z" />
              </svg>
              <h3 className="font-serif text-3xl font-normal text-[#4c1d18] tracking-wide">Noya</h3>
              <p className="font-serif text-xs text-[#72322a] tracking-[0.25em] uppercase mt-1">Skincare</p>
            </div>
            <div className="text-center font-mono text-[8px] text-[#72322a]/80 tracking-widest uppercase">
              Pure Botanical Radiance · Formulated in France
            </div>
          </div>
        </div>
      );

    case 'noya-bottle':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#1b1016] via-[#24131e] to-[#12080f] p-6 ${className}`}>
          <div className="relative flex flex-col items-center drop-shadow-[0_30px_50px_rgba(0,0,0,0.85)]">
            <div className="w-12 h-10 rounded-t-xl bg-gradient-to-r from-neutral-200 via-white to-neutral-300 border-t border-white flex items-center justify-center">
              <div className="w-7 h-3 bg-neutral-400 rounded-sm" />
            </div>
            <div className="w-14 h-7 bg-gradient-to-r from-[#d4af37] via-[#fff3b0] to-[#b38615] border-y border-amber-200/70" />
            <div className="w-32 sm:w-40 h-64 sm:h-80 rounded-[2.5rem] bg-gradient-to-b from-[#fffbf8] via-[#f7eee5] to-[#dec9b8] border border-white/80 p-5 flex flex-col items-center justify-between text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-y-0 left-3 w-4 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-[-12deg]" />
              <div className="pt-10">
                <span className="font-serif text-xl sm:text-2xl text-[#4a221d] font-normal tracking-wide block">Noya</span>
                <span className="font-serif text-[10px] sm:text-xs text-[#73352d] tracking-[0.2em] uppercase block mt-0.5">Botanical Serum</span>
              </div>
              <div className="pb-6 border-t border-[#8e453b]/20 w-full pt-3">
                <p className="text-[10px] font-serif text-[#4a221d] font-semibold">Active Rosehip & Squalane</p>
                <p className="text-[8px] font-mono text-[#73352d]/80 mt-1">30 ML / 1.0 FL. OZ.</p>
              </div>
            </div>
          </div>
        </div>
      );

    case 'noya-botanical':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#180e14] p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(244,164,150,0.12),transparent_70%)]" />
          <div className="relative z-10 max-w-sm w-full p-6 sm:p-8 rounded-3xl glass-panel border border-rose-300/20 text-center flex flex-col items-center">
            <span className="text-[9px] font-mono tracking-widest text-rose-300 uppercase mb-4">Brand Emblem Study</span>
            <div className="w-28 h-28 rounded-full border border-rose-300/30 flex items-center justify-center mb-4 bg-gradient-to-b from-rose-950/40 to-transparent">
              <svg className="w-16 h-20 text-rose-200" viewBox="0 0 100 150" fill="none" stroke="currentColor" strokeWidth="1.6">
                <line x1="50" y1="135" x2="50" y2="15" />
                <path d="M50,30 C30,20 20,40 50,55 C80,40 70,20 50,30 Z" />
                <path d="M50,60 C25,50 15,75 50,90 C85,75 75,50 50,60 Z" />
                <path d="M50,95 C30,85 20,110 50,125 C80,110 70,85 50,95 Z" />
              </svg>
            </div>
            <h4 className="font-serif text-xl text-white font-normal">Organic Olive & Myrtle Leaf</h4>
            <p className="text-xs text-neutral-400 font-light mt-2 max-w-xs leading-relaxed">
              Drawn with continuous mathematical Bézier arcs for seamless reproduction on hot-foil stamping and micro embossing.
            </p>
          </div>
        </div>
      );

    case 'noya-label':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#130b10] p-6 ${className}`}>
          <div className="w-72 sm:w-96 rounded-2xl bg-[#fdf9f5] text-[#3d1914] p-6 shadow-2xl border border-white flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-[#3d1914]/15 pb-2">
              <span className="font-serif text-xs font-bold uppercase tracking-wider">Noya Formulation</span>
              <span className="font-mono text-[9px] text-[#73352d]">BATCH #NY-048</span>
            </div>
            <div className="my-4 space-y-2 text-left rtl:text-right">
              <div className="font-serif text-lg font-bold">Cold-Pressed Botanical Elixir</div>
              <p className="text-[10px] text-[#5e2b24] font-mono leading-relaxed">
                Rosa Canina Seed Oil · Simmondsia Chinensis · Camellia Sinensis Leaf Extract · Tocopherol (Vit E).
              </p>
            </div>
            <div className="flex items-center justify-between border-t border-[#3d1914]/15 pt-2 text-[8px] font-mono">
              <span>ECOCERT ORGANIC</span>
              <span className="font-bold">CRUELTY FREE · 100% VEGAN</span>
            </div>
          </div>
        </div>
      );

    case 'noya-stationery':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-[#160c12] via-[#22131b] to-[#12080e] p-6 ${className}`}>
          <div className="relative w-72 sm:w-96 h-56 sm:h-64 rounded-2xl bg-[#faf5f0] shadow-2xl p-6 flex flex-col justify-between border border-white/80 transform -rotate-1">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xl font-normal text-[#4c1e19]">Noya</span>
              <div className="w-6 h-6 rounded-full bg-[#9e4136] flex items-center justify-center text-white text-[9px] font-serif shadow-sm">N</div>
            </div>
            <div className="space-y-1.5 opacity-60">
              <div className="w-full h-1 bg-[#4c1e19]/30 rounded-full" />
              <div className="w-5/6 h-1 bg-[#4c1e19]/20 rounded-full" />
              <div className="w-2/3 h-1 bg-[#4c1e19]/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between border-t border-[#4c1e19]/15 pt-2 text-[8px] font-mono text-[#7a3931]">
              <span>75008 PARIS, FRANCE</span>
              <span>INFO@NOYASKINCARE.COM</span>
            </div>
          </div>
        </div>
      );

    case 'noya-lifestyle':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#dfc1b1] via-[#cfa996] to-[#b78d78] p-6 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.45),transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-48 sm:w-60 h-36 sm:h-44 rounded-2xl bg-white/30 backdrop-blur-md border border-white/60 p-4 flex flex-col items-center justify-center shadow-2xl">
              <span className="font-serif text-2xl text-[#4a201a] font-normal">The Botanical Ritual</span>
              <span className="text-[10px] font-mono tracking-widest text-[#663028] uppercase mt-1">Sunlit Morning Editorial</span>
            </div>
          </div>
        </div>
      );

    case 'noya-palette':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#170c12] p-6 ${className}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md w-full">
            {[
              { name: 'Blush Clay', hex: '#F6C5B9', bg: 'bg-[#f6c5b9]' },
              { name: 'Terracotta', hex: '#8E4A42', bg: 'bg-[#8e4a42]' },
              { name: 'Travertine', hex: '#EBD3C5', bg: 'bg-[#ebd3c5]' },
              { name: 'Deep Burgundy', hex: '#421A28', bg: 'bg-[#421a28]' },
            ].map((c) => (
              <div key={c.hex} className="p-3 rounded-2xl glass-panel border border-white/10 flex flex-col gap-2">
                <div className={`w-full h-16 rounded-xl ${c.bg} shadow-md`} />
                <span className="text-[10px] font-medium text-white">{c.name}</span>
                <span className="text-[8px] font-mono text-neutral-400">{c.hex}</span>
              </div>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // LUMA SKIN SUITE
    // -------------------------------------------------------------------------
    case 'luma-skin':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#1c0812] via-[#2d0f1e] to-[#10030a] p-4 ${className}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(200,90,110,0.25),transparent_70%)]" />
          <div className="relative flex flex-col items-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)]">
            <div className="w-16 h-10 rounded-t-full border-2 border-amber-300 shadow-sm mb-[-2px] z-10" />
            <div className="w-32 sm:w-36 h-40 sm:h-44 rounded-md bg-gradient-to-b from-[#5c1628] via-[#48101f] to-[#2a0711] border-t border-rose-300/30 p-4 flex flex-col items-center justify-center text-center shadow-2xl relative">
              <div className="w-9 h-9 rounded-full border border-amber-200/50 flex items-center justify-center mb-2">
                <span className="font-serif text-sm text-amber-200">L</span>
              </div>
              <h5 className="font-serif text-sm font-bold text-amber-100 tracking-wider">Luma Skin</h5>
              <span className="text-[7px] text-amber-200/70 tracking-widest uppercase mt-0.5">Atelier</span>
            </div>
          </div>
        </div>
      );

    case 'luma-logo':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#15060f] p-6 ${className}`}>
          <div className="relative w-64 h-64 rounded-full border-2 border-amber-300/40 flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#380e1c] to-[#12040c] shadow-2xl">
            <div className="w-20 h-20 rounded-full border border-amber-200 flex items-center justify-center mb-2 shadow-inner">
              <span className="font-serif text-4xl font-bold text-amber-200">L</span>
            </div>
            <span className="font-serif text-lg tracking-widest text-amber-100 uppercase">LUMA SKIN</span>
            <span className="text-[8px] font-mono tracking-[0.3em] text-amber-300/80 uppercase mt-1">HAUTE BEAUTÉ</span>
          </div>
        </div>
      );

    case 'luma-jars':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#210915] to-[#0c0308] p-6 ${className}`}>
          <div className="flex items-end gap-6">
            <div className="w-28 h-24 rounded-2xl bg-gradient-to-b from-[#5c1728] to-[#2e0913] border-t-2 border-amber-300 p-3 flex flex-col items-center justify-center text-center shadow-2xl">
              <span className="font-serif text-xs text-amber-200 font-bold">Crème Royale</span>
              <span className="text-[7px] text-amber-100/70">50 ML</span>
            </div>
            <div className="w-20 h-20 rounded-xl bg-gradient-to-b from-[#6b1e31] to-[#360b17] border-t-2 border-amber-300 p-2 flex flex-col items-center justify-center text-center shadow-xl">
              <span className="font-serif text-[10px] text-amber-200 font-bold">Eye Balm</span>
              <span className="text-[6px] text-amber-100/70">15 ML</span>
            </div>
          </div>
        </div>
      );

    case 'luma-cards':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#14050e] p-6 ${className}`}>
          <div className="w-72 h-44 rounded-xl bg-[#290b16] border-2 border-amber-400/50 p-6 flex flex-col justify-between shadow-2xl transform rotate-2">
            <div className="flex items-center justify-between">
              <span className="font-serif text-lg text-amber-200 font-bold">LUMA SKIN</span>
              <span className="text-[8px] font-mono text-amber-300/80">600 GSM DUPLEX</span>
            </div>
            <div className="text-left rtl:text-right">
              <div className="text-xs text-white font-serif">Camille De Valois</div>
              <div className="text-[8px] text-amber-300/70 tracking-wider">CREATIVE DIRECTOR</div>
            </div>
          </div>
        </div>
      );

    case 'luma-pattern':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#180711] p-6 ${className}`}>
          <div className="grid grid-cols-4 gap-4 opacity-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-12 h-12 rounded-full border border-amber-300/60 flex items-center justify-center">
                <span className="font-serif text-xs text-amber-200">L</span>
              </div>
            ))}
          </div>
          <div className="absolute z-10 px-4 py-2 rounded-full glass-panel border border-amber-300/40 text-[10px] font-mono text-amber-200 uppercase">
            Signature Monogram Lattice
          </div>
        </div>
      );

    case 'luma-campaign':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-r from-[#3b0e1e] via-[#5c1628] to-[#240813] p-6 ${className}`}>
          <div className="text-center space-y-2">
            <span className="text-[9px] font-mono tracking-[0.3em] text-amber-300 uppercase block">AUTUMN CAMPAIGN</span>
            <h3 className="font-serif text-3xl sm:text-4xl text-white italic font-normal">“The Glow of Velvet”</h3>
            <span className="text-xs text-rose-200/80 block">Shot on 35mm in Milan</span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // LUMA CAFÉ SUITE
    // -------------------------------------------------------------------------
    case 'luma-cafe':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#1a120e] via-[#2a1d17] to-[#120b08] p-4 ${className}`}>
          <div className="absolute -top-6 -left-6 w-32 h-32 bg-amber-500/20 rounded-full blur-xl" />
          <div className="relative flex flex-col items-center drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]">
            <div className="w-24 sm:w-28 h-6 rounded-t-lg bg-neutral-900 border-t border-neutral-700 shadow-inner flex items-center justify-center">
              <div className="w-6 h-1.5 rounded-full bg-neutral-950" />
            </div>
            <div className="w-20 sm:w-24 h-32 sm:h-36 bg-gradient-to-b from-[#f5ede4] via-[#ede0d4] to-[#dec9b6] [clip-path:polygon(0_0,100%_0,85%_100%,15%_100%)] p-3 flex flex-col items-center justify-center text-center shadow-lg">
              <svg className="w-6 h-6 text-[#4a2e22] mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 4C14 7 17 9 17 12C17 15 14 17 12 20C10 17 7 15 7 12C7 9 10 7 12 4Z" />
              </svg>
              <span className="font-serif text-xs font-bold text-[#3d2419] tracking-wider uppercase">Luma</span>
              <span className="text-[8px] font-sans text-[#785340] tracking-widest uppercase">Café</span>
            </div>
          </div>
        </div>
      );

    case 'luma-menu':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#150f0c] p-6 ${className}`}>
          <div className="w-64 sm:w-80 h-72 rounded-2xl bg-[#ebe0d3] text-[#331c13] p-5 shadow-2xl flex flex-col justify-between border border-amber-900/20">
            <div className="text-center border-b border-[#331c13]/20 pb-2">
              <h4 className="font-serif text-lg font-bold">LUMA CAFÉ MENU</h4>
              <span className="text-[8px] font-mono tracking-widest text-[#663d2e]">SINGLE ORIGIN POUR-OVER</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-serif"><span>Geisha Panama</span><span className="font-mono">8.50</span></div>
              <div className="flex justify-between font-serif"><span>Ethiopia Yirgacheffe</span><span className="font-mono">6.00</span></div>
              <div className="flex justify-between font-serif"><span>Cortado / Flat White</span><span className="font-mono">5.20</span></div>
            </div>
            <div className="text-center text-[7px] font-mono text-[#663d2e]/80">ROASTED WEEKLY IN LONDON</div>
          </div>
        </div>
      );

    case 'luma-beans':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#120a07] p-6 ${className}`}>
          <div className="w-48 h-64 rounded-2xl bg-[#1c1410] border-2 border-amber-600/40 p-4 flex flex-col justify-between text-center shadow-2xl relative">
            <div className="w-10 h-2 bg-amber-500/40 rounded-full mx-auto" />
            <div className="my-auto">
              <span className="font-serif text-lg text-amber-200 font-bold">ETHIOPIA</span>
              <p className="text-[9px] text-amber-100/80 font-mono mt-1">Jasmine · Peach · Bergamot</p>
            </div>
            <div className="border-t border-white/10 pt-2 text-[8px] font-mono text-neutral-400">NET WT 250G / 8.8 OZ</div>
          </div>
        </div>
      );

    case 'luma-stationery':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#170e0a] p-6 ${className}`}>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full bg-[#dfd3c5] border border-amber-950/20 flex flex-col items-center justify-center text-center shadow-lg">
              <span className="font-serif text-xs font-bold text-[#3d2419]">Luma</span>
              <span className="text-[6px] font-mono text-[#6e4635]">COASTER</span>
            </div>
            <div className="w-36 h-20 rounded-xl bg-[#f0e8de] p-3 text-left rtl:text-right shadow-md text-[#3d2419]">
              <span className="text-[8px] font-mono block">STAMP CARD</span>
              <div className="flex gap-1.5 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-amber-800/40 flex items-center justify-center text-[7px]">✓</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case 'luma-typography':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#180f0b] p-6 ${className}`}>
          <div className="text-center space-y-2">
            <span className="font-serif text-3xl sm:text-4xl text-amber-100 italic">“Crafted Warmth”</span>
            <div className="font-mono text-xs text-amber-300/80 tracking-widest">Ogg Roman + Neue Haas Grotesk</div>
          </div>
        </div>
      );

    case 'luma-social':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#140b08] p-6 ${className}`}>
          <div className="w-48 h-48 rounded-2xl bg-[#261711] border border-amber-500/20 p-3 flex flex-col justify-between shadow-2xl">
            <span className="text-[8px] font-mono text-amber-300">@LUMACAFE</span>
            <div className="text-center font-serif text-sm text-white">Morning Light & Fresh Roast</div>
            <span className="text-[7px] text-neutral-400 font-mono">1080 × 1080 IG</span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // SOLSTICE EDITORIAL MAGAZINE SUITE
    // -------------------------------------------------------------------------
    case 'solstice':
    case 'solstice-elixirs':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#12070e] via-[#240c16] to-[#0c0409] ${className}`}>
          <div className="relative z-10 w-44 sm:w-56 h-64 sm:h-72 rounded-2xl bg-[#1e0a14] border border-rose-300/30 p-5 flex flex-col justify-between text-left rtl:text-right shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-300/20 pb-2">
              <span className="font-serif text-xs font-bold text-rose-200">ISSUE 08</span>
              <span className="text-[8px] font-mono text-neutral-400">SUMMER 2025</span>
            </div>
            <div>
              <h3 className="font-serif text-3xl text-white font-normal leading-tight">SOLSTICE</h3>
              <p className="font-serif text-xs text-rose-300 italic mt-1">The Architecture of Silence</p>
            </div>
            <div className="text-[8px] font-mono text-rose-200/70">DESIGN · CULTURE · MINIMALISM</div>
          </div>
        </div>
      );

    case 'solstice-spread':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#11050c] p-6 ${className}`}>
          <div className="w-80 sm:w-96 h-52 sm:h-60 rounded-xl bg-[#f5efe8] text-[#1a0e14] p-4 flex gap-4 shadow-2xl">
            <div className="flex-1 border-r border-[#1a0e14]/20 pr-3 flex flex-col justify-between text-left">
              <span className="font-serif text-xl font-bold leading-tight">Light As Form</span>
              <p className="text-[7px] text-neutral-600 leading-relaxed font-serif">
                Architecture breathes through the voids left untouched by human intervention.
              </p>
              <span className="text-[7px] font-mono text-neutral-400">042</span>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div className="w-full h-32 rounded bg-[#331122]" />
              <span className="text-[7px] font-mono text-neutral-400 text-right">043</span>
            </div>
          </div>
        </div>
      );

    case 'solstice-type':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#160710] p-6 ${className}`}>
          <div className="text-center space-y-2 max-w-sm">
            <div className="font-serif text-4xl sm:text-5xl text-rose-100 font-normal leading-none">“Æsthetica”</div>
            <span className="text-[9px] font-mono tracking-widest text-rose-300 uppercase block">Editorial Display Serif Specimen</span>
          </div>
        </div>
      );

    case 'solstice-grid':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0d0309] p-6 ${className}`}>
          <div className="w-72 h-48 border border-rose-400/40 grid grid-cols-6 gap-1 p-2 bg-[#1a0813]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-r border-dashed border-rose-300/30 h-full flex items-end p-1">
                <span className="text-[6px] font-mono text-rose-300/50">C{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'solstice-binding':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#170912] p-6 ${className}`}>
          <div className="w-64 h-64 rounded-2xl bg-[#260e1c] border-l-4 border-amber-300 p-6 flex flex-col justify-between shadow-2xl text-left rtl:text-right">
            <span className="text-[8px] font-mono text-rose-300 uppercase">Swiss Binding Mockup</span>
            <span className="font-serif text-xl text-white">Open Spine Stitching</span>
            <span className="text-[8px] font-mono text-neutral-400">RED THREAD EMBROIDERY</span>
          </div>
        </div>
      );

    case 'solstice-print':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#1c0a16] p-6 ${className}`}>
          <div className="p-6 rounded-2xl glass-panel border border-rose-300/30 text-center">
            <span className="font-serif text-2xl text-rose-100 block mb-1">Munken Kristall 150 GSM</span>
            <span className="text-[8px] font-mono text-rose-300 tracking-wider">SPOT GLOSS UV OVERLAY</span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // GD BRANDING SUITE
    // -------------------------------------------------------------------------
    case 'gd-branding':
    case 'editorial-spread':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0c0c0e] via-[#16161a] to-[#08080a] p-4 ${className}`}>
          <div className="relative w-44 sm:w-56 h-32 sm:h-40 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl p-4 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-serif text-lg font-bold text-white tracking-wider">GD</span>
              <span className="text-[8px] font-mono text-neutral-400">VOL. 02</span>
            </div>
            <div className="space-y-1">
              <div className="h-1.5 w-3/4 bg-white/20 rounded-full" />
              <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
            </div>
            <div className="text-[9px] font-serif text-rose-300/80 italic">Graphic Designer</div>
          </div>
        </div>
      );

    case 'gd-cards':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0d0d10] p-6 ${className}`}>
          <div className="w-72 h-44 rounded-xl bg-[#18181f] border border-white/20 p-5 flex flex-col justify-between shadow-2xl shadow-black transform -rotate-3">
            <div className="flex justify-between items-center">
              <span className="font-serif text-xl font-bold text-white">GD</span>
              <span className="text-[8px] font-mono text-rose-300">ROSE GOLD FOIL</span>
            </div>
            <div className="text-left rtl:text-right">
              <div className="text-xs text-neutral-200 font-medium">Hosam Maher</div>
              <div className="text-[8px] font-mono text-neutral-400">GRAPHIC DESIGNER</div>
            </div>
          </div>
        </div>
      );

    case 'gd-booklet':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#131317] p-6 ${className}`}>
          <div className="w-64 h-64 rounded-2xl bg-[#22222b] border border-white/15 p-6 flex flex-col justify-between shadow-2xl">
            <span className="text-[8px] font-mono text-rose-300">BRAND GUIDELINES</span>
            <div className="font-serif text-2xl text-white">Visual Identity Standards</div>
            <span className="text-[8px] font-mono text-neutral-400">120 PAGES · 2025</span>
          </div>
        </div>
      );

    case 'gd-system':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0e0e12] p-6 ${className}`}>
          <div className="relative w-44 h-44 rounded-full border border-rose-300/40 flex items-center justify-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-rose-400/30" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-rose-400/30" />
            <span className="font-serif text-5xl font-bold text-white tracking-widest">GD</span>
          </div>
        </div>
      );

    case 'gd-stationery':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#16161c] p-6 ${className}`}>
          <div className="w-72 h-48 rounded-xl bg-[#2a2a36] border border-white/10 p-5 flex flex-col justify-between shadow-xl">
            <div className="flex justify-between items-center">
              <span className="font-serif text-base text-white">Studio Letterhead</span>
              <div className="w-5 h-5 rounded-full bg-rose-500/80 shadow-md" />
            </div>
            <div className="text-[8px] font-mono text-neutral-400">AMSTERDAM · DUBAI · CAIRO</div>
          </div>
        </div>
      );

    case 'gd-swatches':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0b0b0e] p-6 ${className}`}>
          <div className="flex gap-3">
            {['#0F0F13', '#252530', '#DFA398', '#FFFFFF'].map((hex) => (
              <div key={hex} className="w-14 h-24 rounded-xl border border-white/10 flex flex-col justify-between p-2" style={{ backgroundColor: hex }}>
                <span className={`text-[7px] font-mono ${hex === '#FFFFFF' || hex === '#DFA398' ? 'text-black' : 'text-white'}`}>{hex}</span>
              </div>
            ))}
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // FLORA BOTANICAL APP SUITE
    // -------------------------------------------------------------------------
    case 'flora-app':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#16091b] via-[#280d30] to-[#0d0411] p-4 ${className}`}>
          <div className="relative w-28 sm:w-32 h-48 sm:h-56 rounded-3xl bg-neutral-950 border-2 border-neutral-700 shadow-2xl p-2 flex flex-col justify-between overflow-hidden">
            <div className="w-12 h-2.5 bg-neutral-900 rounded-full mx-auto" />
            <div className="my-auto flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/40 via-purple-600/30 to-pink-500/20 border border-rose-300/30 flex items-center justify-center shadow-lg mb-1">
                <svg className="w-7 h-7 text-rose-200" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C13 6 17 8 20 9C17 12 16 16 12 22C8 16 7 12 4 9C7 8 11 6 12 2Z" />
                </svg>
              </div>
              <span className="text-[9px] font-serif font-bold text-white">Flora App</span>
            </div>
            <div className="w-10 h-1 bg-neutral-600 rounded-full mx-auto" />
          </div>
        </div>
      );

    case 'flora-ui-kit':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#170a1e] p-6 ${className}`}>
          <div className="grid grid-cols-2 gap-3 w-64">
            <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-400/30 text-center">
              <span className="text-[8px] font-mono text-purple-200 block mb-1">SCAN BUTTON</span>
              <div className="w-16 h-5 rounded-full bg-emerald-500 mx-auto" />
            </div>
            <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-400/30 text-center">
              <span className="text-[8px] font-mono text-purple-200 block mb-1">CARD TOKEN</span>
              <div className="w-16 h-5 rounded-md bg-white/20 mx-auto" />
            </div>
          </div>
        </div>
      );

    case 'flora-flow':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#120718] p-6 ${className}`}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/10 text-[8px] font-mono text-white">CAMERA</div>
            <span className="text-rose-300">→</span>
            <div className="p-2 rounded-lg bg-rose-500/30 border border-rose-300/40 text-[8px] font-mono text-white">AI DIAGNOSTIC</div>
            <span className="text-rose-300">→</span>
            <div className="p-2 rounded-lg bg-emerald-500/30 border border-emerald-300/40 text-[8px] font-mono text-white">CARE PLAN</div>
          </div>
        </div>
      );

    case 'flora-screens':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#1b0a24] p-6 ${className}`}>
          <div className="flex items-center -space-x-4">
            <div className="w-20 h-36 rounded-2xl bg-neutral-900 border border-white/20 transform -rotate-6 shadow-xl" />
            <div className="w-24 h-40 rounded-2xl bg-neutral-950 border-2 border-rose-400 z-10 shadow-2xl flex items-center justify-center">
              <span className="text-[9px] font-mono text-rose-200">SCANNER</span>
            </div>
            <div className="w-20 h-36 rounded-2xl bg-neutral-900 border border-white/20 transform rotate-6 shadow-xl" />
          </div>
        </div>
      );

    case 'flora-widgets':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#15071d] p-6 ${className}`}>
          <div className="w-52 h-24 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-purple-950/60 border border-emerald-400/30 p-3 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-mono text-emerald-300 uppercase">WATER REMINDER</span>
              <div className="font-serif text-sm text-white">Monstera Deliciosa</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs text-emerald-200">💧</div>
          </div>
        </div>
      );

    case 'flora-darkmode':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#09030c] p-6 ${className}`}>
          <div className="w-64 h-36 rounded-2xl bg-[#000000] border border-neutral-800 p-4 flex flex-col justify-between text-left rtl:text-right">
            <span className="text-[8px] font-mono text-emerald-400">PURE OLED DARK THEME</span>
            <span className="font-serif text-xl text-neutral-100">Midnight Botany Mode</span>
            <span className="text-[7px] font-mono text-neutral-500">OPTIMIZED FOR BATTERY EFFICIENCY</span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // AURELIA HAUTE HORLOGERIE
    // -------------------------------------------------------------------------
    case 'aurelia':
    case 'aurelia-horlogerie':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0c060d] via-[#1f0a13] to-[#070308] ${className}`}>
          <div className="relative z-10 w-44 sm:w-56 h-44 sm:h-56 rounded-full p-2 bg-gradient-to-br from-[#e0988e] via-[#4d1624] to-[#240811] shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex items-center justify-center border border-rose-200/30">
            <div className="w-full h-full rounded-full bg-gradient-to-b from-[#180811] via-[#10040a] to-[#050104] p-3 flex flex-col items-center justify-between text-center relative overflow-hidden">
              <span className="font-serif text-[10px] tracking-[0.3em] text-rose-100 font-bold uppercase pt-1">AURELIA</span>
              <div className="w-8 h-8 rounded-full border border-rose-300/40 flex items-center justify-center my-auto">
                <div className="w-2 h-2 bg-rose-200 rounded-full" />
              </div>
              <span className="text-[7px] tracking-[0.2em] text-rose-300/70 pb-1">GENÈVE</span>
            </div>
          </div>
        </div>
      );

    case 'aurelia-macro':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#15070e] p-6 ${className}`}>
          <div className="w-48 h-48 rounded-full border-4 border-amber-300/50 flex items-center justify-center bg-neutral-950">
            <span className="font-serif text-xs text-amber-200 tracking-widest">TOURBILLON BEVEL</span>
          </div>
        </div>
      );

    case 'aurelia-book':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0d0409] p-6 ${className}`}>
          <div className="w-64 h-72 rounded-2xl bg-[#1c0812] border border-amber-300/30 p-6 flex flex-col justify-between shadow-2xl">
            <span className="text-[8px] font-mono text-amber-300">CHRONOMETRY CATALOGUE</span>
            <span className="font-serif text-2xl text-white">The Masterpieces</span>
            <span className="text-[7px] font-mono text-neutral-400">LIMITED TO 500 COPIES</span>
          </div>
        </div>
      );

    case 'aurelia-box':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#1b0813] p-6 ${className}`}>
          <div className="w-64 h-48 rounded-xl bg-[#0a0307] border-2 border-rose-400/40 p-4 flex flex-col justify-between shadow-2xl">
            <span className="text-[8px] font-mono text-rose-300">LACQUERED MAHOGANY CASE</span>
            <div className="w-20 h-10 rounded-lg bg-[#330f1d] mx-auto border border-amber-200/40 flex items-center justify-center text-[8px] text-amber-200">VELVET CUSHION</div>
            <span className="text-[7px] font-mono text-neutral-400 text-center">SWISS MADE</span>
          </div>
        </div>
      );

    case 'aurelia-ad':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0e040a] p-6 ${className}`}>
          <div className="text-center space-y-2">
            <h3 className="font-serif text-3xl text-white">Time as Pure Sculpture</h3>
            <span className="text-xs font-mono text-rose-300">PUBLISHED IN FINANCIAL TIMES HTSI</span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // VELVET REVERIE SUITE
    // -------------------------------------------------------------------------
    case 'velvet':
    case 'velvet-reverie':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0e0710] via-[#2d0f1e] to-[#070308] ${className}`}>
          <div className="relative z-10 w-36 sm:w-44 h-48 sm:h-56 rounded-2xl bg-gradient-to-b from-[#210915] to-[#080205] border border-rose-300/30 shadow-2xl p-4 flex flex-col justify-between text-center overflow-hidden">
            <span className="text-[8px] font-mono text-rose-300 uppercase">CINEMA FESTIVAL</span>
            <div className="my-auto">
              <h4 className="font-serif text-sm sm:text-base font-bold text-white italic">Velvet Reverie</h4>
              <span className="text-[8px] text-rose-300/80 uppercase">Venice · 2025</span>
            </div>
            <div className="h-1 w-full bg-rose-500/20 rounded-full" />
          </div>
        </div>
      );

    case 'velvet-tickets':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#170914] p-6 ${className}`}>
          <div className="w-64 h-32 rounded-xl bg-[#260e20] border border-rose-400/40 p-4 flex items-center justify-between">
            <div>
              <span className="text-[8px] font-mono text-rose-300">PREMIERE PASS</span>
              <div className="font-serif text-base text-white">Row A · Seat 12</div>
            </div>
            <div className="w-12 h-12 rounded-full border border-rose-300 flex items-center justify-center font-mono text-xs text-rose-200">VIP</div>
          </div>
        </div>
      );

    case 'velvet-billboard':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#0f040d] p-6 ${className}`}>
          <div className="w-72 h-36 rounded-xl bg-gradient-to-r from-[#4d142c] to-[#1a050f] p-4 flex items-center justify-center border-4 border-neutral-900 shadow-2xl">
            <span className="font-serif text-xl text-white italic">Now Screening at Lido di Venezia</span>
          </div>
        </div>
      );

    case 'velvet-catalogue':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#180915] p-6 ${className}`}>
          <div className="w-56 h-64 rounded-2xl bg-[#361126] border border-rose-300/30 p-5 flex flex-col justify-between">
            <span className="text-[8px] font-mono text-rose-300">FESTIVAL SELECTION</span>
            <span className="font-serif text-2xl text-white">Official Film Guide</span>
            <span className="text-[7px] font-mono text-neutral-400">LA BIENNALE DI VENEZIA</span>
          </div>
        </div>
      );

    // -------------------------------------------------------------------------
    // ZENITH SOCIAL SUITE
    // -------------------------------------------------------------------------
    case 'zenith-social':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#120a16] via-[#25102a] to-[#0a050e] p-4 ${className}`}>
          <div className="relative w-44 sm:w-52 h-44 sm:h-52 rounded-2xl bg-gradient-to-tr from-[#1b0d21] to-[#2f1338] border border-rose-300/25 p-3 flex flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="w-5 h-5 rounded-full bg-rose-500/30 flex items-center justify-center text-[9px] text-rose-200">Z</div>
              <span className="text-[8px] font-mono text-rose-300">SOCIAL CAROUSEL</span>
            </div>
            <div className="space-y-1.5 my-auto">
              <div className="w-3/4 h-2 bg-gradient-to-r from-rose-400 to-amber-300 rounded-full" />
              <div className="w-1/2 h-1.5 bg-white/20 rounded-full" />
            </div>
            <div className="flex items-center justify-between text-[7px] font-mono text-neutral-400">
              <span>9:16 STORIES</span>
              <span>1080 × 1920</span>
            </div>
          </div>
        </div>
      );

    case 'zenith-grid':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#120815] p-6 ${className}`}>
          <div className="grid grid-cols-3 gap-2 w-56 h-56">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-gradient-to-br from-rose-900/40 to-purple-900/40 border border-white/10 flex items-center justify-center text-[8px] font-mono text-rose-200">
                0{i + 1}
              </div>
            ))}
          </div>
        </div>
      );

    case 'zenith-motion':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#19091d] p-6 ${className}`}>
          <div className="text-center space-y-2">
            <span className="font-serif text-3xl text-white italic">Kinetic Flow</span>
            <div className="text-xs font-mono text-rose-300">60FPS MOTION ASSETS · AFTER EFFECTS</div>
          </div>
        </div>
      );

    case 'zenith-stickers':
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#100613] p-6 ${className}`}>
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 p-0.5 shadow-lg transform -rotate-12 flex items-center justify-center text-[9px] font-bold text-black">
              ZENITH
            </div>
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-lg transform rotate-6 flex items-center justify-center text-[8px] font-mono text-white">
              KINETIC
            </div>
          </div>
        </div>
      );

    // Default Fallback
    default:
      return (
        <div className={`relative w-full h-full overflow-hidden flex items-center justify-center bg-[#150f19] border border-rose-300/15 ${className}`}>
          <div className="text-center p-4">
            <span className="font-serif text-sm text-rose-200 block mb-1">Visual Asset</span>
            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">{id}</span>
          </div>
        </div>
      );
  }
};

export default ProjectArtwork;
