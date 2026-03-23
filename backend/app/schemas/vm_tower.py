from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Design Intent ---

class DesignIntentCreate(BaseModel):
    theme: str
    season: str
    color_flow: list[str]
    key_piece_priority: Optional[list[dict]] = None
    styling_rules: Optional[list[str]] = None
    category_mix: Optional[dict[str, float]] = None
    target_store_type: str = "medium"
    visual_mood: str = "minimal"


class DesignIntentResponse(BaseModel):
    id: int
    user_id: int
    theme: str
    season: str
    color_flow: list
    key_piece_priority: Optional[list] = None
    styling_rules: Optional[list] = None
    category_mix: Optional[dict] = None
    target_store_type: str
    visual_mood: str
    ai_context_summary: Optional[str] = None
    status: str
    lock_hero_looks: Optional[int] = 0
    allow_flexible_editing: Optional[int] = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DesignIntentUpdate(BaseModel):
    theme: Optional[str] = None
    season: Optional[str] = None
    color_flow: Optional[list[str]] = None
    key_piece_priority: Optional[list[dict]] = None
    styling_rules: Optional[list[str]] = None
    category_mix: Optional[dict[str, float]] = None
    target_store_type: Optional[str] = None
    visual_mood: Optional[str] = None


# --- Product Range ---

class ProductRangeCreate(BaseModel):
    sku: str
    name: str
    category: Optional[str] = None
    color: Optional[str] = None
    fabric: Optional[str] = None
    image_url: Optional[str] = None
    attributes: Optional[dict] = None


class ProductRangeResponse(BaseModel):
    id: int
    intent_id: int
    sku: str
    name: str
    category: Optional[str] = None
    color: Optional[str] = None
    fabric: Optional[str] = None
    image_url: Optional[str] = None
    attributes: Optional[dict] = None

    class Config:
        from_attributes = True


# --- Layout ---

class LayoutGenerateRequest(BaseModel):
    intent_id: int
    fixture_templates: Optional[list[str]] = None


class LayoutResponse(BaseModel):
    id: int
    intent_id: int
    layout_type: str
    name: str
    placement_plan: Optional[dict] = None
    product_grouping: Optional[list] = None
    reasoning: Optional[str] = None
    mockup_image_url: Optional[str] = None
    zone_data: Optional[dict] = None
    mockup_prompt: Optional[str] = None
    is_approved: int
    version: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LayoutApproveRequest(BaseModel):
    layout_ids: list[int]


# --- Concept Lock ---

class ConceptLockCreate(BaseModel):
    intent_id: int
    flexibility_level: str = "moderate"


class ConceptLockResponse(BaseModel):
    id: int
    intent_id: int
    color_continuity_rules: Optional[dict] = None
    focal_hierarchy_rules: Optional[dict] = None
    category_balance_rules: Optional[dict] = None
    placement_rules: Optional[dict] = None
    flexibility_level: str
    is_active: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Buyer Edit / Validation ---

class BuyerEditRequest(BaseModel):
    layout_id: int
    edit_type: str          # swap_product / adjust_assortment / move_placement
    edit_data: dict


class BuyerEditResponse(BaseModel):
    id: int
    layout_id: int
    edit_type: str
    edit_data: dict
    validation_result: Optional[str] = None
    validation_message: Optional[str] = None
    applied: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ValidationResult(BaseModel):
    status: str             # valid / warning / violation
    message: str
    details: Optional[dict] = None


# --- VM Guidelines ---

class VMGuidelineResponse(BaseModel):
    id: int
    intent_id: int
    vm_instruction_sheet: Optional[str] = None
    shoot_team_shot_list: Optional[str] = None
    styling_notes: Optional[str] = None
    placement_guide: Optional[str] = None
    concept_explanation: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Fixture ---

class FixtureCreate(BaseModel):
    name: str
    fixture_type: str
    num_positions: int = 1
    position_labels: Optional[list[str]] = None
    hidden_prompt: Optional[str] = None
    dimensions: Optional[str] = None


class FixtureResponse(BaseModel):
    id: int
    user_id: int
    name: str
    fixture_type: str
    image_url: Optional[str] = None
    num_positions: int
    position_labels: Optional[list] = None
    hidden_prompt: Optional[str] = None
    dimensions: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Mockup Generation ---

class MockupGenerateRequest(BaseModel):
    layout_id: int
    custom_prompt: Optional[str] = None
    fixture_id: Optional[int] = None
    garment_product_ids: Optional[list[int]] = None
    designer_instructions: Optional[str] = None


# --- Prompt Studio ---

class PromptGenerateRequest(BaseModel):
    layout_id: Optional[int] = None
    intent_id: Optional[int] = None
    fixture_id: Optional[int] = None
    designer_instructions: Optional[str] = None
    product_ids: Optional[list[int]] = None


class PromptRefineRequest(BaseModel):
    current_prompt: str
    refinement_instruction: str
    intent_id: Optional[int] = None


# --- Status Update ---

class StatusUpdateRequest(BaseModel):
    status: str


# --- Layout Version ---

class LayoutVersionResponse(BaseModel):
    id: int
    layout_id: int
    version_number: int
    label: str
    zone_data: Optional[dict] = None
    placement_plan: Optional[dict] = None
    product_grouping: Optional[list] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# --- Shoot Plan ---

class ShootPlanResponse(BaseModel):
    id: int
    intent_id: int
    outfit_combinations: Optional[list] = None
    styling_instructions: Optional[str] = None
    checklist: Optional[list] = None
    shot_sequence: Optional[list] = None
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True


# --- Send to Buyer ---

class SendToBuyerRequest(BaseModel):
    intent_id: int
    lock_hero_looks: bool = True
    allow_flexible_editing: bool = True


# --- Zone Update ---

class ZoneUpdateRequest(BaseModel):
    zone_data: dict  # {"wall_a": [...], "wall_b": [...], "table": [...]}


# --- AI Outfit Recommendation ---

class OutfitRecommendationRequest(BaseModel):
    intent_id: int
    product_ids: Optional[list[int]] = None
    style_preference: Optional[str] = None


# --- Export ---

class ExportRequest(BaseModel):
    intent_id: int
    include_shoot_plan: bool = True
    include_guidelines: bool = True
