from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Float, Text, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class WorkflowStatus(str, enum.Enum):
    INTENT_DEFINED = "intent_defined"
    AI_LAYOUT_SUGGESTED = "ai_layout_suggested"
    DESIGNER_APPROVED = "designer_approved"
    CONCEPT_LOCKED = "concept_locked"
    BUYER_EDITING = "buyer_editing"
    FINALIZED = "finalized"
    VM_READY = "vm_ready"


class DesignIntent(Base):
    __tablename__ = "design_intents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    theme = Column(String, nullable=False)
    season = Column(String, nullable=False)
    color_flow = Column(JSON, nullable=False)          # ["white", "sand", "sky blue", "navy"]
    key_piece_priority = Column(JSON, nullable=True)    # [{"sku": "...", "name": "...", "priority": 1}]
    styling_rules = Column(JSON, nullable=True)         # ["breathable fabrics first", ...]
    category_mix = Column(JSON, nullable=True)          # {"shirts": 40, "trousers": 30, "tees": 30}
    target_store_type = Column(String, default="medium") # small / medium / flagship
    visual_mood = Column(String, default="minimal")      # minimal / premium / vibrant / relaxed
    ai_context_summary = Column(Text, nullable=True)
    status = Column(String, default=WorkflowStatus.INTENT_DEFINED)
    lock_hero_looks = Column(Integer, default=0)
    allow_flexible_editing = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class VMLayout(Base):
    __tablename__ = "vm_layouts"

    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("design_intents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    layout_type = Column(String, nullable=False)        # wall_story / fixture / mannequin / focal_display
    name = Column(String, nullable=False)
    placement_plan = Column(JSON, nullable=True)        # structured placement data
    product_grouping = Column(JSON, nullable=True)      # grouped products
    reasoning = Column(Text, nullable=True)             # AI reasoning
    mockup_image_url = Column(String, nullable=True)
    mockup_prompt = Column(Text, nullable=True)
    zone_data = Column(JSON, nullable=True)  # {"wall_a": [{product_id, position, ...}], "wall_b": [...], "table": [...]}
    is_approved = Column(Integer, default=0)            # 0=pending, 1=approved
    version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ConceptLock(Base):
    __tablename__ = "concept_locks"

    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("design_intents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    color_continuity_rules = Column(JSON, nullable=True)
    focal_hierarchy_rules = Column(JSON, nullable=True)
    category_balance_rules = Column(JSON, nullable=True)
    placement_rules = Column(JSON, nullable=True)
    flexibility_level = Column(String, default="moderate")  # strict / moderate / flexible
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BuyerEdit(Base):
    __tablename__ = "buyer_edits"

    id = Column(Integer, primary_key=True, index=True)
    layout_id = Column(Integer, ForeignKey("vm_layouts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    edit_type = Column(String, nullable=False)          # swap_product / adjust_assortment / move_placement
    edit_data = Column(JSON, nullable=False)
    validation_result = Column(String, nullable=True)   # valid / warning / violation
    validation_message = Column(Text, nullable=True)
    applied = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class VMGuideline(Base):
    __tablename__ = "vm_guidelines"

    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("design_intents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vm_instruction_sheet = Column(Text, nullable=True)
    shoot_team_shot_list = Column(Text, nullable=True)
    styling_notes = Column(Text, nullable=True)
    placement_guide = Column(Text, nullable=True)
    concept_explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Fixture(Base):
    __tablename__ = "vm_fixtures"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    fixture_type = Column(String, nullable=False)       # wall_unit / table / mannequin_platform / gondola / nesting_table / window / custom
    image_url = Column(String, nullable=True)
    num_positions = Column(Integer, default=1)           # how many garment slots
    position_labels = Column(JSON, nullable=True)        # ["top_shelf", "eye_level", "bottom"]
    hidden_prompt = Column(Text, nullable=True)          # fixture-specific prompt instructions
    dimensions = Column(String, nullable=True)           # e.g., "120cm W × 200cm H"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProductRange(Base):
    __tablename__ = "product_ranges"

    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("design_intents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sku = Column(String, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=True)
    color = Column(String, nullable=True)
    fabric = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    attributes = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LayoutVersion(Base):
    __tablename__ = "layout_versions"
    id = Column(Integer, primary_key=True, index=True)
    layout_id = Column(Integer, ForeignKey("vm_layouts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    version_number = Column(Integer, nullable=False)
    label = Column(String, default="original")  # original / buyer_edited / final
    zone_data = Column(JSON, nullable=True)  # snapshot of zone placements
    placement_plan = Column(JSON, nullable=True)
    product_grouping = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ShootPlan(Base):
    __tablename__ = "shoot_plans"
    id = Column(Integer, primary_key=True, index=True)
    intent_id = Column(Integer, ForeignKey("design_intents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    outfit_combinations = Column(JSON, nullable=True)  # [{look_number, products, styling_notes}]
    styling_instructions = Column(Text, nullable=True)
    checklist = Column(JSON, nullable=True)  # [{item, completed}]
    shot_sequence = Column(JSON, nullable=True)  # [{shot_number, zone, angle, notes}]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
