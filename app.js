// Whisper Me - Audio Steganography Application
// Main JavaScript file for encryption, decryption, and audio processing

class WhisperMe {
    constructor() {
        this.audioContext = null;
        this.generatedAudioBuffer = null;
        this.currentSeed = '';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupThemeToggle();
        this.setupCharacterCounter();
        this.setupDragAndDrop();
    }

    setupEventListeners() {
        // Mode switching
        document.getElementById('senderMode').addEventListener('change', () => {
            this.showSection('sender');
        });
        
        document.getElementById('receiverMode').addEventListener('change', () => {
            this.showSection('receiver');
        });

        // Sender form
        document.getElementById('senderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSenderSubmit();
        });

        // Receiver form
        document.getElementById('receiverForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReceiverSubmit();
        });

        // Button events
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadAudio();
        });

        document.getElementById('previewBtn').addEventListener('click', () => {
            this.previewAudio();
        });

        document.getElementById('copySeedBtn').addEventListener('click', () => {
            this.copySeed();
        });

        document.getElementById('qrCodeBtn').addEventListener('click', () => {
            this.generateQRCode();
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        const themeIcon = document.getElementById('themeIcon');
        const html = document.documentElement;

        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-bs-theme', newTheme);
            
            if (newTheme === 'dark') {
                themeIcon.textContent = '☀️';
                themeToggle.innerHTML = '<span id="themeIcon">☀️</span> Light Mode';
            } else {
                themeIcon.textContent = '🌙';
                themeToggle.innerHTML = '<span id="themeIcon">🌙</span> Dark Mode';
            }
        });
    }

    setupCharacterCounter() {
        const messageInput = document.getElementById('messageInput');
        const charCount = document.getElementById('charCount');

        messageInput.addEventListener('input', () => {
            const count = messageInput.value.length;
            charCount.textContent = count;
            charCount.style.color = '#667eea';
        });
    }

    setupDragAndDrop() {
        const audioFile = document.getElementById('audioFile');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            audioFile.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            audioFile.addEventListener(eventName, () => {
                audioFile.classList.add('drag-over');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            audioFile.addEventListener(eventName, () => {
                audioFile.classList.remove('drag-over');
            });
        });

        audioFile.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'audio/wav') {
                audioFile.files = files;
            }
        });
    }

    showSection(mode) {
        const senderSection = document.getElementById('senderSection');
        const receiverSection = document.getElementById('receiverSection');
        
        if (mode === 'sender') {
            senderSection.style.display = 'block';
            receiverSection.style.display = 'none';
        } else {
            senderSection.style.display = 'none';
            receiverSection.style.display = 'block';
        }
    }

    // Cryptographic functions
    deriveKey(seed) {
        // Use SHA-256 to derive a key from the seed
        const hash = sha256(seed);
        // Convert hex string to bytes and take first 16 bytes
        const keyBytes = [];
        for (let i = 0; i < 32; i += 2) {
            keyBytes.push(parseInt(hash.substr(i, 2), 16));
        }
        return keyBytes.slice(0, 16); // 16-byte key
    }

    xorEncrypt(message, key) {
        const messageBytes = new TextEncoder().encode(message);
        const encrypted = new Uint8Array(messageBytes.length);
        
        for (let i = 0; i < messageBytes.length; i++) {
            encrypted[i] = messageBytes[i] ^ key[i % key.length];
        }
        
        return encrypted;
    }

    xorDecrypt(encryptedBytes, key) {
        const decrypted = new Uint8Array(encryptedBytes.length);
        
        for (let i = 0; i < encryptedBytes.length; i++) {
            decrypted[i] = encryptedBytes[i] ^ key[i % key.length];
        }
        
        return new TextDecoder().decode(decrypted);
    }

    // Audio generation and processing
    async generateBeatsAudio(duration = 8, sampleRate = 44100) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const length = duration * sampleRate;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Generate a clean sine wave carrier
        const carrierFreq = 440; // Base frequency (A4 note)
        const modulationFreq = 0.5; // Slow modulation for variety
        const modulationDepth = 20; // Frequency variation
        
        for (let i = 0; i < length; i++) {
            const time = i / sampleRate;
            
            // Modulated carrier frequency
            const instantFreq = carrierFreq + Math.sin(2 * Math.PI * modulationFreq * time) * modulationDepth;
            
            // Clean sine wave with gentle amplitude envelope
            const envelope = 0.5 - 0.3 * Math.cos(2 * Math.PI * time / duration);
            data[i] = Math.sin(2 * Math.PI * instantFreq * time) * envelope * 0.5;
        }

        return buffer;
    }

    embedDataInAudio(audioBuffer, data) {
        // console.log('Embedding data in audio...');
        
        const channelData = audioBuffer.getChannelData(0);
        const dataBytes = data instanceof Uint8Array ? data : new Uint8Array(data);
        
        // Add magic header (binary pattern)
        const magicHeader = [1, 0, 1, 1, 0, 0, 1, 0];
        
        // Calculate required samples
        const magicBits = magicHeader.length * 2; // Magic header bits with redundancy
        const lengthBits = 32 * 2; // 32-bit length with redundancy
        const dataBits = dataBytes.length * 8 * 2; // Data bytes converted to bits with redundancy
        const requiredSamples = magicBits + lengthBits + dataBits;
        
        if (requiredSamples > channelData.length) {
            throw new Error('Message too long for audio duration');
        }
        
        let sampleIndex = 0;
        
        // Embed magic header (already in bit format)
        for (let i = 0; i < magicHeader.length; i++) {
            const bitValue = magicHeader[i];
            const amplitude = bitValue ? 0.7 : 0.3;
            channelData[sampleIndex] = amplitude;
            channelData[sampleIndex + 1] = amplitude * 0.9; // Slightly reduced second sample
            sampleIndex += 2;
        }
        
        // Embed length header (32 bits, same as test script)
        for (let i = 31; i >= 0; i--) {
            const bitValue = (dataBytes.length >> i) & 1;
            
            // Write each bit twice with moderate amplitude
            const amplitude = bitValue ? 0.7 : 0.3;
            channelData[sampleIndex] = amplitude;
            channelData[sampleIndex + 1] = amplitude * 0.9; // Slightly reduced second sample
            sampleIndex += 2;
        }
        
        // Embed data bytes
        for (let i = 0; i < dataBytes.length; i++) {
            const byte = dataBytes[i];
            
            // Embed each bit twice for redundancy (MSB first)
            for (let bit = 7; bit >= 0; bit--) {
                const bitValue = (byte >> bit) & 1;
                
                // Write each bit twice with moderate amplitude
                const amplitude = bitValue ? 0.7 : 0.3;
                channelData[sampleIndex] = amplitude;
                channelData[sampleIndex + 1] = amplitude * 0.9; // Slightly reduced second sample
                sampleIndex += 2;
            }
        }
        

        
        // console.log(`Embedded ${dataBytes.length} bytes of data`);
        
        return audioBuffer;
    }

    extractDataFromAudio(audioBuffer) {
        // console.log('Extracting data from audio...');
        
        const channelData = audioBuffer.getChannelData(0);
        const len = channelData.length;
        
        // Thresholds for bit detection
        const strongHi = 0.6, strongLo = 0.4; // More lenient thresholds
        
        // Read a redundant bit (2 samples per bit)
        const readRedundantBit = (idx) => {
            if (idx + 1 >= len) return -1;
            const s1 = channelData[idx] || 0;
            const s2 = channelData[idx + 1] || 0;
            
            // Average the samples for more reliable detection
            const avg = (s1 + s2) / 2;
            if (avg > strongHi) return 1;
            if (avg < strongLo) return 0;
            
            // Fall back to individual sample check if average is ambiguous
            if (s1 > strongHi && s2 > 0.5) return 1;
            if (s1 < strongLo && s2 < 0.5) return 0;
            return -1; // truly ambiguous
        };
        

        
        // Scan for magic header (binary pattern) with redundant encoding
        const magicTarget = [1, 0, 1, 1, 0, 0, 1, 0];
        const maxStart = Math.max(0, len - 32); // Account for redundant bits
        let headerIndex = -1;
        
        scan:
        for (let start = 0; start <= maxStart; start += 2) { // Step by 2 for redundant bits
            let bitPos = start;
            let matched = true;
            for (let b = 0; b < magicTarget.length; b++) {
                if (bitPos >= len) { matched = false; break; }
                const v = readRedundantBit(bitPos);
                if (v === -1 || v !== magicTarget[b]) { matched = false; break; }
                bitPos += 2; // Move to next redundant bit pair
            }
            if (matched) { headerIndex = start; break scan; }
        }
        
        if (headerIndex === -1) {
            throw new Error('Magic header not found - corrupted or invalid audio file');
        }
        
        // console.log('Magic header found at sample', headerIndex);
        let sampleIndex = headerIndex + 16; // Move past redundant magic header (8 bits * 2 redundancy)
        
        // Extract length header (32 bits, same as test script)
        let dataLength = 0;
        for (let i = 0; i < 32; i++) {
            const bit = readRedundantBit(sampleIndex);
            if (bit === -1) {
                throw new Error('Failed to read data length');
            }
            dataLength = (dataLength << 1) | bit;
            sampleIndex += 2;
        }
        
        // console.log('Data length:', dataLength);
        
        const remainingSamples = len - sampleIndex;
        if (dataLength <= 0 || dataLength > 1000000) { // Sanity check
            throw new Error(`Invalid data length: ${dataLength}`);
        }
        if (dataLength > Math.floor(remainingSamples / 16)) { // Account for redundancy
            throw new Error('Audio file too short for claimed data length');
        }
        
        // Extract actual data with redundancy
        const dataBytes = new Uint8Array(dataLength);
        for (let i = 0; i < dataLength; i++) {
            let byte = 0;
            for (let bit = 7; bit >= 0; bit--) {
                if (sampleIndex >= len) {
                    throw new Error('Audio file truncated - data incomplete');
                }
                const bitValue = readRedundantBit(sampleIndex);
                if (bitValue === -1) {
                    throw new Error('Corrupted data - ambiguous bits detected');
                }
                byte |= (bitValue << bit);
                sampleIndex += 2;
            }
            dataBytes[i] = byte;
        }
        
        // console.log('Successfully extracted data');
        return dataBytes;
    }

    audioBufferToWav(audioBuffer) {
        const length = audioBuffer.length;
        const sampleRate = audioBuffer.sampleRate;
        const buffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(buffer);
        const channelData = audioBuffer.getChannelData(0);
        
        // Minimal WAV header without metadata
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        // RIFF header
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        
        // Format chunk
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // Chunk size
        view.setUint16(20, 1, true);  // Audio format (PCM)
        view.setUint16(22, 1, true);  // Number of channels
        view.setUint32(24, sampleRate, true); // Sample rate
        view.setUint32(28, sampleRate * 2, true); // Byte rate
        view.setUint16(32, 2, true);  // Block align
        view.setUint16(34, 16, true); // Bits per sample
        
        // Data chunk
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Convert float samples to 16-bit PCM
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, Math.round(sample * 32767), true);
            offset += 2;
        }
        
        return buffer;
    }

    async wavToAudioBuffer(arrayBuffer) {
        // Manual WAV parsing to match test script behavior
        const view = new DataView(arrayBuffer);
        
        // Parse WAV header manually
        const sampleRate = view.getUint32(24, true);
        const dataOffset = 44; // Standard WAV header size
        const dataLength = view.getUint32(40, true);
        
        const samples = new Float32Array(dataLength / 2);
        for (let i = 0; i < samples.length; i++) {
            const sample16 = view.getInt16(dataOffset + i * 2, true);
            samples[i] = sample16 / 32768.0;
        }
        
        // Create audio context if needed
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const audioBuffer = this.audioContext.createBuffer(1, samples.length, sampleRate);
        audioBuffer.getChannelData(0).set(samples);
        
        return audioBuffer;
    }

    // UI handlers
    async handleSenderSubmit() {
        const message = document.getElementById('messageInput').value.trim();
        const seed = document.getElementById('seedInput').value.trim();
        
        if (!message) {
            this.showError('Please enter a message');
            return;
        }
        
        if (!seed) {
            this.showError('Please enter a seed');
            return;
        }
        
        if (seed.length < 8) {
            this.showError('Seed must be at least 8 characters long');
            return;
        }
        
        try {
            this.showProgress('sender', 0);
            
            // Derive key from seed
            const key = this.deriveKey(seed);
            this.showProgress('sender', 20);
            
            // Encrypt message
            const encryptedData = this.xorEncrypt(message, key);
            this.showProgress('sender', 40);
            
            // Generate audio
            const audioBuffer = await this.generateBeatsAudio();
            this.showProgress('sender', 60);
            
            // Embed data in audio
            this.generatedAudioBuffer = this.embedDataInAudio(audioBuffer, encryptedData);
            this.showProgress('sender', 80);
            
            // Store seed for display
            this.currentSeed = seed;
            
            this.showProgress('sender', 100);
            this.showSenderResult();
            
        } catch (error) {
            this.showError('Error generating audio: ' + error.message);
            this.hideProgress('sender');
        }
    }

    async handleReceiverSubmit() {
        const audioFile = document.getElementById('audioFile').files[0];
        const seed = document.getElementById('receiverSeed').value.trim();
        
        if (!audioFile || !seed) {
            this.showError('Please select an audio file and enter the seed');
            return;
        }
        
        try {
            this.showProgress('receiver', 0);
            
            // Read audio file
            const arrayBuffer = await audioFile.arrayBuffer();
            this.showProgress('receiver', 25);
            
            // Decode audio
            const audioBuffer = await this.wavToAudioBuffer(arrayBuffer);
            this.showProgress('receiver', 50);
            
            // Extract encrypted data
            const encryptedData = this.extractDataFromAudio(audioBuffer);
            this.showProgress('receiver', 75);
            
            // Derive key and decrypt
            const key = this.deriveKey(seed);
            const decryptedMessage = this.xorDecrypt(encryptedData, key);
            this.showProgress('receiver', 100);
            
            // // Debug: Log intermediate values
            // console.log('Extracted data length:', encryptedData.length);
            // console.log('Decrypted message length:', decryptedMessage.length);
            // console.log('Decrypted message preview:', decryptedMessage.substring(0, 50));
            
            this.showReceiverResult(decryptedMessage, true);
            
        } catch (error) {
            // console.error('Decryption error:', error);
            this.showReceiverResult('Incorrect seed or invalid audio file. Please check your inputs and try again.', false);
            this.hideProgress('receiver');
        }
    }

    showProgress(section, percent) {
        const progressElement = document.getElementById(`${section}Progress`);
        const progressBar = progressElement.querySelector('.progress-bar');
        
        progressElement.style.display = 'block';
        progressBar.style.width = `${percent}%`;
        progressBar.setAttribute('aria-valuenow', percent);
    }

    hideProgress(section) {
        const progressElement = document.getElementById(`${section}Progress`);
        progressElement.style.display = 'none';
    }

    showSenderResult() {
        const resultElement = document.getElementById('senderResult');
        const seedDisplay = document.getElementById('seedDisplay');
        
        seedDisplay.value = this.currentSeed;
        resultElement.style.display = 'block';
        resultElement.classList.add('animate-success');
        
        this.hideProgress('sender');
    }

    showReceiverResult(message, isSuccess) {
        const resultElement = document.getElementById('receiverResult');
        
        if (isSuccess) {
            resultElement.innerHTML = `
                <div class="alert alert-success animate-success">
                    <h5>✅ Message Decrypted Successfully!</h5>
                    <hr>
                    <div class="bg-light p-3 rounded" style="border-left: 4px solid #28a745;">
                        <strong>Decrypted Message:</strong><br>
                        <span style="font-family: monospace; white-space: pre-wrap;">${this.escapeHtml(message)}</span>
                    </div>
                </div>
            `;
        } else {
            resultElement.innerHTML = `
                <div class="alert alert-danger animate-error">
                    <h5>❌ Decryption Failed</h5>
                    <p>${this.escapeHtml(message)}</p>
                    <small>Make sure you're using the correct seed and a valid audio file.</small>
                </div>
            `;
        }
        
        resultElement.style.display = 'block';
        this.hideProgress('receiver');
    }

    showError(message) {
        // Create temporary error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show animate-error';
        alertDiv.innerHTML = `
            <strong>Error:</strong> ${this.escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Insert at top of container
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    downloadAudio() {
        if (!this.generatedAudioBuffer) {
            this.showError('No audio to download');
            return;
        }
        
        const wavBuffer = this.audioBufferToWav(this.generatedAudioBuffer);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'whisper-me-message.wav';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    previewAudio() {
        if (!this.generatedAudioBuffer) {
            this.showError('No audio to preview');
            return;
        }
        
        const wavBuffer = this.audioBufferToWav(this.generatedAudioBuffer);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        const audioPreview = document.getElementById('audioPreview');
        audioPreview.src = url;
        
        const modal = new bootstrap.Modal(document.getElementById('audioModal'));
        modal.show();
    }

    copySeed() {
        const seedDisplay = document.getElementById('seedDisplay');
        seedDisplay.select();
        document.execCommand('copy');
        
        // Show temporary feedback
        const btn = document.getElementById('copySeedBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-outline-secondary');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-secondary');
        }, 2000);
    }

    generateQRCode() {
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = ''; // Clear previous QR code
        
        // Fallback QR code display when library is not available
        if (typeof QRCode === 'undefined') {
            qrContainer.innerHTML = `
                <div class="text-center p-3 border rounded">
                    <h6>Seed for sharing:</h6>
                    <code class="user-select-all">${this.currentSeed}</code>
                    <p class="text-muted mt-2 small">Copy this seed to share with others</p>
                </div>
            `;
            const modal = new bootstrap.Modal(document.getElementById('qrModal'));
            modal.show();
            return;
        }
        
        QRCode.toCanvas(qrContainer, this.currentSeed, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) {
                qrContainer.innerHTML = `
                    <div class="text-center p-3 border rounded">
                        <h6>Seed for sharing:</h6>
                        <code class="user-select-all">${this.currentSeed}</code>
                        <p class="text-muted mt-2 small">Copy this seed to share with others</p>
                    </div>
                `;
            }
            
            const modal = new bootstrap.Modal(document.getElementById('qrModal'));
            modal.show();
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WhisperMe();
});
