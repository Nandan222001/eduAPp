from decimal import Decimal
from sqlalchemy.orm import Session
from src.models.volunteer_hours import VolunteerBadge, BadgeTier


def initialize_default_badges(db: Session, institution_id: int):
    existing_badges = db.query(VolunteerBadge).filter(
        VolunteerBadge.institution_id == institution_id
    ).count()
    
    if existing_badges > 0:
        return
    
    default_badges = [
        {
            "name": "Bronze Volunteer",
            "description": "Completed 10 hours of volunteer service",
            "badge_tier": BadgeTier.BRONZE,
            "hours_required": Decimal("10.00"),
            "color_code": "#CD7F32"
        },
        {
            "name": "Silver Volunteer",
            "description": "Completed 25 hours of volunteer service",
            "badge_tier": BadgeTier.SILVER,
            "hours_required": Decimal("25.00"),
            "color_code": "#C0C0C0"
        },
        {
            "name": "Gold Volunteer",
            "description": "Completed 50 hours of volunteer service",
            "badge_tier": BadgeTier.GOLD,
            "hours_required": Decimal("50.00"),
            "color_code": "#FFD700"
        },
        {
            "name": "Platinum Volunteer",
            "description": "Completed 100 hours of volunteer service",
            "badge_tier": BadgeTier.PLATINUM,
            "hours_required": Decimal("100.00"),
            "color_code": "#E5E4E2"
        }
    ]
    
    for badge_data in default_badges:
        badge = VolunteerBadge(
            institution_id=institution_id,
            **badge_data
        )
        db.add(badge)
    
    db.commit()
