"""
Planning Ingestion Agent Configuration

Target URLs and crawl frequencies for Milwaukee planning documents.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


class SyncFrequency(Enum):
    """How often a source should be synced."""
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ContentType(Enum):
    """Type of content to crawl."""
    HTML = "html"
    PDF = "pdf"


@dataclass
class PlanningSource:
    """Configuration for a planning document source."""
    id: str
    url: str
    title: str
    content_type: ContentType
    sync_frequency: SyncFrequency
    category: str
    description: Optional[str] = None


# =============================================================================
# Milwaukee Planning Document Sources
# =============================================================================

PLANNING_SOURCES: list[PlanningSource] = [
    # -------------------------------------------------------------------------
    # HTML Pages - Weekly Sync (content changes frequently)
    # -------------------------------------------------------------------------
    PlanningSource(
        id="home-building-sites",
        url="https://city.milwaukee.gov/DCD/CityRealEstate/HomeBuildingSites",
        title="Home Building Sites",
        content_type=ContentType.HTML,
        sync_frequency=SyncFrequency.WEEKLY,
        category="home-building",
        description="City-owned lots available for home construction",
    ),
    PlanningSource(
        id="vacant-side-lots",
        url="https://city.milwaukee.gov/DCD/CityRealEstate/VacantLotHandbook/VacantLots",
        title="Vacant Side Lots",
        content_type=ContentType.HTML,
        sync_frequency=SyncFrequency.WEEKLY,
        category="vacant-lots",
        description="Vacant side lots available for purchase by adjacent owners",
    ),
    PlanningSource(
        id="commercial-properties-main",
        url="https://city.milwaukee.gov/DCD/CityRealEstate/CRE",
        title="Commercial Real Estate - Main",
        content_type=ContentType.HTML,
        sync_frequency=SyncFrequency.WEEKLY,
        category="commercial",
        description="City-owned commercial properties for sale or lease",
    ),
    PlanningSource(
        id="overlay-zone-sp",
        url="https://city.milwaukee.gov/OverlayZones/SP",
        title="Overlay Zone - Strategic Planning",
        content_type=ContentType.HTML,
        sync_frequency=SyncFrequency.WEEKLY,
        category="overlay-zones",
        description="Strategic Planning overlay zone information",
    ),
    PlanningSource(
        id="overlay-zone-diz",
        url="https://city.milwaukee.gov/OverlayZones/DIZ",
        title="Overlay Zone - Design Innovation Zone",
        content_type=ContentType.HTML,
        sync_frequency=SyncFrequency.WEEKLY,
        category="overlay-zones",
        description="Design Innovation Zone overlay information",
    ),
    PlanningSource(
        id="overlay-zone-msp",
        url="https://city.milwaukee.gov/OverlayZones/MSP",
        title="Overlay Zone - Master Site Plan",
        content_type=ContentType.HTML,
        sync_frequency=SyncFrequency.WEEKLY,
        category="overlay-zones",
        description="Master Site Plan overlay information",
    ),
    PlanningSource(
        id="design-guidelines",
        url="https://city.milwaukee.gov/DCD/Planning/UrbanDesign/DesignGuidelines",
        title="Urban Design Guidelines",
        content_type=ContentType.HTML,
        sync_frequency=SyncFrequency.WEEKLY,
        category="design-guidelines",
        description="City design guidelines for development projects",
    ),

    # -------------------------------------------------------------------------
    # PDF Documents - Monthly Sync (static content)
    # NOTE: These PDF URLs are currently returning 404 - city may have moved files
    # TODO: Find updated PDF URLs from Milwaukee city website
    # -------------------------------------------------------------------------
    # PlanningSource(
    #     id="house-design-standards",
    #     url="https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/planning/pdfs/Neighborhood-House-Design-Stds-Rev-July-3-2024.pdf",
    #     title="Neighborhood House Design Standards",
    #     content_type=ContentType.PDF,
    #     sync_frequency=SyncFrequency.MONTHLY,
    #     category="home-building",
    #     description="Design standards for new home construction in Milwaukee neighborhoods",
    # ),
    # PlanningSource(
    #     id="green-milwaukee-house",
    #     url="https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/Develop/PDF/GreenYourMilwHouse.pdf",
    #     title="Green Your Milwaukee House",
    #     content_type=ContentType.PDF,
    #     sync_frequency=SyncFrequency.MONTHLY,
    #     category="home-building",
    #     description="Guide to sustainable home improvements and green building practices",
    # ),
    # PlanningSource(
    #     id="vacant-lot-offer",
    #     url="https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/realestate/PDF/Buildable-Vacant-Lot-Offer---KB-Title.pdf",
    #     title="Buildable Vacant Lot Offer Form",
    #     content_type=ContentType.PDF,
    #     sync_frequency=SyncFrequency.MONTHLY,
    #     category="vacant-lots",
    #     description="Application form for purchasing buildable vacant lots",
    # ),
    # PlanningSource(
    #     id="vacant-lot-handbook",
    #     url="https://city.milwaukee.gov/ImageLibrary/Groups/cityDCD/realestate/PDF/VacantLotHandbook.pdf",
    #     title="Vacant Lot Handbook",
    #     content_type=ContentType.PDF,
    #     sync_frequency=SyncFrequency.MONTHLY,
    #     category="vacant-lots",
    #     description="Comprehensive guide to vacant lot programs and requirements",
    # ),
]


def get_sources_by_frequency(frequency: SyncFrequency) -> list[PlanningSource]:
    """Get all sources matching a sync frequency."""
    return [s for s in PLANNING_SOURCES if s.sync_frequency == frequency]


def get_sources_by_content_type(content_type: ContentType) -> list[PlanningSource]:
    """Get all sources matching a content type."""
    return [s for s in PLANNING_SOURCES if s.content_type == content_type]


def get_source_by_id(source_id: str) -> Optional[PlanningSource]:
    """Get a specific source by ID."""
    for source in PLANNING_SOURCES:
        if source.id == source_id:
            return source
    return None


# =============================================================================
# Environment Configuration
# =============================================================================

@dataclass
class EnvConfig:
    """Environment variables for the agent."""
    gemini_api_key: str
    convex_url: str
    convex_deploy_key: str
    firecrawl_api_key: Optional[str] = None  # Optional - only needed if using Firecrawl
    opik_api_key: Optional[str] = None
    opik_workspace: Optional[str] = None
    opik_project_name: str = "mkedev-planning-ingestion"


def load_env_config() -> EnvConfig:
    """Load and validate environment configuration."""
    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_GEMINI_API_KEY")
    if not gemini_key:
        raise ValueError("GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY is required")

    convex_url = os.getenv("CONVEX_URL") or os.getenv("NEXT_PUBLIC_CONVEX_URL")
    if not convex_url:
        raise ValueError("CONVEX_URL or NEXT_PUBLIC_CONVEX_URL is required")

    convex_key = os.getenv("CONVEX_DEPLOY_KEY")
    if not convex_key:
        raise ValueError("CONVEX_DEPLOY_KEY is required")

    return EnvConfig(
        gemini_api_key=gemini_key,
        convex_url=convex_url,
        convex_deploy_key=convex_key,
        firecrawl_api_key=os.getenv("FIRECRAWL_API_KEY"),  # Optional
        opik_api_key=os.getenv("OPIK_API_KEY"),
        opik_workspace=os.getenv("OPIK_WORKSPACE"),
        opik_project_name=os.getenv("OPIK_PROJECT_NAME", "mkedev-planning-ingestion"),
    )


# =============================================================================
# File Search Store Configuration
# =============================================================================

FILE_SEARCH_STORE_NAME = "planning-documents"
FILE_SEARCH_STORE_DISPLAY_NAME = "Milwaukee Planning Documents"
