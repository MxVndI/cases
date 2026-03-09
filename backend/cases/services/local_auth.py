from settings import Settings


class LocalAuth:
    def __init__(self, settings: Settings):
        self.settings = settings

    def verify_token(self, token):
        return token in self.settings.allowed_tokens
