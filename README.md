# 🏥 Dr. HealthAI - Real-Time Voice Medical Assistant

A sophisticated Telugu-language medical bot that provides real-time voice interaction powered by Google's Gemini 2.0 Flash AI model. The bot listens to your health concerns in Telugu, processes them with AI, and responds with natural voice synthesis.

![Medical Bot](https://img.shields.io/badge/Next.js-15.5.5-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Gemini](https://img.shields.io/badge/Gemini-2.0--flash-yellow)
![Language](https://img.shields.io/badge/Language-Telugu-green)

---

## 📖 User Guide

### Getting Started

#### Step 1: Setup
1. Ensure you have **Node.js 18+** installed
2. Get your **Google Gemini API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file in the root directory and add:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
5. Start the application:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Step 2: Grant Microphone Permission
- When you first click "Start Call", your browser will ask for microphone permission
- Click **Allow** to enable voice interaction
- This permission is required for the voice features to work

### Using the Medical Bot

#### Starting a Conversation
1. **Click the "Start Call" button** (green button with phone icon)
2. The bot will greet you in Telugu: *"నమస్కారం! నేను డాక్టర్ హెల్త్ఏఐ..."*
3. Wait for the greeting to finish
4. Start speaking your health concerns in **Telugu**

#### During the Call
- **Speak clearly** into your microphone about your symptoms or health questions
- The bot will show your words as you speak (interim transcript)
- When you pause, the bot processes your message and responds
- **Listen to the response** - the bot speaks back in Telugu
- The bot automatically resumes listening after each response
- Continue the conversation naturally - no need to click anything repeatedly

#### Ending the Call
- Click the **"End Call" button** (red button with phone icon) to stop the session
- All your conversation history remains visible on screen

### Understanding the Interface

#### Main Chat Area (Left Side)
- **User Messages**: Your questions appear in gray bubbles on the right
- **Bot Responses**: Dr. HealthAI's answers appear in blue bubbles on the left
- **Live Transcript**: Your ongoing speech appears in a lighter bubble as you speak
- **Voice Visualizer**: Animated waves at the bottom show when the bot is listening or speaking

#### Control Panel (Right Side)

**Voice Call Section**
- **Start Call**: Green button to begin voice interaction
- **End Call**: Red button to stop the session
- **Error Messages**: Displays any issues (API errors, microphone problems, etc.)

**Bot Status Section**
- **Listening**: Green indicator - bot is actively listening to you
- **Processing**: Yellow indicator - bot is thinking about your question
- **Speaking**: Blue indicator - bot is responding to you

**How to Use Section**
- Quick reference guide for using the application
- Step-by-step instructions

### Status Indicators

| Indicator | Meaning |
|-----------|---------|
| 🟢 **Listening** | Bot is hearing your voice and converting to text |
| 🟡 **Processing** | Bot is sending your question to AI and getting a response |
| 🔵 **Speaking** | Bot is reading the response aloud to you |
| ⚫ **Inactive** | Feature is currently not active |

### Best Practices

#### For Best Results
1. **Speak clearly** and at a moderate pace
2. **Use Telugu language** - the bot is optimized for Telugu
3. **Describe symptoms specifically** (e.g., "నాకు రెండు రోజులుగా తలనొప్పి ఉంది")
4. **Ask one question at a time** for clearer responses
5. **Wait for the bot** to finish speaking before asking your next question

#### What to Expect
- ✅ **General health information** and guidance
- ✅ **Symptom assessment** and general advice
- ✅ **Wellness tips** and preventive care suggestions
- ✅ **When to see a doctor** recommendations
- ❌ **NOT medical diagnosis** - always consult a real doctor
- ❌ **NOT medication prescriptions** - only a licensed doctor can prescribe

### Troubleshooting

#### Microphone Not Working
- **Check browser permissions**: Click the lock icon in the address bar → Site settings → Allow microphone
- **Try Chrome or Edge**: These browsers have the best Web Speech API support
- **Check system settings**: Ensure your microphone is not muted in Windows settings
- **Restart the browser** and try again

#### Bot Not Responding
- **Verify API Key**: Check that `GEMINI_API_KEY` is correctly set in `.env.local`
- **Check internet connection**: The bot requires internet to connect with Gemini AI
- **Look for error messages**: Red error boxes will explain what went wrong
- **Check browser console**: Press F12 and look for errors in the Console tab

#### Speech Recognition Issues
- **Use Telugu**: The recognition is configured for Telugu language (`te-IN`)
- **Speak louder**: Ensure your microphone can hear you clearly
- **Reduce background noise**: Find a quieter environment
- **Check interim transcript**: If you see text appearing as you speak, recognition is working

#### Bot Keeps Stopping
- **This is normal**: The bot pauses while thinking and speaking
- **It auto-resumes**: After responding, it automatically starts listening again
- **Don't click Start Call repeatedly**: Just wait for the bot to finish

#### Voice Not Playing
- **Check system volume**: Ensure your speakers/headphones are not muted
- **Wait for initialization**: The text-to-speech system takes a few seconds to load
- **Try refreshing**: Reload the page if voice doesn't work after 10 seconds
- **Check browser**: Safari and Firefox have limited TTS support compared to Chrome

### Technical Details

#### Features
- 🎤 **Real-time Voice Recognition**: Continuous speech-to-text using Web Speech API
- 🤖 **AI-Powered Responses**: Medical advice powered by Google Gemini 2.0 Flash
- 🔊 **Telugu Text-to-Speech**: Natural voice responses in Telugu
- 💬 **Conversational Context**: Maintains last 10 messages for better understanding
- 🎨 **Beautiful Animations**: Smooth UI with Framer Motion
- 📱 **Responsive Design**: Works on desktop and mobile
- 🌓 **Dark Mode**: Automatic theme switching
- 📊 **Visual Feedback**: Real-time status indicators and voice visualizer

#### Tech Stack
- **Frontend**: Next.js 15.5.5, React 19.1.0, Tailwind CSS 4
- **State Management**: Zustand
- **Animations**: Framer Motion
- **AI Model**: Google Gemini 2.0 Flash (Experimental)
- **Speech**: Web Speech API (Browser Native)

#### Browser Support
| Browser | Voice Recognition | Text-to-Speech | Recommended |
|---------|------------------|----------------|-------------|
| Chrome | ✅ Full | ✅ Full | ⭐ Yes |
| Edge | ✅ Full | ✅ Full | ⭐ Yes |
| Safari | ⚠️ Partial | ⚠️ Partial | ⚡ OK |
| Firefox | ❌ Limited | ⚠️ Partial | ⚠️ Not Recommended |

#### Privacy & Data
- **Microphone data**: Processed locally by browser, sent to Google AI only as text
- **Conversation history**: Stored only in browser memory (not persisted)
- **No data collection**: This app doesn't store or track your health information
- **Session-based**: Everything is cleared when you close the tab

### Important Disclaimer

⚠️ **MEDICAL DISCLAIMER**

Dr. HealthAI is an **educational and informational tool only**. It is NOT a substitute for professional medical advice, diagnosis, or treatment.

**Always:**
- Consult qualified healthcare professionals for medical concerns
- Seek immediate medical attention for emergencies
- Follow your doctor's advice over AI recommendations
- Get proper diagnosis before taking any medical action

**This bot:**
- ✅ Provides general health information
- ✅ Offers wellness guidance
- ✅ Suggests when to see a doctor
- ❌ Does NOT diagnose medical conditions
- ❌ Does NOT prescribe medications
- ❌ Does NOT replace doctor visits

Use this application responsibly and always prioritize professional medical care.

---

## 🛠️ Developer Information

### Installation for Developers
```bash
# Clone repository
git clone <your-repo-url>
cd medical-bot

# Install dependencies
npm install

# Set up environment
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Project Structure
```
medical-bot/
├── app/
│   ├── api/
│   │   ├── chat/route.js         # Gemini AI integration
│   │   ├── tts/route.js          # Text-to-speech API
│   │   └── health/route.js       # Health check endpoint
│   ├── globals.css               # Global styles
│   ├── layout.js                 # Root layout
│   └── page.js                   # Main application page
├── components/
│   ├── ChatMessage.js            # Message bubble component
│   ├── VoiceVisualizer.js        # Audio visualization
│   └── StatusIndicator.js        # Status display
├── store/
│   └── useMedicalBotStore.js     # Zustand state management
├── utils/
│   ├── speech.js                 # Speech recognition & TTS
│   └── websocket.js              # WebSocket service (future)
└── public/                       # Static assets
```

### Configuration

#### Modify AI System Prompt
Edit `app/api/chat/route.js`:
```javascript
const MEDICAL_BOT_SYSTEM_PROMPT = `You are Dr. HealthAI...`;
```

#### Adjust Speech Settings
Edit `utils/speech.js`:
```javascript
// Speech Recognition
this.recognition.lang = 'te-IN';  // Telugu language
this.recognition.continuous = true;
this.recognition.interimResults = true;

// Text-to-Speech
utterance.rate = 0.95;   // Speed
utterance.pitch = 1.0;   // Pitch
utterance.volume = 1.0;  // Volume
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Send message to Gemini AI |
| `/api/health` | GET | Check API health status |
| `/api/tts` | POST | Text-to-speech (placeholder) |

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 📝 License

MIT License - Free for learning and development

## 🤝 Contributing

Contributions welcome! Please submit a Pull Request.

## 📧 Support

For issues and questions, open an issue on GitHub.

---

**Made with ❤️ for better health accessibility**
