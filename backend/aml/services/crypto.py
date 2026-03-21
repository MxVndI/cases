import base64
import os
from dataclasses import dataclass

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from settings import Settings


class CryptoConfigError(RuntimeError):
    pass


def _b64d(s: str) -> bytes:
    try:
        return base64.b64decode(s.encode("utf-8"), validate=True)
    except Exception as e:
        raise CryptoConfigError("Invalid base64 encoding") from e


def _b64e(b: bytes) -> str:
    return base64.b64encode(b).decode("utf-8")


def _require_kek(settings: Settings) -> bytes:
    if not settings.aml_kek_b64:
        raise CryptoConfigError("AML_KEK_B64 is required")
    kek = _b64d(settings.aml_kek_b64)
    if len(kek) != 32:
        raise CryptoConfigError("AML_KEK_B64 must decode to 32 bytes")
    return kek


@dataclass(frozen=True)
class EnvelopeEncrypted:
    encrypted_dek: bytes
    dek_iv: bytes
    dek_tag: bytes

    username_ct: bytes
    username_iv: bytes
    username_tag: bytes

    password_ct: bytes
    password_iv: bytes
    password_tag: bytes


def envelope_encrypt(*, settings: Settings, username: str, password: str) -> EnvelopeEncrypted:
    """
    Envelope encryption:
    - Generate random 32-byte DEK
    - Encrypt username/password with DEK using AES-256-GCM
    - Encrypt DEK with KEK using AES-256-GCM
    """
    kek = _require_kek(settings)
    dek = os.urandom(32)

    def enc(key: bytes, plaintext: bytes) -> tuple[bytes, bytes, bytes]:
        iv = os.urandom(12)
        aes = AESGCM(key)
        out = aes.encrypt(iv, plaintext, None)
        # cryptography returns ciphertext||tag (tag 16 bytes for GCM)
        return out[:-16], iv, out[-16:]

    username_ct, username_iv, username_tag = enc(dek, username.encode("utf-8"))
    password_ct, password_iv, password_tag = enc(dek, password.encode("utf-8"))
    dek_ct, dek_iv, dek_tag = enc(kek, dek)

    return EnvelopeEncrypted(
        encrypted_dek=dek_ct,
        dek_iv=dek_iv,
        dek_tag=dek_tag,
        username_ct=username_ct,
        username_iv=username_iv,
        username_tag=username_tag,
        password_ct=password_ct,
        password_iv=password_iv,
        password_tag=password_tag,
    )


def envelope_decrypt(
    *,
    settings: Settings,
    encrypted_dek: bytes,
    dek_iv: bytes,
    dek_tag: bytes,
    username_ct: bytes,
    username_iv: bytes,
    username_tag: bytes,
    password_ct: bytes,
    password_iv: bytes,
    password_tag: bytes,
) -> tuple[str, str]:
    kek = _require_kek(settings)
    aes_kek = AESGCM(kek)
    dek = aes_kek.decrypt(dek_iv, encrypted_dek + dek_tag, None)
    if len(dek) != 32:
        raise CryptoConfigError("Decrypted DEK invalid length")

    aes_dek = AESGCM(dek)
    username = aes_dek.decrypt(username_iv, username_ct + username_tag, None).decode("utf-8")
    password = aes_dek.decrypt(password_iv, password_ct + password_tag, None).decode("utf-8")
    return username, password


def to_b64_fields(env: EnvelopeEncrypted) -> dict[str, str]:
    return {
        "encrypted_dek_b64": _b64e(env.encrypted_dek),
        "dek_iv_b64": _b64e(env.dek_iv),
        "dek_tag_b64": _b64e(env.dek_tag),
        "username_ct_b64": _b64e(env.username_ct),
        "username_iv_b64": _b64e(env.username_iv),
        "username_tag_b64": _b64e(env.username_tag),
        "password_ct_b64": _b64e(env.password_ct),
        "password_iv_b64": _b64e(env.password_iv),
        "password_tag_b64": _b64e(env.password_tag),
    }


def from_b64_fields(fields: dict[str, str]) -> dict[str, bytes]:
    return {
        "encrypted_dek": _b64d(fields["encrypted_dek_b64"]),
        "dek_iv": _b64d(fields["dek_iv_b64"]),
        "dek_tag": _b64d(fields["dek_tag_b64"]),
        "username_ct": _b64d(fields["username_ct_b64"]),
        "username_iv": _b64d(fields["username_iv_b64"]),
        "username_tag": _b64d(fields["username_tag_b64"]),
        "password_ct": _b64d(fields["password_ct_b64"]),
        "password_iv": _b64d(fields["password_iv_b64"]),
        "password_tag": _b64d(fields["password_tag_b64"]),
    }
