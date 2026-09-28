from fastapi import FastAPI

app = FastAPI(title="MailPilot AI")


@app.get("/")
def root():
    return {
        "message": "MailPilot AI is running",
        "status": "success"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}