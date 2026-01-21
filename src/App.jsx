import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { db } from './firebase'; 
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

function App() {
  const [text, setText] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [tag, setTag] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [history, setHistory] = useState([]);
  const [fileBase64, setFileBase64] = useState(null);

  // Real-time data fetch from Firestore
  useEffect(() => {
    const q = query(collection(db, "secretMessages"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Firestore Fetch Error:", error);
    });
    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1048576) { 
        alert("File size exceeds 1MB limit. Please select a smaller file.");
        e.target.value = null; 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFileBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // PASSWORD REQUIREMENT LOGIC (Wapas add kar diya hai)
  const isPasswordValid = (pass) => {
    return pass.length >= 6 && /[!@#$%^&*(),.?":{}|<>]/.test(pass);
  };

  const handleEncryptAndSave = async () => {
    if (!password || (!text && !fileBase64) || !tag) {
      return alert("Error: Please fill all required fields (*) before saving.");
    }

    // Validation Check
    if (!isPasswordValid(password)) {
      return alert("Error: Password must be at least 6 characters long and include at least one special character (like @, #, $, etc.).");
    }
    
    try {
      const dataToSecure = fileBase64 || text;
      const encrypted = CryptoJS.AES.encrypt(dataToSecure, password).toString();

      await addDoc(collection(db, "secretMessages"), {
        payload: encrypted,
        type: fileBase64 ? 'file' : 'text',
        userTag: tag.toLowerCase().trim(),
        timestamp: new Date()
      });
      
      alert("Success: Your data is securely locked!");
      setText(''); setFileBase64(null); setPassword(''); setTag('');
    } catch (e) { 
      alert("System Error: Failed to save to cloud."); 
    }
  };

  const unlockItem = (encryptedPayload) => {
    const pass = prompt("Enter Security Password to Decrypt:");
    if (!pass) return;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPayload, pass);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      if (original) {
        if (original.startsWith('data:')) {
          const link = document.createElement('a');
          link.href = original;
          link.download = "SecureFile_" + Date.now();
          link.click();
        } else { alert("Decrypted Message: " + original); }
      } else { alert("Access Denied: Wrong Password!"); }
    } catch (e) { alert("Error: Decryption failed. Incorrect key."); }
  };

  const filteredHistory = history.filter(item => 
    item.userTag && item.userTag.includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div style={{ background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Segoe UI", Tahoma, sans-serif', color: '#fff' }}>
      <div style={{ maxWidth: '700px', margin: 'auto', backgroundColor: '#ffffff', borderRadius: '15px', padding: '35px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', color: '#333' }}>
        
        {/* Title badal diya hai */}
        <h1 style={{ textAlign: 'center', color: '#2d3748', marginBottom: '30px' }}>🛡️ Secure Digital Vault</h1>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Secret Message / Notes</label>
          <textarea 
            placeholder="Type your sensitive information here..." 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', minHeight: '80px', boxSizing: 'border-box' }} 
            value={text} 
            onChange={(e)=>setText(e.target.value)} 
          />
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>Attach File (Max 1MB)</label>
          <input type="file" onChange={handleFileChange} style={{ fontSize: '14px' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>
            Personal Tag <span style={{color: '#e53e3e'}}>*</span>
          </label>
          <input 
            type="text" 
            placeholder="Your name or unique ID (e.g. Ishani)" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
            value={tag} 
            onChange={(e)=>setTag(e.target.value)} 
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{fontWeight: 'bold', display: 'block', marginBottom: '8px'}}>
            Vault Password <span style={{color: '#e53e3e'}}>*</span>
          </label>
          <input 
            type="password" 
            placeholder="Min 6 characters + 1 special character" 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }} 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
          />
        </div>
        
        <button 
          onClick={handleEncryptAndSave} 
          style={{ backgroundColor: '#3182ce', color: 'white', width: '100%', padding: '15px', borderRadius: '8px', fontWeight: 'bold', border:'none', cursor:'pointer', fontSize: '16px' }}
        >
          Encrypt & Securely Save
        </button>

        <div style={{ marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>
          <h2 style={{ color: '#2d3748', fontSize: '22px' }}>
            Find My Records <span style={{color: '#e53e3e'}}>*</span>
          </h2>
          <p style={{color: '#718096', fontSize: '14px', marginBottom: '15px'}}>Search your tag to see your encrypted files.</p>
          
          <input 
            type="text" 
            placeholder="🔍 Type your tag to search..." 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #3182ce', marginBottom: '25px', boxSizing: 'border-box' }} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredHistory.map((item) => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#f7fafc', borderRadius: '10px', marginBottom: '12px', borderLeft: '4px solid #3182ce' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#a0aec0' }}>{item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</div>
                  <div style={{ fontWeight: 'bold', color: '#4a5568' }}>Tag: {item.userTag}</div>
                  <div style={{ fontSize: '13px', color: '#718096' }}>Type: {item.type.toUpperCase()}</div>
                </div>
                <button onClick={() => unlockItem(item.payload)} style={{ padding: '8px 18px', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #cbd5e0' }}>Unlock</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;