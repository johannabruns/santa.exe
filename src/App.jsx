import React, { useState, useEffect, useRef } from 'react';
import { Lock, Delete } from 'lucide-react';

// --- CONFIG & ASSETS ---

const MOODS = {
  GRIEF: { id: 'grief', color: '#1E293B', label: 'Trauer' },
  MANIA: { id: 'mania', color: '#C026D3', label: 'Manie' },
  DEPRESSION: { id: 'depression', color: '#44403C', label: 'Depression' },
  MANIA2: { id: 'mania2', color: '#A855F7', label: 'Manie II' },
  HEALING: { id: 'healing', color: '#0D9488', label: 'Heilung' }
};

const getMood = (day) => {
  if (day <= 5) return MOODS.GRIEF;
  if (day <= 10) return MOODS.MANIA;
  if (day <= 15) return MOODS.DEPRESSION;
  if (day <= 20) return MOODS.MANIA2;
  return MOODS.HEALING;
};

const getGiftImage = (day) => {
  const gifts = ['gift_yellow.png', 'gift_red.png', 'gift_blue.png', 'gift_green.png', 'gift_purple.png', 'gift_pink.png'];
  if (day === 24) return 'gift_red.png';
  return gifts[day % gifts.length];
};

const isWideRoom = (day) => {
  if (day === 1 || day === 24) return false;
  return (day * 7) % 3 === 0;
};

const getRoomImages = (day) => {
  if ((day >= 6 && day <= 10) || (day >= 16 && day <= 20)) {
    return { top: '/room_manic_top.png', bottom: '/room_manic_bottom.png' };
  }
  if (day === 24) {
    return { top: '/room_roof_top.png', bottom: '/room_roof_bottom.png' };
  }
  return { top: '/room_depression_top.png', bottom: '/room_depression_bottom.png' };
};

const getCardFrontImage = (day, charId) => {
  if (day === 15) {
    return charId === 'parssa' ? '/card_15_p.png' : '/card_15_l.png';
  }
  const dayStr = String(day).padStart(2, '0');
  return `/card_${dayStr}.png`;
};

// --- DATUMS LOGIK ---
// Ermittelt, bis zu welchem Tag geöffnet werden darf
const calculateAllowedDay = () => {
  // ACHTUNG: VOR DEM VERSCHICKEN AUF "false" SETZEN!
  const DEBUG_MODE = false; 

  if (DEBUG_MODE) return 24; // Zum Testen ist alles offen

  const now = new Date();
  const month = now.getMonth(); // 0 = Januar, 11 = Dezember
  const date = now.getDate();

  // Wenn wir VOR Dezember sind (z.B. November), ist alles zu (0)
  if (month < 11) return 0; 
  // Wenn wir NACH Dezember sind (Januar...), ist alles offen
  if (month > 11) return 24;
  
  // Im Dezember: Gib das heutige Datum zurück (max 24)
  return Math.min(date, 24);
};

// --- STORY DATEN ---

const DAY1_DIALOGUE_TEMPLATE = [
  { speaker: 'fairies', text: "Oh Mann, super, dass du da bist, {player}. Wir brauchen ganz dringend deine Hilfe. Klaus wurde verlassen und heute ist der Scheidungsbrief angekommen." },
  { speaker: 'fairies', text: "Ich habe gehört, Wilhelm hat Klaus mit dem Grinch betrogen. Und nun droht der Grinch tatsächlich Weihnachten zu klauen. Wilhelm war Klaus’ Licht, seine Muse – und nun ist er weg." },
  { speaker: 'fairies', text: "Klaus geht es gar nicht gut. Mal ist er sehr traurig und will nicht einmal essen, und mal schläft er gar nicht und tobt durch die Gegend." },
  { speaker: 'fairies', text: "Bald ist Weihnachten – wir brauchen unseren Klaus zurück! Wenn nicht, was passiert dann mit all den Kindern, die den Weihnachtsmann brauchen? Bitte hilf uns, wir sind verzweifelt." },
  { speaker: 'fairies', text: "Der Weihnachtsmann muss jeden Tag seine Tabletten nehmen, damit es ihm besser geht. Löse die Rätsel und sorge dafür, dass Klaus wieder gesund wird." },
  { speaker: 'fairies', text: "Mit jedem gelösten Rätsel bekommst du einen Code, der dich zu deiner Belohnung führt." },
  { speaker: 'fairies', text: "Hilf Klaus – und rette Weihnachten!" },
];

