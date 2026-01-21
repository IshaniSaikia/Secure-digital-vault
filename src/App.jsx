import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { db } from './firebase'; 
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

function App() {
  const [text, setText] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [history, setHistory] = useState([]);
  const [fileBase64, setFileBase64] = useState(null);

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

  // Password Requirement Logic
  const isPasswordValid = (pass) => {
    const minLength = pass.length >= 6;
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    return minLength && hasSpecialChar;
  };

  const handleEncryptAndSave = async () => {
    if (!password || (!text && !fileBase64)) {
      return alert("Error: Content and Password are required.");
    }

    if (!isPasswordValid(password)) {
      return alert("Error: Password must be at least 6 characters long and contain at least one special character.");
    }
    
    try {
      const dataToSecure = fileBase64 || text;
      const encrypted = CryptoJS.AES.encrypt(dataToSecure, password).toString();

      await addDoc(collection(db, "secretMessages"), {
        payload: encrypted,
        type: fileBase64 ? 'file' : 'text',
        timestamp: new Date()
      });
      
      alert("Encryption Success: Data has been securely stored in the vault.");
      setText(''); setFileBase64(null); setPassword('');
    } catch (e) { 
      alert("System Error: Failed to save data."); 
    }
  };

  const unlockItem = (encryptedPayload) => {
    const pass = prompt("Verification Required: Enter Security Password:");
    if (!pass) return;
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPayload, pass);
      const original = bytes.toString(CryptoJS.enc.Utf8);
      
      if (original && original.length > 0) {
        if (original.startsWith('data:')) {
          const link = document.createElement('a');
          link.href = original;
          link.download = "Decrypted_Vault_File_" + Date.now();
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          alert("Success: File decrypted and downloaded.");
        } else {
          alert("Decrypted Message: " + original);
        }
      } else {
        alert("Access Denied: Invalid Security Password.");
      }
    } catch (e) {
      alert("Decryption Error: Incorrect password.");
    }
  };

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', 
      minHeight: '100vh', 
      padding: '40px 20px', 
      fontFamily: '"Inter", sans-serif' 
    }}>
      <div style={{ 
        maxWidth: '750px', 
        margin: 'auto', 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        borderRadius: '20px', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)', 
        padding: '40px',
        backdropFilter: 'blur(10px)'
      }}>
        <h2 style={{ textAlign: 'center', color: '#1a365d', marginBottom: '30px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          🔒 SECURE DIGITAL VAULT
        </h2>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '10px' }}>Secure Message</label>
          <textarea 
            placeholder="Enter confidential notes..." 
            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', transition: '0.3s', boxSizing: 'border-box' }} 
            rows="3"
            value={text} onChange={(e)=>setText(e.target.value)} 
          />
        </div>
        
        <div style={{ marginBottom: '25px', padding: '20px', border: '2px dashed #cbd5e0', borderRadius: '12px', backgroundColor: '#f8fafc' }}>
          <label style={{ fontWeight: '600', color: '#4a5568' }}>Attachment (Photo/PDF)</label>
          <input type="file" onChange={handleFileChange} style={{ marginTop: '10px', display: 'block' }} />
          <p style={{ fontSize: '11px', color: '#718096', marginTop: '8px' }}>Max Size: 1MB</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '10px' }}>Vault Security Password</label>
          <input 
            type="password" placeholder="Min 6 chars + special char (!@#$)" 
            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', boxSizing: 'border-box' }} 
            value={password} onChange={(e)=>setPassword(e.target.value)} 
          />
          <ul style={{ fontSize: '11px', color: '#a0aec0', marginTop: '8px', paddingLeft: '20px' }}>
            <li>Minimum 6 characters</li>
            <li>Must contain at least one special character</li>
          </ul>
        </div>
        
        <button onClick={handleEncryptAndSave} style={{ 
          backgroundColor: '#2d3748', 
          color: 'white', 
          width: '100%', 
          padding: '16px', 
          border: 'none', 
          borderRadius: '12px', 
          cursor: 'pointer', 
          fontWeight: '700', 
          fontSize: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'all 0.2s ease'
        }}>
          Lock & Sync to Cloud
        </button>

        <div style={{ marginTop: '50px' }}>
          <h3 style={{ borderBottom: '2px solid #edf2f7', paddingBottom: '15px', color: '#2d3748', fontSize: '18px' }}>Audit Log & Vault Access</h3>
          {history.length === 0 ? <p style={{ color: '#a0aec0', textAlign: 'center', marginTop: '20px' }}>Your vault is empty.</p> : history.map((item) => (
            <div key={item.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '20px', 
              marginBottom: '10px',
              backgroundColor: '#fff',
              borderRadius: '12px',
              border: '1px solid #edf2f7',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <div>
                <small style={{ color: '#a0aec0', fontWeight: '500' }}>{item.timestamp ? new Date(item.timestamp.seconds * 1000).toLocaleString() : 'Saving...'}</small>
                <p style={{ margin: '4px 0', color: '#4a5568', fontSize: '14px' }}><b>Format:</b> {item.type ? item.type.toUpperCase() : 'TEXT'}</p>
              </div>
              <button 
                onClick={() => unlockItem(item.payload)} 
                style={{ 
                  padding: '10px 20px', 
                  borderRadius: '10px', 
                  border: '1px solid #2d3748', 
                  backgroundColor: 'transparent', 
                  color: '#2d3748', 
                  cursor: 'pointer', 
                  fontWeight: '600',
                  fontSize: '13px'
                }}>
                Unlock Vault
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;