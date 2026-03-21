import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


class MailSender:
    def __init__(
        self,
        server: str,
        port: int,
        use_ssl: bool,
        starttls: bool,
        timeout_s: int,
        address: str,
        password: str,
    ):
        self.server = server
        self.port = port
        self.use_ssl = use_ssl
        self.starttls = starttls
        self.timeout_s = timeout_s
        self.address = address
        self.password = password

    def send_email(self, recipient: str, subject: str, body: str) -> None:
        if not self.server:
            raise RuntimeError("SMTP is not configured (SMTP_SERVER)")

        sender = self.address or "noreply@casehub.local"

        message = MIMEMultipart()
        message["From"] = sender
        message["To"] = recipient
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))

        context = ssl.create_default_context()

        if self.use_ssl:
            with smtplib.SMTP_SSL(
                self.server, self.port, timeout=self.timeout_s, context=context
            ) as server:
                server.login(self.address, self.password)
                server.sendmail(sender, recipient, message.as_string())
            return

        with smtplib.SMTP(self.server, self.port, timeout=self.timeout_s) as server:
            server.ehlo()
            if self.starttls:
                server.starttls(context=context)
                server.ehlo()
            server.login(self.address, self.password)
            server.sendmail(sender, recipient, message.as_string())
