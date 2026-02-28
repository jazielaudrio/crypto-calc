import React, { useState, useEffect } from 'react';

// ==========================================
// FUNGSI TRANSLATOR INPUT (HURUF <-> ANGKA)
// ==========================================

// Mengubah 'F' menjadi 5, atau '5' tetap 5
const parseKeyVal = (val, defaultVal = 0) => {
  if (!val) return defaultVal;
  if (!isNaN(val)) return parseInt(val) % 26; 
  const charCode = val.toUpperCase().charCodeAt(0);
  if (charCode >= 65 && charCode <= 90) return charCode - 65;
  return defaultVal;
};

// Menerima input "PUNK" atau "15, 20, 13, 10" dan mengubahnya jadi array [15, 20, 13, 10]
const parseHillMatrix = (str) => {
  if (/[\d]/.test(str)) {
    const nums = str.match(/\d+/g);
    if (nums && nums.length >= 4) return nums.slice(0, 4).map(Number);
    return [0, 0, 0, 0]; // Fallback jika angka kurang
  }
  const clean = str.toUpperCase().replace(/[^A-Z]/g, '');
  const padded = (clean + 'AAAA').slice(0, 4);
  return padded.split('').map(c => c.charCodeAt(0) - 65);
};


// ==========================================
// KUMPULAN ALGORITMA TOP TIER
// ==========================================

const modInverse = (a, m) => {
  for (let x = 1; x < m; x++) if ((a * x) % m === 1) return x;
  return 1;
};

const vigenere = (text, key, decrypt = false) => {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanKey) return { result: '', error: 'ERR: KEY REQUIRES LETTERS' };

  let result = '';
  let j = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    if (char >= 'A' && char <= 'Z') {
      const p = char.charCodeAt(0) - 65;
      const k = cleanKey.charCodeAt(j % cleanKey.length) - 65;
      const c = decrypt ? (p - k + 26) % 26 : (p + k) % 26;
      result += String.fromCharCode(c + 65);
      j++; 
    } else {
      result += char; 
    }
  }
  return { result, error: null };
};

const affine = (text, a, b, decrypt = false) => {
  const aInv = modInverse(a, 26);
  if (aInv === 1 && a !== 1) return { result: '', error: `ERR: ALPHA (${a}) IS NOT CO-PRIME TO 26` };

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    if (char >= 'A' && char <= 'Z') {
      const p = char.charCodeAt(0) - 65;
      const c = decrypt ? (aInv * (p - b + 26 * 100)) % 26 : (a * p + b) % 26;
      result += String.fromCharCode(c + 65);
    } else {
      result += char;
    }
  }
  return { result, error: null };
};

const playfair = (text, key, decrypt = false) => {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  const cleanText = text.toUpperCase().replace(/[^A-Z]/g, '').replace(/J/g, 'I');
  
  if (!cleanKey) return { result: '', error: 'ERR: KEYWORD REQUIRES LETTERS' };
  if (!cleanText) return { result: '', error: null };

  const alphabet = "ABCDEFGHIKLMNOPQRSTUVWXYZ";
  let matrixStr = Array.from(new Set(cleanKey + alphabet)).join('');
  let matrix = [];
  for(let i=0; i<5; i++) matrix.push(matrixStr.slice(i*5, i*5+5).split(''));

  const findPos = (char) => {
    for(let r=0; r<5; r++) for(let c=0; c<5; c++) if(matrix[r][c] === char) return [r, c];
    return [0,0];
  };

  let digraphs = [];
  let tempText = cleanText;
  for(let i=0; i<tempText.length; i+=2) {
    let char1 = tempText[i];
    let char2 = tempText[i+1];
    if (!char2 || char1 === char2) { char2 = 'X'; i--; }
    digraphs.push([char1, char2]);
  }

  let result = '';
  digraphs.forEach(([c1, c2]) => {
    let [r1, col1] = findPos(c1);
    let [r2, col2] = findPos(c2);
    let shift = decrypt ? 4 : 1; 
    if (r1 === r2) {
      result += matrix[r1][(col1 + shift) % 5] + matrix[r2][(col2 + shift) % 5];
    } else if (col1 === col2) {
      result += matrix[(r1 + shift) % 5][col1] + matrix[(r2 + shift) % 5][col2];
    } else {
      result += matrix[r1][col2] + matrix[r2][col1];
    }
    result += ' '; 
  });
  return { result: result.trim(), error: null };
};

