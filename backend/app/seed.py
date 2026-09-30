"""
First-run seed data.

Runs once, only when the church_info table is empty, so re-starting the
server never overwrites content an admin has since edited through the
dashboard.

The church name, founder, location and service times below are real,
as given. The mission statement, ministries, and the one example event
are clearly-marked drafts/examples — edit or delete them from the admin
dashboard (Section 05 of the blueprint, Phase 3) once the site is live.
"""
import os

from sqlalchemy.orm import Session

from .models import ChurchInfo, ServiceTime, Ministry, Event, AdminUser, Branch, Cluster, LivestreamSettings
from .auth import hash_password
from .slugify import slugify

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = "ChangeMe123!"  # change this immediately after first login


def seed_if_empty(db: Session) -> None:
    if db.query(ChurchInfo).first() is None:
        info = ChurchInfo(
            name="Weapons of Power Ministry International",
            founder_name="Apostle Jackson Tyford Banda",
            founder_title="Founder & Senior Pastor",
            founder_bio=(
                "Apostle Jackson Tyford Banda is the founder and senior pastor of "
                "Weapons of Power Ministry International. (Draft bio — replace with "
                "the founder's real story and a photo via the admin dashboard.)"
            ),
            location="Garden House Double Complex",
            mission=(
                "We exist to raise a Spirit-filled people equipped as weapons of power "
                "for prayer, worship, and outreach — building a home where every "
                "generation grows in faith. (Draft mission statement — edit freely "
                "via the admin dashboard.)"
            ),
            give_details=(
                "Add your mobile money and/or bank account details here via the "
                "admin dashboard so members can give directly."
            ),
            phone="",
            whatsapp="",
            email="",
            facebook="",
        )
        db.add(info)

        service_times = [
            ServiceTime(day="Sunday", label="Morning Service", start_time="09:00", end_time="11:30", sort_order=1),
            ServiceTime(day="Sunday", label="Evening Service", start_time="15:30", end_time="18:00", sort_order=2),
            ServiceTime(day="Tuesday", label="Intercessory Prayer", start_time="16:00", end_time="18:00", sort_order=3),
            ServiceTime(day="Wednesday", label="Bible Study", start_time="16:00", end_time="18:00", sort_order=4),
        ]
        db.add_all(service_times)

        example_ministries = [
            Ministry(name="Prayer & Intercession Ministry", description="(Example — edit or remove via the admin dashboard.)", leader="", meeting_time=""),
            Ministry(name="Choir & Worship Team", description="(Example — edit or remove via the admin dashboard.)", leader="", meeting_time=""),
            Ministry(name="Women's Fellowship", description="(Example — edit or remove via the admin dashboard.)", leader="", meeting_time=""),
            Ministry(name="Men's Fellowship", description="(Example — edit or remove via the admin dashboard.)", leader="", meeting_time=""),
            Ministry(name="Children's Ministry", description="(Example — edit or remove via the admin dashboard.)", leader="", meeting_time=""),
            Ministry(name="Evangelism & Outreach", description="(Example — edit or remove via the admin dashboard.)", leader="", meeting_time=""),
        ]
        db.add_all(example_ministries)

        example_event = Event(
            title="Example Event — replace or delete me",
            description="Add real upcoming events (revivals, conferences, crusades) from the admin dashboard.",
            event_date="2026-12-31",
            event_time="18:00",
            location="Garden House Double Complex",
        )
        db.add(example_event)

        db.commit()

    if db.query(AdminUser).first() is None:
        admin = AdminUser(
            username=DEFAULT_ADMIN_USERNAME,
            hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
        )
        db.add(admin)
        db.commit()

    # Seed the headquarters branch from ChurchInfo/founder details, once,
    # whenever the branches table is empty — independent of the ChurchInfo
    # check above, since on an already-deployed database church_info will
    # already exist by the time this new table first appears.
    if db.query(Branch).first() is None:
        info = db.query(ChurchInfo).first()
        if info is not None:
            hq = Branch(
                name=info.name,
                slug=slugify(info.name),
                country="Zambia",
                province=None,  # not confirmed yet — flagged in the admin until filled in
                address=info.location,
                is_headquarters=True,
                branch_photo=info.church_photo,
                pastor_name=info.founder_name,
                pastor_title=info.founder_title,
                pastor_photo=info.founder_photo,
                pastor_email=info.email,
                active=True,
            )
            db.add(hq)
            db.commit()

    if db.query(LivestreamSettings).first() is None:
        db.add(LivestreamSettings())
        db.commit()

    # Development-only example branches/clusters, clearly labelled, only
    # created when explicitly opted into.
    if os.environ.get("SEED_EXAMPLES") == "true" and db.query(Cluster).first() is None:
        copperbelt = Cluster(
            name="Copperbelt Cluster (Example)",
            province="Copperbelt",
            overseer_name="Example Overseer",
            description="Example cluster — edit or remove via the admin dashboard.",
        )
        db.add(copperbelt)
        db.commit()
        db.refresh(copperbelt)

        example_branches = [
            Branch(
                name="Weapons of Power, Kitwe (Example)",
                slug=slugify("Weapons of Power, Kitwe (Example)"),
                country="Zambia",
                province="Copperbelt",
                town="Kitwe",
                cluster_id=copperbelt.id,
                pastor_name="Example Pastor",
                pastor_title="Pastor",
                latitude=-12.8024,
                longitude=28.2132,
                active=True,
            ),
            Branch(
                name="Weapons of Power, Ndola (Example)",
                slug=slugify("Weapons of Power, Ndola (Example)"),
                country="Zambia",
                province="Copperbelt",
                town="Ndola",
                cluster_id=copperbelt.id,
                pastor_name="Example Pastor",
                pastor_title="Pastor",
                latitude=-12.9587,
                longitude=28.6366,
                active=True,
            ),
        ]
        db.add_all(example_branches)
        db.commit()
