# 🎵 Whisper Me

A fully local, open-source web application for hiding encrypted messages in audio files using seed-based key derivation (SHA-256) and LSB steganography. Messages are encrypted with XOR and embedded in generated audio, decryptable by anyone with the same seed.

 <h2>🚀 <strong><a href="https://xrpgarv.me/whisperMe/" target="_blank">✨ Try WhisperMe Now✨</a></strong></h2>
 
## ✨ Features

- **🔒 Fully Local Processing**: No data leaves your device - complete privacy
- **🎵 Audio Steganography**: Hide messages in beat tracks using LSB (Least Significant Bit) technique
- **🔑 Seed-based Encryption**: Deterministic encryption/decryption using SHA-256 key derivation
- **🌙 Dark/Light Mode**: Beautiful UI with theme switching
- **📱 QR Code Sharing**: Generate QR codes for secure seed sharing
- **🔊 Audio Preview**: Listen to generated audio before downloading
- **📁 Drag & Drop**: Easy file upload with drag and drop support
- **⚡ Real-time Progress**: Visual feedback during encryption/decryption

## 🚀 Quick Start

### Option 1: Local Development Server

1. Clone or download this repository
2. Navigate to the project directory
3. Start a local server:
   ```bash
   # Using Python 3
   python3 -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```
4. Open `http://localhost:8000` in your browser

### Option 2: Direct File Access

Simply open `index.html` in your web browser (some features may be limited due to CORS restrictions).

## 📖 How to Use

### Sending a Message

1. **Switch to Send Mode**: Click "📤 Send Message"
2. **Enter Your Message**: Type your secret message (max 10KB)
3. **Create a Seed**: Enter a strong passphrase (min 8 characters)
4. **Generate Audio**: Click "🎵 Generate Audio"
5. **Download**: Save the generated WAV file
6. **Share Seed**: Copy the seed or generate a QR code
7. **Distribute**: Send the WAV file and seed through different channels

### Receiving a Message

1. **Switch to Receive Mode**: Click "📥 Receive Message"
2. **Upload Audio**: Select or drag the WAV file
3. **Enter Seed**: Input the seed you received
4. **Decrypt**: Click "🔓 Decrypt Message"
5. **Read**: View the decrypted message

## 🔧 Technical Details

### Architecture
- **Type**: Client-side only web application
- **Environment**: Modern web browsers (Chrome, Firefox, Edge)
- **APIs**: Web Audio API, File API
- **Libraries**: Bootstrap 5, js-sha256, qrcode.js

### Encryption Process
1. **Key Derivation**: SHA-256 hash of seed → 16-byte encryption key
2. **Message Encryption**: XOR cipher with derived key
3. **Audio Generation**: Beat track (8 seconds, 44.1kHz, 16-bit PCM)
4. **Steganography**: LSB embedding with 32-bit length header
5. **Output**: WAV file with hidden encrypted message

### Decryption Process
1. **Audio Analysis**: Extract LSB bits from uploaded WAV
2. **Header Parsing**: Read 32-bit message length
3. **Data Extraction**: Extract encrypted message bits
4. **Key Derivation**: SHA-256 hash of provided seed
5. **Decryption**: XOR cipher to reveal original message

### Security Considerations

⚠️ **Important Security Notes**:

- **XOR Encryption**: Simple but vulnerable to known-plaintext attacks
- **Seed Strength**: Use long, random seeds (20+ characters recommended)
- **Seed Sharing**: Always share seeds through different channels than the audio
- **LSB Detection**: Advanced analysis can detect LSB modifications
- **No Authentication**: No built-in message authentication

**Recommended Practices**:
- Use seeds like: `x7$kPq9#mW2nL8vR!3zK8@mN`
- Share WAV via email, seed via encrypted messaging
- Verify the open-source code for transparency

## 🛠️ Development

### Project Structure
```
whisper-me/
├── index.html          # Main HTML file
├── style.css           # Custom CSS styles
├── app.js              # Core JavaScript functionality
├── plan.json           # Project specification
└── README.md           # This file
```

### Key Components

- **WhisperMe Class**: Main application controller
- **Cryptographic Functions**: SHA-256 key derivation, XOR encryption
- **Audio Processing**: White noise generation, WAV encoding/decoding
- **Steganography**: LSB embedding and extraction
- **UI Management**: Theme switching, progress tracking, error handling

### Browser Compatibility

- ✅ Chrome 66+
- ✅ Firefox 60+
- ✅ Edge 79+
- ✅ Safari 14+

*Requires Web Audio API and File API support*

## 🔮 Future Enhancements

- **Phase Encoding**: More sophisticated steganography technique
- **Custom Carrier Audio**: Use music or voice instead of generated beats
- **PWA Support**: Offline functionality with Service Workers
- **WebRTC Integration**: Peer-to-peer audio sharing
- **Advanced Encryption**: AES encryption option
- **Message Authentication**: HMAC for message integrity

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -am 'Add feature'`
6. Push: `git push origin feature-name`
7. Submit a Pull Request

## ⚠️ Disclaimer

This tool is for educational and legitimate privacy purposes only. The authors are not responsible for any misuse of this software. Always comply with local laws and regulations.

## 🙏 Acknowledgments

- [Bootstrap](https://getbootstrap.com/) for the beautiful UI framework
- [js-sha256](https://github.com/emn178/js-sha256) for SHA-256 implementation
- [qrcode.js](https://davidshimjs.github.io/qrcodejs/) for QR code generation
- Web Audio API for audio processing capabilities

---

**Built with ❤️ for privacy and security**

*Star ⭐ this repository if you find it useful!*