const hill2x2 = (text, kArray, decrypt = false) => {
  let cleanText = text.toUpperCase().replace(/[^A-Z]/g, '');
  if (!cleanText) return { result: '', error: null };
  if (cleanText.length % 2 !== 0) cleanText += 'X'; 
  
  let det = (kArray[0]*kArray[3] - kArray[1]*kArray[2]) % 26;
  if (det < 0) det += 26;
  const detInv = modInverse(det, 26);
  if (detInv === 1 && det !== 1) return { result: '', error: "ERR: MATRIX DETERMINANT HAS NO INVERSE" };
  
  let matrix = decrypt ? [(kArray[3]*detInv)%26, (-kArray[1]*detInv)%26, (-kArray[2]*detInv)%26, (kArray[0]*detInv)%26].map(x => (x + 26 * 10) % 26) : kArray;
  let result = '';
  
  for(let i=0; i<cleanText.length; i+=2) {
    let p1 = cleanText.charCodeAt(i) - 65;
    let p2 = cleanText.charCodeAt(i+1) - 65;
    let c1 = (matrix[0]*p1 + matrix[1]*p2) % 26;
    let c2 = (matrix[2]*p1 + matrix[3]*p2) % 26;
    result += String.fromCharCode(c1 + 65) + String.fromCharCode(c2 + 65);
  }
  return { result: result.match(/.{1,4}/g)?.join(' ') || '', error: null };
};

// Algoritma Enigma M3 (Rotor I, II, III dan Reflektor B)
const enigma = (text, key) => {
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (cleanKey.length !== 3) return { result: '', error: 'ERR: ENIGMA REQUIRES 3-LETTER ROTOR KEY (E.G. "AAA")' };

  // Konfigurasi Standar Enigma 
  const rotors = [
    "EKMFLGDQVZNTOWYHXUSPAIBRCJ", // Rotor I
    "AJDKSIRUXBLHWTMCQGZNPYFVOE", // Rotor II
    "BDFHJLCPRTXVZNYEIWGAKMUSQO"  // Rotor III
  ];
  const notches = [16, 4, 21]; // Notch Q, E, V
  const reflector = "YRUHQSLDPXNGOKMIEBFZCWVJAT"; // Reflektor B

  let p1 = cleanKey.charCodeAt(0) - 65;
  let p2 = cleanKey.charCodeAt(1) - 65;
  let p3 = cleanKey.charCodeAt(2) - 65;

  const shift = (c, offset) => (c + offset) % 26;
  const unshift = (c, offset) => (c - offset + 26) % 26;

  const passRotor = (c, wiring, offset, inverse) => {
    if (!inverse) {
      const charAtPin = String.fromCharCode(shift(c, offset) + 65);
      const wiredChar = wiring[charAtPin.charCodeAt(0) - 65];
      return unshift(wiredChar.charCodeAt(0) - 65, offset);
    } else {
      const targetChar = String.fromCharCode(shift(c, offset) + 65);
      const pinIndex = wiring.indexOf(targetChar);
      return unshift(pinIndex, offset);
    }
  };

  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    if (char >= 'A' && char <= 'Z') {
      // Mekanisme Odometer / Stepping Enigma
      let step2 = p3 === notches[2];
      let step1 = p2 === notches[1];
      
      if (step1) {
        p2 = (p2 + 1) % 26;
        p1 = (p1 + 1) % 26; // Double stepping anomaly
      } else if (step2) {
        p2 = (p2 + 1) % 26;
      }
      p3 = (p3 + 1) % 26;

      let c = char.charCodeAt(0) - 65;

      // Sinyal Maju (Forward pass) melewati Rotor 3, 2, 1
      c = passRotor(c, rotors[2], p3, false);
      c = passRotor(c, rotors[1], p2, false);
      c = passRotor(c, rotors[0], p1, false);

      // Sinyal Memantul di Reflektor
      c = reflector.charCodeAt(c) - 65;

      // Sinyal Mundur (Backward pass) melewati Rotor 1, 2, 3
      c = passRotor(c, rotors[0], p1, true);
      c = passRotor(c, rotors[1], p2, true);
      c = passRotor(c, rotors[2], p3, true);

      result += String.fromCharCode(c + 65);
    } else {
      result += char;
    }
  }
  return { result, error: null };
};


// ==========================================
// KOMPONEN UI REACT
// ==========================================

