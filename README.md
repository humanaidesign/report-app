# report-app

# X-Ray Analysis Tool

An AI-powered chest X-ray analysis tool that detects findings, draws bounding boxes on the image, and generates a narrative radiology report.

## Prerequisites

Make sure you have the following installed before you begin:

- [Node.js](https://nodejs.org/) v18 or higher
- [Python](https://www.python.org/) 3.9 or higher
- An [OpenAI API key](https://platform.openai.com/api-keys) with access to GPT-4o

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

---

### 2. Set up the Backend

Navigate into the backend folder (wherever `main.py` lives):

```bash
cd backend
```

Create and activate a virtual environment:

```bash
# Mac/Linux
python -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn openai python-dotenv python-multipart
```

Create a `.env` file in the backend folder and add your OpenAI API key:

```bash
# backend/.env
OPENAI_API_KEY=sk-your-key-here
```

Start the backend server:

```bash
uvicorn main:app --reload
```

The API will be running at `http://localhost:8000`.

---

### 3. Set up the Frontend

Open a new terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

## License

MIT
