# TASK-B1.2.03

**Название:** Отправлять код на email через SMTP (MailSender)  
**Эпик:** [Epic B1: Аутентификация и авторизация](../epics/epic-b01-auth.md)  
**User Story:** [B-US-1.2: Авторизация по email (код подтверждения)](../user-stories/b-us-1.2.md)  
**Статус:** Не начата  
**Исполнитель:** Никита Миков

## Описание

Использовать класс MailSender для отправки письма с кодом верификации.

## Детали реализации

- Вызвать MailSender.send_email(email, subject, code)
- SMTP-параметры из Settings: server, port, address, password
- Тема письма: "Code verification"
- Тело: текстовый код

## Критерии приёмки

1. Email с кодом доставлен
2. SMTP-соединение корректно установлено
3. При ошибке SMTP — логирование и 500