// --- PUZZLE REGISTRY ---
const PUZZLES = {
  1: { type: 'STORY_MODE' }, 
  2: { 
    type: 'CODE', 
    solution: 'Green', 
    code: 'const socks = ["Red", "Red", "Green", "Red"];\nconst odd = socks.filter(s => s !== "Red");\nreturn odd[0];' 
  },
  3: { type: 'WORDLE', solution: 'LONELY', clue: 'Wie fühlt sich Klaus?' },
  4: { type: 'MEMORY', variant: 'sad', clue: 'Finde die Paare.' },
  5: { type: 'CODE', solution: 'true', code: 'function startManicEpisode() {\n  mood = "GRIEF";\n  if (mood == "GRIEF") {\n    return _____; // Starte Manie?\n  }\n}' },
  6: { 
    type: 'CODE', 
    solution: '64', 
    code: 'let mouldSpores = 2;\n// Nach 5 Tagen in der Kammer:\nfor(let i=0; i<5; i++) {\n  mouldSpores *= 2;\n}\nreturn mouldSpores;' 
  },
  7: { type: 'MEMORY', variant: 'one', clue: 'Finde die passenden Paare.' },
  8: { type: 'WORDLE', solution: 'FREEDOM', clue: 'Endlich keine Arbeit mehr!' },
  9: { type: 'CODE', solution: 'chaos', code: 'while (santa.isHigh()) {\n  life.state = "_____";\n  buyUnnecessaryThings();\n}' },
  10: { type: 'RIDDLE', question: 'Ich bin klein, nervig und klebe überall. Mich gibt es in jeder Farbe und manchmal bin ich auch essbar.', solution: 'GLITZER' },
  11: { 
    type: 'LETTER', 
    title: 'AMTSGERICHT NORDPOL',
    subject: 'EINSTWEILIGE VERFÜGUNG',
    text: 'Sehr geehrter Herr Klaus,\n\nnamens meines Mandanten, Herrn Grinch, untersage ich Ihnen jegliche Kontaktaufnahme.\n\nDas nächtliche Atmen am Schlafzimmerfenster, das Hinterlassen von Kohle im Briefkasten und das Singen von "Last Christmas" vor der Haustür erfüllen den Tatbestand des Stalkings.\n\nHalten Sie sich fern von Wilhelm und dem Grinch!',
    sender: 'Dr. Ruprecht',
    senderTitle: 'Anwalt für Strafrecht'
  },
  12: { type: 'QUIZ', question: 'Was hasst Santa momentan am meisten?', options: ['Glitzer', 'Den Grinch', 'Ostern'], answer: 1 },
  13: { type: 'MEMORY', variant: 'two', clue: 'Finde die passenden Paare.' },
  14: { type: 'CODE', solution: 'void', code: 'function getMotivation() {\n  return _____; // Nichts zurückgeben\n}' },
  15: { type: 'WORDLE', solution: 'SADNESS', clue: 'Teil einer Depression' },
  16: { 
    type: 'CODE', 
    solution: 'Grinch', 
    code: 'const ego = { id: "Santa" };\nconst me = ego;\n// Identitätskrise:\nego.id = "Grinch";\nreturn me.id;' },
  17: { 
    type: 'CODE', 
    solution: '5', 
    code: 'let steps = 0;\n// Der schwankende Weg ins Bett:\nwhile(steps != 5) {\n  steps += 2;\n  if(steps > 5) steps -= 3;\n}\nreturn steps;' },
  18: { type: 'FRIEND_QUIZ' }, 
  19: { type: 'RIDDLE', question: 'Charlys Top 3 Spitznamen: Schorle, Schalorlie und...?', solution: 'APFELCHORLIE' },
  20: { type: 'CODE', solution: '21', code: 'int daysUntilHealed() {\n  return 7 * 3;\n} // Ergebnis?' },
  21: { type: 'MEMORY', variant: 'three', clue: 'Finde die passenden Paare.' },
  22: { type: 'RIDDLE', question: 'Ich bin warm, duftend und heile die Seele.', solution: 'TEE' },
  23: { type: 'CODE', solution: 'distribute', code: 'santa.status = "READY";\n_____(presents);' },
  24: { 
    type: 'FINAL', 
    letterText: 'Sehr geehrter Herr Klaus,\n\ndie erste Ladung an Geschenken ist angekommen. Es freut uns, dass es Ihnen besser geht.\n\nUm nun den Rest der Geschenke zu versenden, nennen Sie uns bitte zur Zwei-Faktor-Authentifizierung ihr Passwort.\n\nFalls Sie ihres vergessen haben, bitten Sie {GF_NAME} um Hilfe.\n\nMit freundlichen Grüßen,\nIhr Team der Northstar Delivery Services.',
    solution: 'XMAS' 
  }
};

// --- Partner Quiz Daten ---
const FRIEND_QUIZ_DATA = {
  linus: [
    { q: 'Junas Comfort-Food?', options: ['Schokobrezeln', 'Nudeln', 'Avocado-Toast'], a: 0 },
    { q: 'Junas Bucketlist-Reiseziel?', options: ['Portugal', 'Schottland', 'Finnland'], a: 1 },
    { q: 'Junas liebstes Spaßgetränk?', options: ['Red Bull', 'Spezi', 'Pepsi'], a: 1 },
    { q: 'Was bestellt Juna im Café?', options: ['Roiboos-Vanille', 'Iced Strawberry Matcha', 'Iced Vanilla Latte (Hafer)'], a: 2 },
    { q: 'Gemeinsamkeiten von Juna & Johanna?', options: ['Geburtsdatum, Geburtsort, Initialen', 'Geburtsort, Initialen, Allergie', 'Geburtsdatum, Kindheitshobby, Duschgel'], a: 2 }
  ],
  parssa: [
    { q: 'Johannas Comfort-Food?', options: ['Sushi', 'Bohnensalat', 'Ramen'], a: 2 },
    { q: 'Welches Land sollst du mir unbedingt zeigen?', options: ['Iran', 'Island', 'Japan'], a: 0 },
    { q: 'Johannas liebstes Spaßgetränk?', options: ['MioMio Mate', 'Club Mate', 'Charitea Mate'], a: 1 },
    { q: 'Was bestellt Johanna im Hin&Weg?', options: ['Dirty Chai mit Hafermilch', 'Iced Strawberry Matcha mit Hafermilch', 'Cappuccino'], a: 0 },
    { q: 'Gemeinsamkeiten von Juna & Johanna?', options: ['Geburtsdatum, Geburtsort, Initialen', 'Geburtsort, Initialen, Allergie', 'Geburtsdatum, Kindheitshobby, Duschgel'], a: 2 }
  ]
};

// --- Memory Bilder ---
const MEMORY_IMAGES = [
  '/memory_cake.png', '/memory_gift.png', '/memory_gingerbread.png', '/memory_house.png', '/memory_kranz.png',
  '/memory_ladder.png', '/memory_letter.png', '/memory_mug.png', '/memory_sock.png', '/memory_star.png', '/memory_train.png', '/memory_tree.png'
];

// --- ONBOARDING & STORY COMPONENTS ---

const SplashScreen = ({ onStart }) => (
  <div onClick={onStart} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 cursor-pointer animate-in fade-in duration-1000 bg-cover bg-center" style={{backgroundImage: 'url(/bg_stars.png)'}}>
    <img src="/splashscreen_icon.png" className="w-24 h-24 mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse" alt="Logo" onError={(e) => e.target.style.display='none'} />
    <h1 className="text-6xl font-black text-red-600 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] mb-4 select-none">SANTA.EXE</h1>
    <p className="text-xl text-slate-400 animate-pulse">(Tap to Start)</p>
  </div>
);

