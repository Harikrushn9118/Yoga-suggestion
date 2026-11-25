# Yoga Suggestion RAG App 🧘‍♀️🤖

A smart Yoga assistant that uses **Retrieval-Augmented Generation (RAG)** to provide accurate, context-aware yoga recommendations. It combines local embeddings, a vector database, and the Google Gemini AI model to answer your yoga-related queries safely and effectively.

## 🚀 Features

- **Smart Suggestions:** Ask any yoga question and get AI-generated answers based on curated yoga knowledge.
- **RAG Architecture:** Uses **Pinecone** for vector storage and **Xenova/transformers** for high-performance local embeddings to retrieve relevant context.
- **Gemini AI Integration:** Powered by Google's **Gemini Flash** (`gemini-flash-latest`) model for fast and natural language generation.
- **Safety First:** Includes a custom **Safety Service** that detects and blocks inappropriate or medical-related queries (e.g., "pregnancy", "injury") using keyword and fuzzy matching.
- **Feedback System:** Tracks user interactions and feedback (thumbs up/down) to monitor answer quality.
- **Accounts & Saved Chats:** Sign up or sign in with email/password or Google. Signed-in users can revisit saved conversations; guests can chat without saving history to an account.
- **Follow-up Questions:** Uses recent messages in the current chat as context for related questions.
- **Modern UI:** Built with **React** and **Tailwind CSS**, featuring a clean, responsive design with dark mode support and smooth animations.
- **Source Citations:** Answers strictly cite sources from the internal knowledge base for credibility.

## 🛠️ Tech Stack

### Frontend

- **React** (Vite)
- **Tailwind CSS** (Styling & Animations)
- **Lucide React** (Icons)

### Backend

- **Node.js / Express** (Server)
- **Mongoose** (MongoDB Interaction for logging)
- **Pinecone** (Vector Database for RAG)
- **@xenova/transformers** (Local Embeddings generation)
- **@google/generative-ai** (AI Response Generation)
- **Dotenv** (Environment Management)

## 📂 Project Structure

```
├── backend/
│   ├── config/         # DB and AI configurations
│   ├── controllers/    # Request handlers (Chat, Feedback)
│   ├── models/         # MongoDB schemas (Interaction Logs)
│   ├── routes/         # API routes
│   └── services/       # Business logic (RAG, Safety, Embeddings, Pinecone)
│
└── frontend/
    ├── src/
    │   ├── components/ # Reusable UI components (Header, SearchInput, AnswerCard)
    │   └── assets/     # Static assets
```

## ⚡ Getting Started

### Prerequisites

- Node.js installed
- MongoDB instance (Local or Atlas)
- Pinecone Account & API Key
- Google Gemini API Key

### Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/Harikrushn9118/Yoga-suggestion.git
    cd Yoga-suggestion
    ```

2.  **Setup Backend**

    ```bash
    cd backend
    npm install
    ```

    Create a `.env` file in the `backend` directory using `env.example` as a template:

    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    GEMINI_API_KEY=your_google_gemini_key
    PINECONE_API_KEY=your_pinecone_api_key
    PINECONE_INDEX_NAME=your_pinecone_index_name
    SEED_DB=false
    JWT_SECRET=generate_a_random_secret_at_least_32_characters_long
    GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
    FRONTEND_ORIGIN=http://localhost:5173
    AUTH_COOKIE_SAME_SITE=lax
    ```

    Start the server:

    ```bash
    npm start
    ```

3.  **Setup Frontend**

    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

    Create `frontend/.env` using `.env.example`:

    ```env
    VITE_API_URL=http://localhost:5000
    VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id
    ```

### Google sign-in setup

Create a Google OAuth **Web application** client in Google Cloud Console and add `http://localhost:5173` as an authorized JavaScript origin. Use the same client ID in both environment files. The frontend client ID is public; never put a Google client secret in the frontend. The backend verifies Google's ID token before creating or signing in the account.

When deploying, set `VITE_API_URL` to the backend URL. Set `FRONTEND_ORIGIN` to the deployed frontend origin, and set `AUTH_COOKIE_SAME_SITE=none` if the frontend and backend are hosted on different sites. Keep `JWT_SECRET`, `MONGODB_URI`, `GEMINI_API_KEY`, and `PINECONE_API_KEY` only in the backend environment.

## 🛡️ API Endpoints

- `POST /auth/register`, `POST /auth/login`, `POST /auth/google`: Create an account or sign in.
- `GET /auth/me`, `POST /auth/logout`: Restore or end the current session.
- `POST /ask`: Ask a question. Send `conversationId` for saved chats or recent `history` for guest follow-ups.
- `GET /conversations`, `GET /conversations/:id`: List and reopen the signed-in user's saved chats.
- `POST /feedback`: Save feedback for an answer in the signed-in user's chat.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements.
