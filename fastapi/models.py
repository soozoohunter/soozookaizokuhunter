from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

class AssetType(str, enum.Enum):
    YOUTUBE_CHANNEL = "YOUTUBE_CHANNEL"
    INSTAGRAM_PROFILE = "INSTAGRAM_PROFILE"
    TIKTOK_PROFILE = "TIKTOK_PROFILE"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    LOGO = "LOGO"
    TRADEMARKED_PHRASE = "TRADEMARKED_PHRASE"

class ThreatLevel(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class CaseStatus(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    ACTION_DMCA = "ACTION_DMCA"
    ACTION_LICENSE = "ACTION_LICENSE"
    ACTION_LAWSUIT = "ACTION_LAWSUIT"
    IGNORED = "IGNORED"
    RESOLVED = "RESOLVED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    api_key = Column(String, unique=True, nullable=True)

class DigitalAsset(Base):
    __tablename__ = "digital_assets"
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    asset_type = Column(Enum(AssetType), nullable=False)
    asset_url_or_text = Column(String, nullable=False)
    visual_fingerprints = Column(JSON, nullable=True)

    owner = relationship("User", backref="assets")

class InfringementCase(Base):
    __tablename__ = "infringement_cases"
    id = Column(Integer, primary_key=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    source_asset_id = Column(Integer, ForeignKey("digital_assets.id"))
    infringing_url = Column(String, nullable=False)
    status = Column(Enum(CaseStatus), default=CaseStatus.PENDING_REVIEW)
    threat_level = Column(Enum(ThreatLevel), default=ThreatLevel.INFO)
    platform = Column(String, nullable=True)
    discovered_at = Column(DateTime)

    owner = relationship("User")
    source_asset = relationship("DigitalAsset")

class EvidencePackage(Base):
    __tablename__ = "evidence_packages"
    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("infringement_cases.id"))
    screenshot_path = Column(String, nullable=True)
    source_code_path = Column(String, nullable=True)
    archive_org_url = Column(String, nullable=True)
    whois_data = Column(JSON, nullable=True)
    metadata = Column(JSON, nullable=True)
    generated_pdf_path = Column(String, nullable=True)

    case = relationship("InfringementCase", backref="evidence")
