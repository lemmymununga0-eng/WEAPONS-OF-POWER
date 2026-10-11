"""
First-run seed data.

Runs on every start-up but only fills in what is missing, so restarting the
server never overwrites content an admin has since edited.

Only real facts are seeded: the church name, founder, location and service
times. There is no sample content. Ministries, events, sermons, branches,
leaders' biographies and the mission/vision/history text start empty and are
entered through the admin dashboard.

The first admin account is created with ADMIN_USERNAME / ADMIN_PASSWORD from
the environment when they are set. If they are not, it falls back to a known
default password and the account is flagged so the admin has to choose a new
password before they can do anything else.
"""
import os

from sqlalchemy.orm import Session

from .auth import hash_password, verify_password
from .models import (
    AdminUser,
    Branch,
    ChurchInfo,
    Event,
    Leader,
    LivestreamSettings,
    Ministry,
    ServiceTime,
)
from .slugify import slugify

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"

# Text that earlier versions seeded as stand-ins. Anything still equal to
# these (or starting with the marker) is demo content and gets cleared.
_DEMO_MARKER = "(Example"
_DEMO_BIO = (
    "Apostle Jackson Tyford Banda is the founder and senior pastor of "
    "Weapons of Power Ministry International. (Draft bio — replace with "
    "the founder's real story and a photo via the admin dashboard.)"
)
_DEMO_MISSION = (
    "We exist to raise a Spirit-filled people equipped as weapons of power "
    "for prayer, worship, and outreach — building a home where every "
    "generation grows in faith. (Draft mission statement — edit freely "
    "via the admin dashboard.)"
)
_DEMO_GIVE = (
    "Add your mobile money and/or bank account details here via the "
    "admin dashboard so members can give directly."
)


def remove_demo_content(db: Session) -> None:
    """Delete or blank out sample content left behind by older seeds."""
    for ministry in db.query(Ministry).filter(Ministry.description.like(f"{_DEMO_MARKER}%")).all():
        edited = any([ministry.leader, ministry.meeting_time, ministry.image_path, ministry.contact_info])
        if edited:
            ministry.description = ""  # someone filled it in; keep the ministry, drop the sample text
        else:
            db.delete(ministry)

    for event in db.query(Event).filter(Event.title.like("Example Event%")).all():
        db.delete(event)

    info = db.query(ChurchInfo).first()
    if info is not None:
        if info.founder_bio == _DEMO_BIO:
            info.founder_bio = ""
        if info.mission == _DEMO_MISSION:
            info.mission = ""
        if info.give_details == _DEMO_GIVE:
            info.give_details = ""
    for leader in db.query(Leader).filter(Leader.biography == _DEMO_BIO).all():
        leader.biography = ""
    db.commit()


def seed_if_empty(db: Session) -> None:
    if db.query(ChurchInfo).first() is None:
        db.add(
            ChurchInfo(
                name="Weapons of Power Ministry International",
                founder_name="Apostle Jackson Tyford Banda",
                founder_title="Founder & Senior Pastor",
                location="Garden House Double Complex",
            )
        )
        db.add_all(
            [
                ServiceTime(day="Sunday", label="Morning Service", start_time="09:00", end_time="11:30", sort_order=1),
                ServiceTime(day="Sunday", label="Evening Service", start_time="15:30", end_time="18:00", sort_order=2),
                ServiceTime(day="Tuesday", label="Intercessory Prayer", start_time="16:00", end_time="18:00", sort_order=3),
                ServiceTime(day="Wednesday", label="Bible Study", start_time="16:00", end_time="18:00", sort_order=4),
            ]
        )
        db.commit()

    if db.query(AdminUser).first() is None:
        username = os.environ.get("ADMIN_USERNAME") or DEFAULT_ADMIN_USERNAME
        password = os.environ.get("ADMIN_PASSWORD")
        using_default = not password
        db.add(
            AdminUser(
                username=username,
                hashed_password=hash_password(password or DEFAULT_ADMIN_PASSWORD),
                role="super_admin",
                is_active=True,
                must_change_password=using_default,
            )
        )
        db.commit()

    # Any account still on the well-known default password must change it.
    for admin in db.query(AdminUser).filter(AdminUser.must_change_password.isnot(True)).all():
        if verify_password(DEFAULT_ADMIN_PASSWORD, admin.hashed_password):
            admin.must_change_password = True
    db.commit()

    # Headquarters branch, built from the church details, once.
    if db.query(Branch).first() is None:
        info = db.query(ChurchInfo).first()
        if info is not None:
            db.add(
                Branch(
                    name=info.name,
                    slug=slugify(info.name),
                    country="Zambia",
                    province=None,  # not confirmed yet; flagged in the admin until filled in
                    address=info.location,
                    is_headquarters=True,
                    branch_photo=info.church_photo,
                    pastor_name=info.founder_name,
                    pastor_title=info.founder_title,
                    pastor_photo=info.founder_photo,
                    pastor_email=info.email,
                    active=True,
                )
            )
            db.commit()

    # The founder's card on the About page.
    if db.query(Leader).first() is None:
        info = db.query(ChurchInfo).first()
        if info is not None:
            db.add(
                Leader(
                    name=info.founder_name,
                    position=info.founder_title,
                    photo_path=info.founder_photo,
                    biography=info.founder_bio,
                    sort_order=0,
                    is_founder=True,
                )
            )
            db.commit()

    if db.query(LivestreamSettings).first() is None:
        db.add(LivestreamSettings())
        db.commit()

    remove_demo_content(db)
