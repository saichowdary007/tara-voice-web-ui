import os
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect, Query
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import uvicorn
from src.auth import AuthManager 
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from src.stt import STT
from src.llm import LLM
from src.tts import TTS
from src.conversation import ConversationManager
from src.config import USE_SUPABASE
import asyncio

# Environment variables
SECRET_KEY = os.environ.get("SUPABASE_JWT_SECRET") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

app = FastAPI()

auth_manager = AuthManager()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(BaseModel):
    email: str
    password: str

# Token creation
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # This is a simplified user object. In a real app, you'd fetch the user from the DB.
    # For this agent, the email is sufficient to identify the user for conversation history.
    user_id = auth_manager.get_user_id_from_email(email) # You'll need to implement this in auth.py
    if user_id is None:
        raise credentials_exception
    return {"email": email, "user_id": user_id}

async def get_current_user_ws(token: str = Query(...)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user_id = auth_manager.get_user_id_from_email(email)
    if user_id is None:
        raise credentials_exception
    return {"email": email, "user_id": user_id}

@app.post("/signup")
async def signup(user: User):
    try:
        auth_manager.sign_up(email=user.email, password=user.password)
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = auth_manager.sign_in(email=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, current_user: dict = Depends(get_current_user_ws)):
    user_id = current_user["user_id"]
    await manager.connect(websocket)
    
    # Initialize components for this user's session
    stt = STT()
    llm = LLM()
    tts = TTS()
    conversation = ConversationManager(user_id=user_id) if USE_SUPABASE else None

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            user_text = stt.transcribe_audio_stream(audio_bytes)

            if not user_text:
                await manager.send_personal_message("🤔 Sorry, I didn't catch that.", websocket)
                continue
            
            await manager.send_personal_message(f"🎤 You said: {user_text}", websocket)


            # 2. Get Conversation History & User Profile
            history, profile_facts = [], []
            if conversation:
                history, profile_facts = await asyncio.gather(
                    conversation.get_context_for_llm(user_text),
                    conversation.get_user_profile()
                )

            # 3. Generate AI Response
            await manager.send_personal_message("🤖 Thinking...", websocket)
            ai_response = await llm.generate_response(user_text, history, profile_facts)
            await manager.send_personal_message(f"💬 AI: {ai_response}", websocket)

            # 4. Speak the Response (send audio back to client)
            audio_path = await tts.speak(ai_response)
            if audio_path and os.path.exists(audio_path):
                 with open(audio_path, "rb") as f:
                    await websocket.send_bytes(f.read())
            else:
                await manager.send_personal_message("️Could not generate audio response.", websocket)


            # 5. Update history and learn new facts
            if conversation:
                await conversation.add_message("user", user_text)
                await conversation.add_message("model", ai_response)

                new_facts = await llm.extract_facts(f"User: {user_text}\nAI: {ai_response}")
                if new_facts:
                    await conversation.update_user_profile(new_facts)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client {user_id} disconnected")
    except Exception as e:
        print(f"An error occurred: {e}")
        await manager.send_personal_message(f"An error occurred: {str(e)}", websocket)
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 