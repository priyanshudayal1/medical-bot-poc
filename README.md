# 🏥 Dr. HealthAI - Real-Time Voice Medical Assistant

A sophisticated medical bot that provides real-time voice interaction powered by Google's Gemini 2.5 Flash AI model. The bot listens to your health concerns, processes them with AI, and responds with voice synthesis.

![Medical Bot](https://img.shields.io/badge/Next.js-15.5.5-black)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Gemini](https://img.shields.io/badge/Gemini-2.0--flash-yellow)

## ✨ Features

- 🎤 **Real-time Voice Recognition**: Continuous speech-to-text using Web Speech API
- 🤖 **AI-Powered Responses**: Medical advice powered by Google Gemini 2.5 Flash
- 🔊 **Text-to-Speech**: Natural voice responses from the bot
- 💬 **Conversational Context**: Maintains conversation history for better understanding
- 🎨 **Beautiful UI**: Modern design with Framer Motion animations
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile
- 🌓 **Dark Mode Support**: Automatic theme switching
- 📊 **Real-time Status Indicators**: Visual feedback for listening, processing, and speaking states

## 🚀 Tech Stack

- **Framework**: Next.js 15.5.5 with App Router
- **UI Library**: React 19.1.0
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Styling**: Tailwind CSS 4
- **Icons**: React Icons
- **AI Model**: Google Gemini 2.0 Flash (Experimental)
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js 18+ installed
- A Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Modern browser with microphone support

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd medical-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example env file
cp .env.example .env.local

# Edit .env.local and add your Gemini API key
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
medical-bot/
├── app/
│   ├── api/
│   │   ├── chat/          # Gemini AI integration
│   │   ├── tts/           # Text-to-speech API
│   │   └── health/        # Health check endpoint
│   ├── globals.css        # Global styles
│   ├── layout.js          # Root layout
│   └── page.js            # Main application page
├── components/
│   ├── ChatMessage.js     # Message bubble component
│   ├── VoiceVisualizer.js # Audio visualization
│   └── StatusIndicator.js # Status display
├── store/
│   └── useMedicalBotStore.js # Zustand state management
├── utils/
│   ├── speech.js          # Speech recognition & TTS utilities
│   └── websocket.js       # WebSocket service (for future use)
├── public/                # Static assets
└── README.md
```

## 🎯 How It Works

1. **Initialization**: The bot initializes speech services and greets the user
2. **Voice Input**: User clicks "Start Call" and speaks their health concerns
3. **Speech Recognition**: Browser's Web Speech API converts speech to text in real-time
4. **AI Processing**: Text is sent to Gemini 2.5 Flash with medical assistant context
5. **Response Generation**: AI generates a compassionate, informative response
6. **Voice Output**: Response is spoken back using Text-to-Speech
7. **Continuous Loop**: Bot automatically resumes listening after responding

## 🎨 Components Overview

### Main Page (`app/page.js`)
- Manages the entire voice interaction flow
- Handles speech recognition and text-to-speech
- Coordinates with Gemini API for AI responses

### Zustand Store (`store/useMedicalBotStore.js`)
- Centralized state management
- Manages connection, audio, and message states
- Provides actions for state updates

### Components
- **ChatMessage**: Displays user and bot messages with animations
- **VoiceVisualizer**: Canvas-based audio wave visualization
- **StatusIndicator**: Shows current bot status (listening, processing, etc.)

### API Routes
- **`/api/chat`**: Handles Gemini AI requests with medical context
- **`/api/tts`**: Text-to-speech endpoint (placeholder)
- **`/api/health`**: Health check for API status

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Yes |

## 🌐 Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Safari**: Partial support (some speech features may vary)
- **Firefox**: Limited speech recognition support

## ⚙️ Configuration

### Gemini Model Settings
The bot uses Gemini 2.0 Flash with a specialized medical assistant prompt. You can modify the system prompt in `/app/api/chat/route.js`:

```javascript
const MEDICAL_BOT_SYSTEM_PROMPT = `You are Dr. HealthAI...`;
```

### Speech Settings
Adjust speech recognition and TTS settings in `/utils/speech.js`:

```javascript
// Speech recognition
this.recognition.continuous = true;
this.recognition.interimResults = true;
this.recognition.lang = 'en-US';

// Text-to-speech
utterance.rate = 0.95;  // Speech speed
utterance.pitch = 1.0;  // Voice pitch
utterance.volume = 1.0; // Volume level
```

## 🚨 Important Notes

- ⚠️ **Not a Substitute for Professional Medical Advice**: This bot provides general information only. Always consult qualified healthcare professionals for medical advice.
- 🎤 **Microphone Permission**: Grant microphone access when prompted
- 🌐 **HTTPS Required**: Some browsers require HTTPS for speech recognition in production
- 📊 **Conversation History**: Last 10 messages are sent for context

## 🐛 Troubleshooting

### Microphone not working
- Check browser permissions
- Ensure you're on HTTPS (in production)
- Try a different browser (Chrome recommended)

### Bot not responding
- Verify your Gemini API key in `.env.local`
- Check browser console for errors
- Ensure you have a stable internet connection

### Speech recognition stops unexpectedly
- This is normal behavior - the bot pauses recognition while processing
- It automatically resumes after speaking the response

## 📝 License

MIT License - feel free to use this project for learning and development.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

**Disclaimer**: This application is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment.