export default function App() {
  const [cipher, setCipher] = useState('vigenere');
  const [mode, setMode] = useState('encrypt');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [sysStatus, setSysStatus] = useState({ msg: 'IDLE', isError: false });

  // State kunci
  const [vigenereKey, setVigenereKey] = useState('PUNK');
  const [affineA, setAffineA] = useState('F'); 
  const [affineB, setAffineB] = useState('I'); 
  const [playfairKey, setPlayfairKey] = useState('REBEL');
  const [hillKey, setHillKey] = useState('DDCF'); 
  const [enigmaKey, setEnigmaKey] = useState('AAA'); // Initial rotor settings

  useEffect(() => {
    if (!input) {
      setOutput('');
      setSysStatus({ msg: 'AWAITING_DATA', isError: false });
      return;
    }

    const isDecrypt = mode === 'decrypt';
    let process = { result: '', error: null };

    try {
      switch (cipher) {
        case 'vigenere': 
          process = vigenere(input, vigenereKey, isDecrypt); 
          break;
        case 'affine': 
          const numA = parseKeyVal(affineA, 1);
          const numB = parseKeyVal(affineB, 0);
          process = affine(input, numA, numB, isDecrypt); 
          break;
        case 'playfair': 
          process = playfair(input, playfairKey, isDecrypt); 
          break;
        case 'hill': 
          const matrixArr = parseHillMatrix(hillKey);
          process = hill2x2(input, matrixArr, isDecrypt); 
          break;
        case 'enigma':
          // Enigma tidak peduli isDecrypt karena cipher ini reciprocal (berkebalikan secara identik)
          process = enigma(input, enigmaKey);
          break;
        default: break;
      }

      if (process.error) {
        setOutput('');
        setSysStatus({ msg: process.error, isError: true });
      } else {
        setOutput(process.result);
        setSysStatus({ msg: 'COMPUTATION_SUCCESS', isError: false });
      }
    } catch (err) {
      setOutput('');
      setSysStatus({ msg: 'CRITICAL_SYS_FAILURE', isError: true });
    }
  }, [input, cipher, mode, vigenereKey, affineA, affineB, playfairKey, hillKey, enigmaKey]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setSysStatus({ msg: 'DATA_COPIED_TO_CLIPBOARD', isError: false });
    }
  };

  const inputStyles = "w-full bg-transparent border-b border-[#2a2a2a] text-[#e8e6e1] text-base py-2 focus:outline-none focus:border-[#e8e6e1] transition-colors placeholder-[#2a2a2a]";
  const labelStyles = "block text-[0.7rem] text-[#6a6a6a] tracking-[1px] mb-1 uppercase";

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-[#e8e6e1] overflow-x-hidden font-mono selection:bg-[#2a2a2a] selection:text-[#e8e6e1]">
      
      {/* BACKGROUND TEKSTUR */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
      <div className="fixed inset-0 opacity-30 z-0" style={{ backgroundSize: '50px 50px', backgroundImage: 'linear-gradient(to right, #2a2a2a 1px, transparent 1px), linear-gradient(to bottom, #2a2a2a 1px, transparent 1px)' }} />

      {/* TYPOGRAPHY MAKRO */}
      <div className="fixed -top-[5vh] -left-[2vw] text-[28vw] md:text-[25vw] font-bold text-[#121212] leading-[0.75] break-all select-none z-0 tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        CRYP<br/>TOGR<br/>APHY
      </div>

      <main className="relative z-10 w-[90vw] max-w-6xl mx-auto min-h-screen py-10 flex flex-col justify-center">
        
        <header className="flex justify-between items-end text-[0.7rem] text-[#6a6a6a] uppercase border-b border-[#2a2a2a] pb-2 mb-12">
          <div className="flex flex-col gap-1">
            <span>SYS.ARCHIVE // OP:KALEM</span>
            <span className={sysStatus.isError ? "text-red-500 font-bold" : "text-[#a3e635]"}>
              STATUS: {sysStatus.msg}
            </span>
          </div>
          <span className="text-right hidden sm:block">LAT:47.3769° N<br/>LON:8.5417° E</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          <section className="md:col-start-7 md:col-span-6 flex flex-col gap-8 bg-[#0a0a0a]/80 p-8 border border-[#2a2a2a] backdrop-blur-sm">
            
            <div className="flex gap-4 border-b border-[#2a2a2a] pb-2">
              <label className="cursor-pointer text-sm">
                <input type="radio" name="mode" value="encrypt" checked={mode === 'encrypt'} onChange={(e) => setMode(e.target.value)} className="hidden peer" />
                <span className="text-[#6a6a6a] peer-checked:text-[#e8e6e1] peer-checked:font-bold hover:text-[#e8e6e1] transition-colors">[ ENCRYPT ]</span>
              </label>
              <label className="cursor-pointer text-sm">
                <input type="radio" name="mode" value="decrypt" checked={mode === 'decrypt'} onChange={(e) => setMode(e.target.value)} className="hidden peer" />
                <span className="text-[#6a6a6a] peer-checked:text-[#e8e6e1] peer-checked:font-bold hover:text-[#e8e6e1] transition-colors">[ DECRYPT ]</span>
              </label>
            </div>

            <div>
              <label className={labelStyles}>[01] ALGORITHM_SELECT</label>
              <select className={inputStyles + " cursor-pointer appearance-none rounded-none"} value={cipher} onChange={(e) => setCipher(e.target.value)}>
                <option className="bg-[#0a0a0a]" value="vigenere">VIGENÈRE CIPHER</option>
                <option className="bg-[#0a0a0a]" value="affine">AFFINE CIPHER</option>
                <option className="bg-[#0a0a0a]" value="playfair">PLAYFAIR CIPHER</option>
                <option className="bg-[#0a0a0a]" value="hill">HILL CIPHER 2X2</option>
                <option className="bg-[#0a0a0a]" value="enigma">ENIGMA MACHINE</option>
              </select>
            </div>

            <div>
              <label className={labelStyles}>[02] KEY_PARAMETERS</label>
              <div className="mt-2">
                
                {cipher === 'vigenere' && (
                  <input type="text" placeholder="ENTER ALPHABETIC KEY" value={vigenereKey} onChange={e => setVigenereKey(e.target.value)} className={inputStyles} />
                )}

                {cipher === 'affine' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-[0.6rem] text-[#6a6a6a]">ALPHA (LETTER OR NUM)</span>
                      <input type="text" value={affineA} onChange={e => setAffineA(e.target.value)} className={inputStyles} placeholder="e.g. F or 5" />
                    </div>
                    <div>
                      <span className="text-[0.6rem] text-[#6a6a6a]">BETA (LETTER OR NUM)</span>
                      <input type="text" value={affineB} onChange={e => setAffineB(e.target.value)} className={inputStyles} placeholder="e.g. I or 8" />
                    </div>
                  </div>
                )}

                {cipher === 'playfair' && (
                  <input type="text" placeholder="ENTER KEYWORD" value={playfairKey} onChange={e => setPlayfairKey(e.target.value)} className={inputStyles} />
                )}

                {cipher === 'hill' && (
                  <div>
                    <span className="text-[0.6rem] text-[#6a6a6a] block mb-2">4-LETTER WORD OR 4 NUMBERS</span>
                    <input 
                      type="text" 
                      value={hillKey} 
                      onChange={e => setHillKey(e.target.value)} 
                      className={inputStyles} 
                      placeholder="e.g. PUNK or 15 20 13 10" 
                    />
                  </div>
                )}

                {cipher === 'enigma' && (
                  <div>
                    <span className="text-[0.6rem] text-[#6a6a6a] block mb-2">3-LETTER ROTOR SETTING</span>
                    <input 
                      type="text" 
                      value={enigmaKey} 
                      onChange={e => setEnigmaKey(e.target.value)} 
                      className={inputStyles} 
                      placeholder="e.g. AAA" 
                      maxLength={3}
                    />
                  </div>
                )}

              </div>
            </div>

            <div>
              <label className={labelStyles}>[03] RAW_DATA_INPUT</label>
              <textarea 
                className={inputStyles + " resize-none placeholder-[#2a2a2a]"}
                rows="3"
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Ketik data rahasia di sini..." 
                spellCheck="false"
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className={labelStyles + " mb-0"}>[04] RESULT_DATA</label>
                <button onClick={handleCopy} className="text-[0.6rem] text-[#6a6a6a] hover:text-[#e8e6e1] transition-colors border border-[#2a2a2a] px-2 py-1">
                  [ COPY ]
                </button>
              </div>
              <textarea 
                className={`${inputStyles} resize-none ${sysStatus.isError ? 'text-red-500/50' : 'text-[#a3e635]'}`} 
                rows="3"
                value={output} 
                readOnly 
                placeholder={sysStatus.isError ? "AWAITING VALID PARAMETERS..." : "MENUNGGU PROSES..."} 
              />
            </div>

          </section>
        </div>
      </main>
    </div>
  );
}