const IntroLetter = ({ onNext }) => (
  <div onClick={onNext} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer animate-in fade-in duration-700">
    <div className="relative max-w-sm w-full animate-in zoom-in duration-500">
      <img src="/letter_open.png" className="w-full h-auto rounded shadow-2xl rotate-1" alt="Brief" />
      <div className="absolute inset-0 p-12 flex flex-col items-center justify-center">
        <div className="font-sans text-slate-900 text-sm md:text-base leading-relaxed text-left overflow-y-auto h-full w-full no-scrollbar pr-2">
          <p className="mb-2">Lieber Weihnachtsmann,</p>
          <p className="mb-2">meine Mama hat gesagt, ich soll dir einen Brief schreiben mit all den Sachen, die ich mir wünsche.</p>
          <p className="mb-2">Sonst hat Mama mir immer die Geschenke gekauft, aber dieses Jahr hat sie gesagt, dass sie kein Geld dafür hat.</p>
          <p className="mb-2">Ich weiß, dich gibt es eigentlich nicht, aber ich wünsche mir so sehr, dass es meiner Mama wieder gut geht.</p>
          <p className="mb-2">Kannst du mir helfen?</p>
          <p className="mb-2">Ich wünsche mir aber auch:<br/>
          ein cooles Fahrrad<br/>
          eine Puppe<br/>
          Lego Star Wars<br/><br/>
          Dein Mika</p>
        </div>
        <p className="absolute bottom-8 text-slate-500 text-[10px] uppercase tracking-widest animate-pulse bg-white/80 px-2 rounded -rotate-1 font-sans">(Tippen zum Fortfahren)</p>
      </div>
    </div>
  </div>
);

const CharSelect = ({ onSelect }) => (
  <div className="fixed inset-0 z-40 bg-slate-900 flex flex-col items-center justify-center p-6 animate-in slide-in-from-bottom duration-500 bg-cover bg-center" style={{backgroundImage: 'url(/bg_stars.png)'}}>
    <h2 className="text-4xl font-black mb-2 relative z-10 text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] text-center leading-tight">CHOOSE YOUR<br/>CHARACTER</h2>
    <p className="text-red-400 font-bold tracking-widest uppercase mb-12 z-10 text-sm animate-pulse">Non-refundable.</p>
    
    <div className="flex gap-4 relative z-10 items-end justify-center w-full max-w-md">
      <div onClick={() => onSelect({ id: 'parssa', name: 'Parssicle', img: '/char_parssa.png' })} className="flex flex-col items-center gap-4 group cursor-pointer transition-transform active:scale-95 w-1/2">
        <img src="/char_parssa.png" className="w-56 h-auto object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.4)]" alt="Parssicle" />
        <span className="font-bold text-emerald-400 text-xl md:text-2xl bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-emerald-500/30">Parssicle</span>
      </div>
      <div onClick={() => onSelect({ id: 'linus', name: 'Linuël', img: '/char_linus.png' })} className="flex flex-col items-center gap-4 group cursor-pointer transition-transform active:scale-95 w-1/2">
        <img src="/char_linus.png" className="w-40 h-auto object-contain drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]" alt="Linuël" />
        <span className="font-bold text-red-400 text-xl md:text-2xl bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-red-500/30">Linuël</span>
      </div>
    </div>
  </div>
);

const Day1Dialog = ({ char, onComplete }) => {
  const [index, setIndex] = useState(0);
  
  const dialogue = DAY1_DIALOGUE_TEMPLATE.map(line => ({
    ...line,
    text: line.text.replace('{player}', char.name)
  }));
  
  const line = dialogue[index];
  const next = () => { if (index < dialogue.length - 1) setIndex(index + 1); else onComplete(); };
  const isFairies = line.speaker === 'fairies';

  return (
    <div onClick={next} className="fixed inset-0 z-50 flex flex-col h-full w-full bg-slate-900 overflow-hidden">
      
      <div className="h-[65%] w-full relative z-10 bg-cover bg-center" style={{backgroundImage: 'url(/bg_stars.png)'}}>
         <img src="/room_hallway_top.png" className="absolute inset-0 w-full h-full object-cover object-bottom" alt="Hallway Top" />
         
         <div className="absolute bottom-0 left-0 right-0 flex justify-center items-end px-4 w-full max-w-lg mx-auto pointer-events-none pb-4">
            <div className={`relative transition-all duration-500 ease-in-out ${!isFairies ? 'z-20 scale-110 opacity-100' : 'z-10 scale-95 opacity-100'}`}>
                <img src={char.img} className="w-56 md:w-64 h-auto object-contain drop-shadow-2xl" alt="Player" />
            </div>
            <div className="w-8"></div>
            <div className={`relative transition-all duration-500 ease-in-out mb-24 ${isFairies ? 'z-20 scale-110 opacity-100' : 'z-10 scale-95 opacity-100'}`}>
                <img src="/char_fairies.png" className="w-48 md:w-56 h-auto object-contain drop-shadow-2xl" alt="Fairies" />
            </div>
         </div>
      </div>

      <div className="h-[35%] w-full relative bg-white flex flex-col items-center justify-center p-8 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
         <div className="w-full max-w-lg text-left">
            <p className="text-slate-900 font-sans text-lg leading-relaxed select-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <span className="font-bold mr-2 text-sm uppercase tracking-widest text-slate-500">Feen:</span>
              {line.text}
            </p>
         </div>

         <p className="absolute bottom-6 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse font-sans">
            (Tippen)
         </p>
      </div>
    </div>
  );
};

