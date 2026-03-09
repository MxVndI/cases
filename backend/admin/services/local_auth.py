from settings import Settings


class LocalAuth:
    def __init__(self, settings: Settings):
        self.settings = settings

    def verify_user(self, login, password):
        if (
            self.settings.login == login
            and self.settings.secret + self.settings.password == password
        ):
            return self.settings.secret
        raise
