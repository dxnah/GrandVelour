from django.core.mail import EmailMultiAlternatives
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

    context = {'user': user, 'activation_link': activation_link}

    subject   = "Activate your Grand Velour account"
    text_body = (
        f"Hi {user.first_name},\n\n"
        f"Activate your account: {activation_link}\n\n"
        "Link is valid for 24 hours.\n"
        "If you did not register, ignore this email."
    )
    html_body = render_to_string('emails/activation_email.html', context)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send(fail_silently=False) 