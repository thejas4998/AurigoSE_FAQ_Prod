# qa_engine.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from langchain_community.document_loaders import (
    TextLoader, PyPDFLoader, UnstructuredExcelLoader, UnstructuredWordDocumentLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.vectorstores import InMemoryVectorStore
from langchain.chains import RetrievalQA
from langchain_anthropic import ChatAnthropic
from langchain_core.documents import Document
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

os.environ["TOKENIZERS_PARALLELISM"] = "false"
SUPPORTED_LOADERS = {
    ".txt": lambda path: TextLoader(path).load(),
    ".pdf": lambda path: PyPDFLoader(path).load(),
    ".xlsx": lambda path: UnstructuredExcelLoader(path).load(),
    ".xls": lambda path: UnstructuredExcelLoader(path).load(),
    ".docx": lambda path: UnstructuredWordDocumentLoader(path).load(),
}

def load_documents_from_directory(directory: str) -> list[Document]:
    documents = []
    folder = Path(directory)
    for file_path in folder.glob("*"):
        ext = file_path.suffix.lower()
        loader_fn = SUPPORTED_LOADERS.get(ext)
        if loader_fn:
            try:
                docs = loader_fn(str(file_path))
                documents.extend(docs)
                print(f"Loaded {len(docs)} from {file_path.name}")
            except Exception as e:
                print(f"❌ Failed to load {file_path.name}: {e}")
    return documents

class QASystem:
    def __init__(self, directory="documents/"):
        self.docs = load_documents_from_directory(directory)
        self.split_docs = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        ).split_documents(self.docs)

        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
        self.vector_store = InMemoryVectorStore(self.embeddings)
        self.vector_store.add_documents(self.split_docs)

        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
        self.llm = ChatAnthropic(model="claude-3-5-sonnet-latest", temperature=0)

        # No longer using retrieval QA
        # self.qa_chain = RetrievalQA.from_chain_type(
        #     llm=self.llm,
        #     retriever=self.retriever,
        #     return_source_documents=True,
        # )

        self.memory = ConversationBufferMemory(
        memory_key="chat_history", return_messages=True, output_key="answer"
        )

        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.retriever,
            memory=self.memory,
            return_source_documents=True
        )

    def ask(self, query: str, history: list[tuple[str, str]]) -> str:
        response = self.qa_chain.invoke({"question": query})
        return response["answer"]
    
    def reset_memory(self):
        self.memory.clear()

    def add_new_documents(self, new_docs_dir: str):
        new_docs = load_documents_from_directory(new_docs_dir)
        new_splits = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        ).split_documents(new_docs)

        self.vector_store.add_documents(new_splits)
        print(f"✅ Added {len(new_splits)} chunks from new documents to the vector store.")