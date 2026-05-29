import os
import requests
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings


def send_activation_email(user):
    uid   = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    frontend_url    = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    activation_link = f"{frontend_url}/activate/{uid}/{token}/"

    context  = {'user': user, 'activation_link': activation_link}
    html_body = render_to_string('emails/activation_email.html', context)

    api_key = os.environ.get('BREVO_API_KEY', '')
    if not api_key:
        print(f"[EMAIL ERROR] BREVO_API_KEY not set")
        return

    response = requests.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": api_key,
            "Content-Type": "application/json",
        },
        json={
            "sender": {
                "name": "Grand Velour Hotels & Resorts",
                "email": "mariettaqwerty123@gmail.com",
            },
            "to": [{"email": user.email, "name": f"{user.first_name} {user.last_name}"}],
            "subject": "Activate your Grand Velour account",
            "htmlContent": html_body,
            "textContent": (
                f"Hi {user.first_name},\n\n"
                f"Activate your account: {activation_link}\n\n"
                "Link is valid for 24 hours.\n"
                "If you did not register, ignore this email."
            ),
        }
    )

    if response.status_code == 201:
        print(f"[EMAIL SENT] Activation email sent to {user.email}")
    else:
        print(f"[EMAIL ERROR] Brevo API error {response.status_code}: {response.text}")