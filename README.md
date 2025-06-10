# Tara Voice Agent

A modern, responsive web UI for the Tara Voice Agent with real-time speech processing, natural language understanding, and conversational memory.

## Features

- **Ultra-fast Response Time**: Sub-500ms round-trip latency for a true conversational experience
- **Voice-First Interface**: Natural voice interaction with barge-in capability
- **Supabase Integration**: Secure authentication and user profiles
- **Conversation Memory**: Maintains context across conversations
- **User Profile Learning**: Remembers facts about the user for personalized interactions
- **Responsive Web UI**: Modern interface with real-time status indicators

## Architecture

The application consists of two main components:

1. **Backend (Python FastAPI)**: Handles authentication, speech-to-text, AI processing, and text-to-speech
2. **Frontend (React/Vite)**: Provides the user interface with WebSocket communication

## Setup

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- npm or yarn
- Supabase account (for authentication and storage)

### Backend Setup

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   # Create a .env file in the backend directory
   echo "SUPABASE_URL=your-supabase-url" > backend/.env
   echo "SUPABASE_KEY=your-supabase-key" >> backend/.env
   echo "SUPABASE_JWT_SECRET=your-jwt-secret" >> backend/.env
   
   # Optional: Add LLM API keys if using OpenAI or other providers
   echo "OPENAI_API_KEY=your-openai-key" >> backend/.env
   ```

3. Initialize Supabase tables (run once):
   ```bash
   cd backend
   python setup_supabase.py
   ```

### Frontend Setup

1. Install frontend dependencies:
   ```bash
   npm install
   ```

## Running the Application

You can run both the backend and frontend together using the provided script:

```bash
chmod +x run.sh  # Make the script executable (first time only)
./run.sh
```

Or run them separately:

**Backend:**
```bash
cd backend
python api.py
```

**Frontend:**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Usage

1. **Sign Up/Sign In**: Create an account or sign in to your existing account
2. **Speak to Tara**: Click the microphone button and start speaking
3. **Interrupt Anytime**: Start speaking while Tara is talking to interrupt (barge-in)
4. **View Your Profile**: Check what Tara has learned about you in the Profile section
5. **Text Input**: Type messages as an alternative to voice

## Development

### Backend Structure

- `backend/api.py`: FastAPI application with WebSocket endpoint
- `backend/src/auth.py`: Authentication manager for Supabase
- `backend/src/stt.py`: Speech-to-text processing
- `backend/src/llm.py`: AI language model integration
- `backend/src/tts.py`: Text-to-speech synthesis
- `backend/src/conversation.py`: Conversation history and user profile management

### Frontend Structure

- `src/components/VoiceAgent.tsx`: Main voice agent component
- `src/pages`: React Router pages
- `src/lib`: Utility functions and API services

## Testing

Refer to `backend/TESTING.md` for details on testing procedures and performance benchmarks.

## License

This project is licensed under the MIT License.
