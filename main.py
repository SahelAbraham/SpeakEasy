from fastapi import FastAPI, Request
from fastapi.responses import Response

app = FastAPI()

@app.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    form = await request.form()

    print("\n=== FULL TWILIO PAYLOAD ===")

    for key, value in form.items():
        print(f"{key}: {value}")

    return Response(
        content="""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Received!</Message>
</Response>""",
        media_type="application/xml"
    )
