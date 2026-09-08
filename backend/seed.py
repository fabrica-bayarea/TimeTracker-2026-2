"""
Popula o banco com categorias e regras de categorização padrão.
Uso: python seed.py
"""
from sqlalchemy.orm import Session

from app.database import SessionLocal, Base, engine
from app import models

DEFAULT_CATEGORIES = [
    {"name": "Desenvolvimento", "color": "#3B82F6"},
    {"name": "Design", "color": "#A855F7"},
    {"name": "Comunicação", "color": "#22C55E"},
    {"name": "Social", "color": "#F59E0B"},
    {"name": "Outros", "color": "#6B7280"},
]

DEFAULT_RULES = [
    # (nome_categoria, keyword, match_field)
    ("Desenvolvimento", "code.exe", "process"),
    ("Desenvolvimento", "visual studio", "both"),
    ("Desenvolvimento", "pycharm", "both"),
    ("Desenvolvimento", "terminal", "both"),
    ("Design", "figma", "both"),
    ("Design", "photoshop", "both"),
    ("Comunicação", "outlook", "process"),
    ("Comunicação", "teams", "both"),
    ("Comunicação", "slack", "both"),
    ("Social", "instagram", "title"),
    ("Social", "facebook", "title"),
    ("Social", "youtube", "title"),
]


def seed_cats(db: Session) -> dict:
    name_to_id = {}

    for cat in DEFAULT_CATEGORIES:
        existing = (
            db.query(models.Category)
              .filter(models.Category.name == cat["name"])
              .first()
        )

        if not existing:
            existing = models.Category(**cat)

            db.add(existing)
            db.commit()
            db.refresh(existing)

        name_to_id[cat["name"]] = existing.id

    return name_to_id


def seed_rules(db: Session, name_to_id: dict):
    for cat_name, keyword, field in DEFAULT_RULES:
        exists = (
            db.query(models.CategorizationRule)
            .filter(models.CategorizationRule.keyword == keyword)
            .first()
        )

        if not exists:
            db.add(
                models.CategorizationRule(
                    category_id=name_to_id[cat_name],
                    keyword=keyword,
                    match_field=field,
                )
            )
    db.commit()

def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        name_to_id = seed_cats(db)

        seed_rules(db, name_to_id)

        settings = (
            db.query(models.SystemSettings)
              .filter(models.SystemSettings.id == 1)
              .first()
        )

        if not settings:
            db.add(models.SystemSettings(
                id=1,
                capture_interval_seconds=10,
                idle_timeout_seconds=300)
            )
            db.commit()

        print("Seed concluído com sucesso.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
