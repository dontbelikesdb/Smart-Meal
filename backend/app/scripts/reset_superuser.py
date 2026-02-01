import argparse

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import Base, SessionLocal, engine
from app.models.user import User


def reset_superuser(db: Session, email: str, password: str) -> None:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name="Admin",
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.commit()
        print(f"Created superuser: {email}")
        return

    user.hashed_password = get_password_hash(password)
    user.is_superuser = True
    user.is_active = True
    db.commit()
    print(f"Updated superuser password + promoted: {email}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", default=getattr(settings, "FIRST_SUPERUSER_EMAIL", "admin@example.com"))
    parser.add_argument("--password", default=getattr(settings, "FIRST_SUPERUSER_PASSWORD", ""))
    args = parser.parse_args()

    email = (args.email or "").strip()
    password = args.password or ""
    if not email or not password:
        raise ValueError("email and password are required")

    # Ensure tables exist.
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        reset_superuser(db, email=email, password=password)
    finally:
        db.close()


if __name__ == "__main__":
    main()
