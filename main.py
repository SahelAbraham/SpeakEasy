from fastapi import FastAPI, Request
from fastapi.responses import Response
from onboarding_survey import needs_onboarding, is_in_survey, start_survey, handle_message

app = FastAPI()

@app.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    form = await request.form()
    user_id = form.get("From")
    body = form.get("Body", "")

    if needs_onboarding(user_id):
        reply_text = start_survey(user_id)
    elif is_in_survey(user_id):
        reply_text, final_answers = handle_message(user_id, body)
        if final_answers:
            pass  # hand final_answers to Sahel's profile builder here
    else:
        reply_text = "Received!"

    return Response(
        content=f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_text}</Message>
</Response>""",
        media_type="application/xml"
    )