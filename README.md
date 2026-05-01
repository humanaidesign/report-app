# X-Ray Analysis Tool

## Preview
<img width="1491" height="848" alt="image" src="https://github.com/user-attachments/assets/375f2fe5-043a-4cde-a779-c92df99e917b" />

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.9+
- [OpenAI API key](https://platform.openai.com/api-keys) with GPT-4o access

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn openai python-dotenv python-multipart
```

Create `backend/.env`:
```
OPENAI_API_KEY=sk-your-key-here
```

```bash
uvicorn main:app --reload
```
Runs at `http://localhost:8000`.

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```
Runs at `http://localhost:5173`.

---

## Running MAIRA-2 on UVA HPC

### 0. Download the model from Hugging Face

You need a Hugging Face account with access to [microsoft/maira-2](https://huggingface.co/microsoft/maira-2).

On Rivanna, run:
```bash
ssh <uvaid>@login.hpc.virginia.edu
module load anaconda
pip install huggingface_hub
huggingface-cli login
```

Enter your Hugging Face token when prompted, then download the model:
```bash
python -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='microsoft/maira-2', local_dir='/scratch/<uvaid>/models/maira-2')
"
```

This will take a few minutes. The model will be saved to `/scratch/<uvaid>/models/maira-2`.

---

### 1. Upload model_server.py

From your local machine:
```bash
scp model_server.py <uvaid>@login.hpc.virginia.edu:~/maira/
```

---

### 2. Set up the environment

```bash
ssh <uvaid>@login.hpc.virginia.edu
cd ~/maira
source /scratch/<uvaid>/maira-env/bin/activate
pip install fastapi uvicorn pillow torch transformers huggingface_hub
```

---

### 3. Allocate a GPU node

```bash
salloc --partition=gpu --gres=gpu:a6000:1 --mem=40G --time=2:00:00 --ntasks=1
```

Check job status in a new terminal:
```bash
squeue -u <uvaid> --start
```

---

### 4. Start the model server

Once the job is ready:
```bash
srun --jobid=<jobid> --pty bash
source /scratch/<uvaid>/maira-env/bin/activate
cd ~/maira
uvicorn model_server:app --host 0.0.0.0 --port 8001
```

---

### 5. Open SSH tunnel

In a new terminal on your local machine:
```bash
ssh -L 8001:<nodename>:8001 <uvaid>@login.hpc.virginia.edu -N
```
Leave this terminal open. The `-N` flag means no output is expected.

---

### 6. Verify

```
http://localhost:8000/api/hpc-health
```

---

## License

MIT