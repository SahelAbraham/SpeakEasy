from fastapi import FastAPI, Request
from fastapi.responses import PlainTextResponse

app = FastAPI()

@app.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    form = await request.form()

    sender = form.get("From")
    message = form.get("Body")

    print("Sender:", sender)
    print("Message:", message)

    return PlainTextResponse("OK", status_code=200)
