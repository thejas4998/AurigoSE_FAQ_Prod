# main.py
from pathlib import Path
import shutil
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from qa_engine import QASystem

app = FastAPI()
qa_system = QASystem()

# Enable CORS (useful for frontend calls)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only. Restrict in prod.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    history: list[tuple[str, str]] = [] # [(user_msg, bot_response), ...]

@app.post("/ask")
async def ask_question(req: QueryRequest):
    answer = qa_system.ask(req.query, req.history)
    return {"answer": answer}

@app.get("/")
def root():
    return {"message": "RAG app is running!"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    documents_path = Path("documents")
    documents_path.mkdir(exist_ok=True)

    file_path = documents_path / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Immediately add to vector store after saving
    qa_system.add_new_documents(str(documents_path))

    return {"message": f"{file.filename} uploaded and added to vector store."}