const LawLetter = ({ onComplete }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div onClick={() => isOpen ? onComplete() : setIsOpen(true)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 cursor-pointer">
      <div className="relative max-w-sm w-full transition-all duration-500">
        {!isOpen ? (
          <div className="animate-bounce text-center">
            <img src="/letter_closed.png" className="w-full h-auto rounded shadow-2xl rotate-2" alt="Closed" />
            <p className="text-white mt-4 font-bold text-xl animate-pulse">Ein Brief für Santa...</p>
          </div>
        ) : (
          <div className="animate-in zoom-in duration-300 relative">
            <img src="/letter_open.png" className="w-full h-auto rounded shadow-2xl -rotate-1" alt="Open" />
            <div className="absolute inset-0 flex flex-col p-8 text-slate-900 font-serif overflow-y-auto">
              <div className="border-b-2 border-slate-800 mb-4 pb-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-600">Kanzlei für Familienrecht</h2>
              </div>
              <div className="flex-1 flex flex-col space-y-3 text-sm leading-relaxed text-left">
                <p className="font-bold">Sehr geehrter Herr Weihnachtsmann,</p>
                <p>hiermit wird Ihre Scheidung von Wilhelm Weihnachtsmann bestätigt.</p>
                <p className="font-bold text-red-800">Sie sind nun ledig.</p>
                <p>Ihnen verbleibt die gesamte Firma „Weihnachtsmann & Co. KG“.</p>
                <p className="mt-2">Viel Glück!</p>
              </div>
              <div className="mt-6 text-right">
                <p className="text-xs text-slate-500 mb-1">Mit freundlichen Grüßen</p>
                <p className="font-bold text-lg transform -rotate-2 font-handwriting text-indigo-900">Ihr Scheidungsanwalt</p>
              </div>
            </div>
            <p className="text-center text-white/50 mt-4 text-xs absolute -bottom-8 left-0 right-0">(Tippen)</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PuzzleLetter = ({ config, onSolve }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4">
      {!isOpen ? (
        <div 
          onClick={() => setIsOpen(true)} 
          className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center"
        >
          <img src="/letter_closed.png" className="w-64 max-w-full h-auto drop-shadow-2xl rotate-2" alt="Closed Letter" />
          <p className="text-white/80 mt-6 font-bold animate-pulse text-lg tracking-widest uppercase">
            Brief öffnen
          </p>
        </div>
      ) : (
        <div className="relative w-full max-w-sm animate-in zoom-in duration-500 transform -translate-y-12">
          <img src="/letter_open.png" className="w-full h-auto drop-shadow-2xl -rotate-1" alt="Open Letter" />
          
          <div className="absolute inset-0 flex flex-col p-6 sm:p-8 text-slate-900 font-serif text-left overflow-hidden">
            <div className="border-b border-slate-400 mb-2 pb-1">
               <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">{config.title}</h3>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
              <p className="font-bold text-xs sm:text-sm mb-2">{config.subject}</p>
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap mb-4">
                {config.text}
              </p>
              <div className="mt-4 text-right">
                <p className="text-[10px] text-slate-500">Hochachtungsvoll</p>
                <p className="font-handwriting font-bold text-sm sm:text-base text-indigo-900 -rotate-2">{config.sender}</p>
                <p className="text-[9px] text-slate-400 uppercase">{config.senderTitle}</p>
              </div>
            </div>
            <div className="mt-2 flex justify-center pt-2 border-t border-slate-200">
                <button 
                  onClick={onSolve}
                  className="bg-red-700 text-white text-xs font-bold px-4 py-1 rounded shadow hover:bg-red-800 transition-colors"
                >
                  Akzeptieren & Schließen
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PuzzleFinal = ({ config, onSolve, char }) => {
  const [phase, setPhase] = useState('letter'); // 'letter' or 'input'
  const [password, setPassword] = useState('');

  // Dynamischen Namen setzen
  const friendName = char?.id === 'parssa' ? 'Johanna' : 'Juna';
  const finalText = config.letterText.replace('{GF_NAME}', friendName);

  if (phase === 'letter') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-4 bg-cover bg-center" style={{backgroundImage: 'url(/bg_stars.png)'}}>
         <div onClick={() => setPhase('input')} className="relative w-full max-w-sm cursor-pointer animate-in zoom-in duration-500 transform -translate-y-8 hover:scale-[1.02] transition-transform">
          <img src="/letter_open.png" className="w-full h-auto drop-shadow-2xl -rotate-1" alt="Open Letter" />
          
          <div className="absolute inset-0 flex flex-col p-8 text-slate-900 font-sans text-left overflow-y-auto no-scrollbar">
            <h3 className="font-bold uppercase tracking-widest text-slate-500 text-xs border-b border-slate-400 pb-2 mb-4">Northstar Delivery Services</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{finalText}</p>
          </div>
          
          <p className="text-center text-white/50 mt-6 text-xs absolute -bottom-8 left-0 right-0 animate-pulse">(Tippen für Passworteingabe)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 justify-center h-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="bg-black/60 p-8 rounded-xl backdrop-blur-md w-full border border-white/10 shadow-2xl flex flex-col items-center">
          <Lock className="text-red-500 w-12 h-12 mb-4" />
          <p className="text-lg font-bold mb-6 text-center text-white">2FA Passwort eingeben</p>
          <input 
            type="text" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="text-black p-4 rounded w-full text-center font-bold mb-6 bg-white tracking-[0.5em] text-xl uppercase placeholder:tracking-normal" 
            placeholder="CODE" 
          />
          <button 
            onClick={() => {
              if (password.toUpperCase().trim() === config.solution) onSolve(); 
              else alert("Zugriff verweigert. Falsches Passwort.");
            }} 
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-full shadow-lg border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all"
          >
            VERIFIZIEREN
          </button>
      </div>
    </div>
  );
};

// --- MINIGAME COMPONENTS ---

const PuzzleWordle = ({ config, onSolve }) => {
  const solution = config.solution.toUpperCase();
  const wordLength = solution.length;
  const maxAttempts = 5; 
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [shake, setShake] = useState(false);
  const [keyStatus, setKeyStatus] = useState({});
  const keyboardRows = ['QWERTZUIOP', 'ASDFGHJKL', 'YXCVBNM'];

  const handleKey = (key) => {
    if (key === 'ENTER') {
      if (currentGuess.length !== wordLength) { setShake(true); setTimeout(() => setShake(false), 500); return; }
      const newGuesses = [...guesses, currentGuess];
      setGuesses(newGuesses);
      const newKeyStatus = { ...keyStatus };
      currentGuess.split('').forEach((letter, i) => {
        let status = 'grey';
        if (solution[i] === letter) status = 'green';
        else if (solution.includes(letter)) status = 'yellow';
        const current = newKeyStatus[letter];
        if (current !== 'green') {
           if (status === 'green') newKeyStatus[letter] = 'green';
           else if (status === 'yellow' && current !== 'green') newKeyStatus[letter] = 'yellow';
           else if (status === 'grey' && !current) newKeyStatus[letter] = 'grey';
        }
      });
      setKeyStatus(newKeyStatus);
      setCurrentGuess('');
      if (currentGuess === solution) setTimeout(onSolve, 800);
      else if (newGuesses.length >= maxAttempts) { alert(`Lösung: ${solution}`); setGuesses([]); setKeyStatus({}); }
    } else if (key === 'BACK') { setCurrentGuess(prev => prev.slice(0, -1));
    } else { if (currentGuess.length < wordLength) setCurrentGuess(prev => prev + key); }
  };

  const getLetterStatus = (guess, index) => {
    const letter = guess[index];
    if (solution[index] === letter) return 'green';
    if (solution.includes(letter)) return 'yellow';
    return 'grey';
  };

  const getImage = (status) => {
    switch (status) {
      case 'green': return '/wordle_green.png';
      case 'yellow': return '/wordle_yellow.png';
      case 'grey': return '/wordle_grey.png';
      default: return '/wordle_neutral.png';
    }
  };

  return (
    <div className="flex flex-col items-center w-full h-full pt-2 overflow-hidden justify-end pb-4">
      <p className="text-white text-sm font-bold mb-4 uppercase tracking-widest drop-shadow-md">{config.clue}</p>
      <div className={`flex flex-col gap-2 mb-4 overflow-y-auto max-h-[40vh] px-2 ${shake ? 'animate-pulse' : ''}`}>
        {Array.from({ length: maxAttempts }).map((_, rowIndex) => {
          const isCurrentRow = rowIndex === guesses.length;
          const guess = guesses[rowIndex] || (isCurrentRow ? currentGuess : '');
          return (
            <div key={rowIndex} className="flex gap-2 justify-center">
              {Array.from({ length: wordLength }).map((_, colIndex) => {
                const letter = guess[colIndex] || '';
                let status = 'neutral';
                if (rowIndex < guesses.length) status = getLetterStatus(guess, colIndex);
                return (
                  <div key={colIndex} className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 overflow-hidden rounded-md shrink-0 shadow-lg">
                    <img src={getImage(status)} className="absolute inset-0 w-full h-full object-contain scale-[2.5]" alt="" />
                    <span className="relative z-10 font-black text-2xl text-black pt-1 uppercase drop-shadow-sm">{letter}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-1 w-full max-w-sm px-1 mt-auto">
        {keyboardRows.map((row, i) => (
          <div key={i} className="flex justify-center gap-1">
            {row.split('').map(char => {
              let bgClass = "bg-slate-800/90 text-white border-b-4 border-slate-950";
              if (keyStatus[char] === 'green') bgClass = "bg-emerald-500 text-white border-b-4 border-emerald-700";
              if (keyStatus[char] === 'yellow') bgClass = "bg-yellow-500 text-white border-b-4 border-yellow-700";
              if (keyStatus[char] === 'grey') bgClass = "bg-slate-800/50 text-slate-500 border-b-4 border-slate-900";
              return ( <button key={char} onClick={() => handleKey(char)} className={`h-12 min-w-[30px] flex-1 rounded font-bold text-lg active:scale-95 active:border-b-0 active:translate-y-1 transition-all shadow-md backdrop-blur-sm ${bgClass}`}>{char}</button> );
            })}
          </div>
        ))}
        <div className="flex justify-center gap-2 mt-1">
          <button onClick={() => handleKey('BACK')} className="px-4 py-3 bg-slate-800/90 rounded-lg text-white font-bold active:scale-95 border-b-4 border-slate-950 flex items-center justify-center w-1/3 shadow-lg backdrop-blur-sm"><Delete size={24}/></button>
          <button onClick={() => handleKey('ENTER')} className="px-4 py-3 bg-emerald-600 rounded-lg text-white font-bold active:scale-95 border-b-4 border-emerald-800 shadow-lg flex-1 text-xl">ENTER</button>
        </div>
      </div>
    </div>
  );
};

const PuzzleSearch = ({ config, onSolve }) => (
  <div className="relative w-full h-full bg-slate-800 overflow-hidden">
    <img src="/room_hallway_top.png" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Search" />
    <p className="absolute top-14 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-sm z-10 border border-white/20 text-white font-bold shadow-lg">🔍 Finde: {config.target}</p>
    <div className="absolute inset-0 flex items-center justify-center text-white/30 pointer-events-none font-bold text-2xl uppercase">Wimmelbild</div>
    <div onClick={onSolve} className="absolute top-1/2 left-1/2 w-32 h-32 bg-transparent cursor-pointer z-20" style={{transform: 'translate(-50%, -50%)'}} />
  </div>
);

const PuzzleRiddle = ({ config, onSolve }) => {
  const [input, setInput] = useState('');
  return (
    <div className="flex flex-col items-center gap-4 p-4 justify-center h-full max-w-md mx-auto">
      <div className="bg-black/50 p-6 rounded-xl backdrop-blur-md w-full border border-white/10 shadow-2xl">
          <p className="text-lg font-bold mb-4 text-center text-white">{config.question}</p>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="text-black p-3 rounded w-full text-center font-bold mb-4 bg-white/90" placeholder="Antwort..." />
          <button onClick={() => {if (input.toUpperCase().trim() === config.solution) onSolve(); else alert("Nope!")}} className="w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-full shadow-lg border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1">Lösen</button>
      </div>
    </div>
  );
};

const PuzzleCode = ({ config, onSolve }) => {
  const [val, setVal] = useState('');
  const parts = config.code.split('_____');
  return (
    <div className="w-full p-4 flex flex-col justify-center h-full max-w-md mx-auto">
      <div className="bg-slate-900/90 p-4 rounded text-sm font-mono text-green-400 border border-slate-700 text-left whitespace-pre-wrap shadow-xl backdrop-blur-sm">
        {parts[0]}<input value={val} onChange={(e) => setVal(e.target.value)} className="bg-slate-800 border-b border-green-500 text-white w-20 px-1 outline-none text-center" />{parts[1]}
      </div>
      <div className="mt-6 flex justify-center">
        <img 
          src="/button_run.png" 
          onClick={() => {if(val.trim() === config.solution) onSolve(); else alert("Syntax Error!")}} 
          className="w-32 cursor-pointer hover:scale-105 transition-transform drop-shadow-lg"
          alt="Run Code"
        />
      </div>
    </div>
  );
};

const PuzzleMemory = ({ onSolve, config }) => {
  const [gameImages] = useState(() => {
    const shuffled = [...MEMORY_IMAGES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  });

  const [cards, setCards] = useState(() => {
    const deck = [...gameImages, ...gameImages];
    return deck.sort(() => Math.random() - 0.5);
  });

  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);

  useEffect(() => { if (matched.length === cards.length) setTimeout(onSolve, 800); }, [matched]);

  const handleFlip = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;
    
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (cards[a] === cards[b]) {
         setMatched([...matched, a, b]); 
         setFlipped([]); 
      } else {
         setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full py-4">
      {config?.clue && <p className="mb-6 text-sm font-bold bg-black/60 px-4 py-2 rounded-full backdrop-blur-md text-white border border-white/10 shadow-lg">{config.clue}</p>}
      
      <div className="grid grid-cols-3 gap-4 bg-black/20 p-6 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
        {cards.map((cardImage, i) => {
           const isRevealed = flipped.includes(i) || matched.includes(i);
           return (
          <div key={i} onClick={() => handleFlip(i)} className="relative w-20 h-20 sm:w-24 sm:h-24 cursor-pointer perspective-1000">
             <div className={`w-full h-full transition-all duration-500 preserve-3d ${isRevealed ? 'rotate-y-180' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-slate-800 border-2 border-slate-600 rounded-xl flex items-center justify-center shadow-md hover:bg-slate-700 transition-colors">
                   <span className="text-slate-500 text-3xl font-bold">?</span>
                </div>
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#fff7da] border-[3px] border-[#5B2323] rounded-xl flex items-center justify-center overflow-hidden shadow-lg p-2">
                   <img src={cardImage} className="w-full h-full object-contain drop-shadow-sm" alt="memory" />
                </div>
             </div>
          </div>
        )})}
      </div>
    </div>
  );
};

const PuzzleQuiz = ({ config, onSolve }) => (
  <div className="flex flex-col gap-3 w-full p-4 justify-center h-full max-w-md mx-auto">
    <div className="bg-black/50 p-6 rounded-2xl backdrop-blur-md w-full border border-white/10 shadow-2xl">
        <h3 className="text-lg font-bold mb-6 text-center text-white">{config.question}</h3>
        <div className="flex flex-col gap-3">
            {config.options.map((opt, i) => (
            <button key={i} onClick={() => i === config.answer ? onSolve() : alert("Falsch!")} className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left border border-white/10 transition-colors text-white active:bg-white/30">{opt}</button>
            ))}
        </div>
    </div>
  </div>
);

const PuzzleMaze = ({ onSolve }) => (
  <div className="text-center p-4 flex flex-col items-center justify-center h-full">
    <div className="bg-black/50 p-6 rounded-xl backdrop-blur-md border border-white/10 flex flex-col gap-4 items-center">
        <p className="mb-4 text-white">Maze Platzhalter</p>
        <img 
          src="/button_next.png" 
          onClick={onSolve}
          className="w-32 cursor-pointer hover:scale-105 transition-transform drop-shadow-lg"
          alt="Weiter"
        />
    </div>
  </div>
);

const PuzzleFriendQuiz = ({ char, onSolve }) => {
  const [qIndex, setQIndex] = useState(0);
  const questions = FRIEND_QUIZ_DATA[char?.id] || FRIEND_QUIZ_DATA['linus'];
  const currentQ = questions[qIndex];

  const handleAnswer = (optionIndex) => {
    if (optionIndex === currentQ.a) {
      if (qIndex < questions.length - 1) {
        setQIndex(qIndex + 1);
      } else {
        onSolve();
      }
    } else {
      alert("Das würde sie dir übel nehmen! Versuch's nochmal.");
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full p-4 justify-center h-full max-w-md mx-auto">
      <div className="bg-black/60 p-6 rounded-2xl backdrop-blur-md w-full border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex gap-1 mb-6 justify-center">
          {questions.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i <= qIndex ? 'w-8 bg-pink-500' : 'w-2 bg-white/20'}`} />
          ))}
        </div>

        <h3 className="text-xl font-bold mb-2 text-center text-white">Wie gut kennst du deine Freundin?</h3>
        <p className="text-pink-300 text-sm font-bold uppercase tracking-widest text-center mb-6">{currentQ.q}</p>
        
        <div className="flex flex-col gap-3">
            {currentQ.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(i)} 
                className="bg-white/10 hover:bg-white/20 p-4 rounded-xl text-left border border-white/10 transition-all text-white active:bg-white/30 hover:scale-[1.02] active:scale-95"
              >
                {opt}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

// ... (oberer Teil mit Config bleibt gleich)

// --- MAIN APP MIT INTELLIGENTEM SPEICHER ---

const STORAGE_KEY = 'SANTA_EXE_SAVE_DATA_V2'; // Neue Version V2 (setzt alten Spielstand zurück für sauberen Test)

export default function SantaExeApp() {
  
  // 1. Daten laden
  const loadSaveData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const saveData = loadSaveData();

  // 2. State
  const [screen, setScreen] = useState('splash'); 
  const [char, setChar] = useState(saveData?.char || null);
  
  // NEU: Wir merken uns genau, WELCHE Tage fertig sind
  const [completedDays, setCompletedDays] = useState(saveData?.completedDays || []);
  
  // Pillen berechnen wir live aus den fertigen Tagen (kein State mehr nötig, verhindert Fehler)
  const pills = completedDays.length;

  // Der aktuelle Tag, der im Kalender offen ist (Fortschritt)
  const [currentDay, setCurrentDay] = useState(saveData?.currentDay || 1);

  // Datum Logik (Test-Modus beachten!)
  const getAvailableDay = () => {
    const DEBUG_MODE = false; // Auf true für Testen aller Tage
    if (DEBUG_MODE) return 24; 

    // TEST-DUMMY: Tu so, als wäre heute der 1. Dezember
    const now = new Date('2024-12-3'); 
    // const now = new Date(); // <-- VOR RELEASE WIEDER AKTIVIEREN

    const month = now.getMonth(); 
    const date = now.getDate();

    if (month < 11) return 0; 
    if (month > 11) return 24;
    return Math.min(date, 24);
  };

  const [maxUnlockedDay, setMaxUnlockedDay] = useState(getAvailableDay());
  const [selectedDay, setSelectedDay] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMaxUnlockedDay(getAvailableDay());
  }, [screen]);

  // 3. AUTO-SAVE (Jetzt mit completedDays)
  useEffect(() => {
    if (char) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        char,
        completedDays,
        currentDay
      }));
    }
  }, [char, completedDays, currentDay]);

  useEffect(() => {
    if (screen === 'home' && scrollRef.current) {
      setTimeout(() => scrollRef.current.scrollTop = scrollRef.current.scrollHeight, 50);
    }
  }, [screen]);

  const handleAppStart = () => {
    if (char) setScreen('home');
    else setScreen('introLetter');
  };

  // --- NEUE LOGIK: Wenn ein Rätsel gelöst wurde ---
  const handlePuzzleSolved = () => {
    // Wenn wir diesen Tag zum ersten Mal lösen:
    if (selectedDay && !completedDays.includes(selectedDay)) {
      const newCompleted = [...completedDays, selectedDay];
      setCompletedDays(newCompleted);
      
      // Kalender-Fortschritt erhöhen (nächster Tag wird frei)
      if (selectedDay === currentDay) {
         setCurrentDay(d => Math.min(d + 1, 24));
      }
    }
    
    // Gehe zum Reveal Screen
    setScreen('reveal');
  };

  // --- NEUE LOGIK: Wenn man im Menü klickt ---
  const handleRoomClick = (day) => {
    if (day > maxUnlockedDay) {
        alert("Nicht schummeln! Dieser Tag ist noch nicht dran.");
        return;
    }

    setSelectedDay(day);

    // CHECK: Haben wir den Tag schon erledigt?
    if (completedDays.includes(day)) {
        // JA -> Direkt zur Belohnung springen (Replay verhindern)
        setIsFlipped(true); // Karte direkt umgedreht zeigen
        setScreen('reveal');
    } else {
        // NEIN -> Spiel starten
        setIsFlipped(false); // Karte verdeckt
        
        // Tag 1 Sonderbehandlung (Dialog)
        if (day === 1 && screen !== 'home') setScreen('dialog'); // Falls noch nie gesehen
        else if (day === 1) setScreen('dialog');
        else setScreen('puzzle');
    }
  };

  const handleBackToHome = () => {
    setScreen('home');
  };

  // --- RENDERING ---

  if (screen === 'splash') return <SplashScreen onStart={handleAppStart} />;
  if (screen === 'introLetter') return <IntroLetter onNext={() => setScreen('select')} />;
  if (screen === 'select') return <CharSelect onSelect={(c) => { setChar(c); setScreen('home'); }} />;
  if (screen === 'dialog') return <Day1Dialog char={char} onComplete={() => setScreen('lawLetter')} />;
  if (screen === 'lawLetter') return <LawLetter onComplete={() => setScreen('reveal')} />; // Nach Brief direkt zu Reveal (Day 1 Logic)

  const images = selectedDay ? getRoomImages(selectedDay) : null;
  const puzzleConfig = selectedDay ? PUZZLES[selectedDay] : null;
  const isSearchGame = puzzleConfig?.type === 'SEARCH';
  
  // Prüfen ob wir im "Replay Modus" sind (für den Text auf dem Reveal Screen)
  const isReplay = completedDays.includes(selectedDay);

  return (
    <div className="h-screen w-full text-white font-sans flex flex-col relative overflow-hidden bg-slate-950">
      {screen === 'home' && (
        <div className="flex-1 flex flex-col h-full w-full absolute inset-0" style={{backgroundImage: 'url(/bg_stars.png)', backgroundSize: 'cover', backgroundPosition: 'center'}}>
          <header className="h-20 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20 border-b border-white/10">
            <div className="flex items-center gap-3 relative translate-y-2">
              <div className="w-20 h-20 rounded-full border-2 border-white/30 overflow-hidden bg-black shadow-lg transform translate-y-2">
                <img src={char?.img || '/splashscreen_icon.png'} className="w-full h-full object-cover object-top" alt="Avatar" />
              </div>
              <span className="font-bold text-lg drop-shadow-md mt-2">{char?.name}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                <span>💊</span><span className="font-mono font-bold text-pink-400">{pills} / 24</span>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative px-4 pb-32 scroll-smooth">
            <div className="flex flex-col w-full max-w-sm mx-auto mt-20 gap-3">
              
              <div onClick={() => handleRoomClick(24)} className={`relative h-40 w-full transition-transform cursor-pointer ${24 > maxUnlockedDay ? 'opacity-50 grayscale' : 'hover:scale-[1.02]'}`}>
                 {/* Wenn erledigt, zeigen wir einen kleinen Haken oder lassen es einfach bunt */}
                 <img src="/gift_red.png" className={`w-full h-full object-cover rounded-xl shadow-lg border-2 ${completedDays.includes(24) ? 'border-green-500 brightness-110' : 'border-yellow-500/50'}`} alt="Day 24" />
                 <div className="absolute inset-0 flex items-center justify-center">
                    {24 > maxUnlockedDay ? <Lock className="text-white/50 w-10 h-10" /> : <span className="font-black text-white text-5xl drop-shadow-lg">24</span>}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 22 }, (_, i) => {
                  const day = 23 - i;
                  const isLocked = day > maxUnlockedDay;
                  const isDone = completedDays.includes(day);
                  
                  return (
                    <div key={day} onClick={() => handleRoomClick(day)} className={`relative h-32 transition-transform active:scale-95 cursor-pointer ${isLocked ? 'opacity-60 grayscale brightness-75' : 'hover:brightness-110'}`}>
                     <img src={`/${getGiftImage(day)}`} className={`w-full h-full object-cover rounded-lg shadow-md border ${isDone ? 'border-green-400/50' : 'border-white/10'}`} alt={`Day ${day}`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isLocked ? <Lock className="text-black/30 w-8 h-8" /> : <span className="font-black text-white text-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{day}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-2">
                 <div onClick={() => handleRoomClick(1)} className={`relative h-32 w-1/2 transition-transform active:scale-95 cursor-pointer ${1 > maxUnlockedDay ? 'opacity-60' : 'hover:scale-105'}`}>
                   <img src="/gift_yellow.png" className={`w-full h-full object-cover rounded-lg shadow-xl border-2 ${completedDays.includes(1) ? 'border-green-400' : 'border-yellow-200'}`} alt="Day 1" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      {1 > maxUnlockedDay ? <Lock className="text-black/30 w-8 h-8" /> : <span className="font-black text-white text-4xl drop-shadow-lg">1</span>}
                   </div>
                 </div>
              </div>

            </div>
          </div>
        </div>
      )}
      
      {screen === 'puzzle' && (
        <div className="h-full w-full relative bg-slate-900 flex flex-col overflow-hidden">
          <div className="absolute top-4 right-4 z-50">
             <img src="/button_close.png" onClick={() => setScreen('home')} className="w-12 h-12 cursor-pointer hover:scale-105 transition-transform drop-shadow-md" alt="Close" />
          </div>
          
          {!isSearchGame && (
             <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <span className="bg-black/80 px-4 py-1 rounded-full text-white font-bold border border-white/20 text-sm tracking-widest shadow-lg">TAG {selectedDay}</span>
             </div>
          )}

          {!isSearchGame && puzzleConfig?.type !== 'FINAL' && (
            <div className="h-[45%] w-full relative z-0 overflow-hidden border-b-4 border-black">
               {images?.top && <img src={images.top} className="w-full h-full object-cover" alt="Room Top" />}
            </div>
          )}

          <div className={`${isSearchGame || puzzleConfig?.type === 'FINAL' ? 'h-full' : 'h-[55%]'} w-full relative z-10 flex flex-col`}>
             {!isSearchGame && puzzleConfig?.type !== 'FINAL' && images?.bottom && (
               <img src={images.bottom} className="absolute inset-0 w-full h-full object-cover z-0" alt="Floor" />
             )}

             <div className="relative z-10 flex-1 flex flex-col w-full h-full">
                {/* WICHTIG: Hier geben wir handlePuzzleSolved statt setScreen weiter */}
                {puzzleConfig?.type === 'WORDLE' ? <PuzzleWordle config={puzzleConfig} onSolve={handlePuzzleSolved} /> : 
                 puzzleConfig?.type === 'SEARCH' ? <PuzzleSearch config={puzzleConfig} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'MEMORY' ? <PuzzleMemory config={puzzleConfig} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'CODE' ? <PuzzleCode config={puzzleConfig} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'RIDDLE' ? <PuzzleRiddle config={puzzleConfig} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'QUIZ' ? <PuzzleQuiz config={puzzleConfig} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'FRIEND_QUIZ' ? <PuzzleFriendQuiz char={char} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'MAZE' ? <PuzzleMaze config={puzzleConfig} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'LETTER' ? <PuzzleLetter config={puzzleConfig} onSolve={handlePuzzleSolved} /> :
                 puzzleConfig?.type === 'FINAL' ? <PuzzleFinal config={puzzleConfig} char={char} onSolve={handlePuzzleSolved} /> :
                 <div className="flex items-center justify-center h-full"><button onClick={handlePuzzleSolved} className="bg-white text-black p-4 rounded shadow-lg font-bold">Skip (Platzhalter)</button></div>
                }
             </div>
          </div>
        </div>
      )}

      {/* REVEAL SCREEN */}
      {screen === 'reveal' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-black/95 p-4 w-full h-full absolute z-50" onClick={() => !isFlipped && setIsFlipped(true)}>
          
          {/* Dein gewünschter Text, wenn das Level schon fertig war */}
          {isReplay && (
            <div className="absolute top-20 bg-green-900/80 px-6 py-3 rounded-xl border border-green-500 backdrop-blur-md mb-8 animate-in slide-in-from-top duration-700 z-50">
               <p className="text-green-100 font-bold text-center">✅ Du hast Santa für heute schon seine Pille gegeben.</p>
            </div>
          )}

          <div className={`relative w-72 h-96 md:h-[450px] transition-all duration-700 preserve-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
             <div className="absolute inset-0 backface-hidden rounded-xl border-[6px] border-[#5B2323] bg-[#fff7da] flex items-center justify-center overflow-hidden">
               <img src="/card_backside.png" className="w-full h-full object-cover" alt="Card Back" />
             </div>
             <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl border-[6px] border-[#5B2323] bg-[#fff7da] flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]">
               <img src={getCardFrontImage(selectedDay, char?.id)} className="w-3/4 h-3/4 object-contain" alt="Card Front" />
             </div>
          </div>
          
          {!isFlipped && <p className="mt-8 text-white/70 animate-pulse font-bold tracking-widest text-sm uppercase">Tippen zum Öffnen</p>}
          
          {isFlipped && (
            <div className="mt-8">
               <img src="/button_next.png" onClick={handleBackToHome} className="w-40 cursor-pointer hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse" alt="Weiter" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}