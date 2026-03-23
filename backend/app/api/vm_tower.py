from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.vm_tower import ProductRange
from app.schemas.vm_tower import (
    DesignIntentCreate, DesignIntentResponse, DesignIntentUpdate,
    ProductRangeCreate, ProductRangeResponse,
    LayoutGenerateRequest, LayoutResponse, LayoutApproveRequest,
    ConceptLockCreate, ConceptLockResponse,
    BuyerEditRequest, BuyerEditResponse, ValidationResult,
    VMGuidelineResponse, MockupGenerateRequest, StatusUpdateRequest,
    FixtureCreate, FixtureResponse,
    PromptGenerateRequest, PromptRefineRequest,
    LayoutVersionResponse, ShootPlanResponse,
    SendToBuyerRequest, ZoneUpdateRequest,
    OutfitRecommendationRequest, ExportRequest,
)
from app.services import (
    design_intent_service,
    layout_generation_service,
    concept_lock_service,
    ai_validation_service,
    nano_banana_service,
    vm_guideline_service,
)

router = APIRouter(tags=["vm-tower"])


# ─── Auto-Detect from Range Image ──────────────────────────────

@router.post("/analyze-range-image")
def analyze_range_image(
    image: UploadFile = File(...),
    theme: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """AI analyzes a range image to auto-detect design intent fields."""
    from app.core.gemini_client import gemini_vision_json
    import json

    image_bytes = image.file.read()
    ext = (image.filename or "img.jpg").rsplit(".", 1)[-1].lower()
    mime_type = "image/jpeg" if ext in ["jpg", "jpeg"] else "image/png"

    theme_context = f'The collection theme is "{theme}". ' if theme.strip() else ""

    prompt = f"""{theme_context}Analyze this fashion range/collection image in detail. Extract the following for a visual merchandising design intent.

Return valid JSON:
{{
  "theme": "Detected or refined theme name (2-4 words, e.g. 'Summer Linen Story')",
  "season": "Detected season (e.g. SS'26, AW'26)",
  "color_flow": ["color1", "color2", "color3", "color4"],
  "styling_rules": ["rule1 based on what you see", "rule2", "rule3"],
  "category_mix": {{"category1": percentage, "category2": percentage}},
  "target_store_type": "small or medium or flagship",
  "visual_mood": "minimal or premium or vibrant or relaxed",
  "key_pieces": [
    {{"name": "garment description", "priority": 1}},
    {{"name": "garment description", "priority": 2}}
  ],
  "detected_categories": ["list of garment types visible"],
  "detected_colors": ["list of dominant colors with hex codes"],
  "detected_fabrics": ["list of fabrics visible"],
  "ai_summary": "2-3 sentence summary of the visual merchandising story this range tells"
}}

Be specific about what you actually see in the image. If you see shirts, trousers, dresses etc., list them. Extract real colors visible in the garments. Percentages in category_mix should reflect the actual proportion of items visible."""

    try:
        raw = gemini_vision_json(
            prompt=prompt,
            image_bytes=image_bytes,
            mime_type=mime_type,
            temperature=0.5,
        )
        result = json.loads(raw)
        if isinstance(result, list):
            result = result[0] if result else {}
        return result
    except Exception as e:
        return {
            "theme": theme or "Fashion Collection",
            "season": "SS'26",
            "color_flow": [],
            "styling_rules": [],
            "category_mix": {},
            "target_store_type": "medium",
            "visual_mood": "premium",
            "key_pieces": [],
            "detected_categories": [],
            "detected_colors": [],
            "detected_fabrics": [],
            "ai_summary": f"Could not analyze image: {str(e)}",
        }


# ─── Design Intent ───────────────────────────────────────────────

@router.post("/intents", response_model=DesignIntentResponse)
def create_intent(
    data: DesignIntentCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    intent = design_intent_service.create_design_intent(db, user.id, data)
    return intent


@router.get("/intents", response_model=list[DesignIntentResponse])
def list_intents(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return design_intent_service.list_design_intents(db, user.id)


@router.get("/intents/{intent_id}", response_model=DesignIntentResponse)
def get_intent(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    intent = design_intent_service.get_design_intent(db, intent_id, user.id)
    if not intent:
        raise HTTPException(status_code=404, detail="Design intent not found")
    return intent


@router.put("/intents/{intent_id}", response_model=DesignIntentResponse)
def update_intent(
    intent_id: int,
    data: DesignIntentUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    intent = design_intent_service.update_design_intent(db, intent_id, user.id, data)
    if not intent:
        raise HTTPException(status_code=404, detail="Design intent not found")
    return intent


@router.patch("/intents/{intent_id}/status", response_model=DesignIntentResponse)
def update_status(
    intent_id: int,
    data: StatusUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    intent = design_intent_service.update_intent_status(db, intent_id, user.id, data.status)
    if not intent:
        raise HTTPException(status_code=404, detail="Design intent not found")
    return intent


# ─── Product Range ───────────────────────────────────────────────

@router.post("/intents/{intent_id}/products", response_model=ProductRangeResponse)
def add_product(
    intent_id: int,
    data: ProductRangeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = ProductRange(
        intent_id=intent_id,
        user_id=user.id,
        sku=data.sku,
        name=data.name,
        category=data.category,
        color=data.color,
        fabric=data.fabric,
        image_url=data.image_url,
        attributes=data.attributes,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/intents/{intent_id}/products/batch", response_model=list[ProductRangeResponse])
def add_products_batch(
    intent_id: int,
    products: list[ProductRangeCreate],
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    created = []
    for data in products:
        product = ProductRange(
            intent_id=intent_id,
            user_id=user.id,
            sku=data.sku,
            name=data.name,
            category=data.category,
            color=data.color,
            fabric=data.fabric,
            image_url=data.image_url,
            attributes=data.attributes,
        )
        db.add(product)
        created.append(product)
    db.commit()
    for p in created:
        db.refresh(p)
    return created


@router.get("/intents/{intent_id}/products", response_model=list[ProductRangeResponse])
def list_products(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(ProductRange).filter(
        ProductRange.intent_id == intent_id,
        ProductRange.user_id == user.id
    ).all()


@router.post("/intents/{intent_id}/products/{product_id}/upload-image", response_model=ProductRangeResponse)
def upload_product_image(
    intent_id: int,
    product_id: int,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload an image for a single product."""
    product = db.query(ProductRange).filter(
        ProductRange.id == product_id,
        ProductRange.intent_id == intent_id,
        ProductRange.user_id == user.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    import uuid
    from pathlib import Path
    from app.core.config import settings

    ext = Path(image.filename or "img.jpg").suffix.lower() or ".jpg"
    filename = f"product_{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR) / "vm_products"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = upload_dir / filename
    with open(filepath, "wb") as f:
        f.write(image.file.read())

    product.image_url = f"/uploads/vm_products/{filename}"
    db.commit()
    db.refresh(product)
    return product


@router.post("/intents/{intent_id}/range-image")
def upload_range_image(
    intent_id: int,
    image: UploadFile = File(...),
    label: str = Form("full_range"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload a full range/combo image showing multiple products together."""
    from app.models.vm_tower import DesignIntent
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user.id,
    ).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Design intent not found")

    import uuid
    from pathlib import Path
    from app.core.config import settings

    ext = Path(image.filename or "img.jpg").suffix.lower() or ".jpg"
    filename = f"range_{uuid.uuid4().hex}{ext}"
    upload_dir = Path(settings.UPLOAD_DIR) / "vm_ranges"
    upload_dir.mkdir(parents=True, exist_ok=True)
    filepath = upload_dir / filename
    with open(filepath, "wb") as f:
        f.write(image.file.read())

    image_url = f"/uploads/vm_ranges/{filename}"

    # Store range images in intent attributes
    range_images = intent.key_piece_priority or []
    # Append range image entry (distinct from key pieces by having "type": "range_image")
    range_images.append({
        "type": "range_image",
        "label": label,
        "image_url": image_url,
    })
    intent.key_piece_priority = range_images
    db.commit()
    db.refresh(intent)

    return {"image_url": image_url, "label": label, "intent_id": intent_id}


@router.get("/intents/{intent_id}/range-images")
def list_range_images(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get all range/combo images for an intent."""
    from app.models.vm_tower import DesignIntent
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id,
        DesignIntent.user_id == user.id,
    ).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Design intent not found")

    items = intent.key_piece_priority or []
    range_images = [item for item in items if isinstance(item, dict) and item.get("type") == "range_image"]
    return range_images


@router.delete("/intents/{intent_id}/products/{product_id}")
def delete_product(
    intent_id: int,
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    product = db.query(ProductRange).filter(
        ProductRange.id == product_id,
        ProductRange.intent_id == intent_id,
        ProductRange.user_id == user.id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"status": "deleted"}


# ─── Layout Generation ───────────────────────────────────────────

@router.post("/layouts/generate", response_model=list[LayoutResponse])
def generate_layouts(
    data: LayoutGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    layouts = layout_generation_service.generate_layouts(
        db, data.intent_id, user.id, data.fixture_templates
    )
    if not layouts:
        raise HTTPException(status_code=404, detail="Intent not found or generation failed")
    return layouts


@router.get("/intents/{intent_id}/layouts", response_model=list[LayoutResponse])
def get_layouts(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return layout_generation_service.get_layouts_for_intent(db, intent_id, user.id)


@router.post("/intents/{intent_id}/layouts/approve", response_model=list[LayoutResponse])
def approve_layouts(
    intent_id: int,
    data: LayoutApproveRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    layouts = layout_generation_service.approve_layouts(db, data.layout_ids, user.id, intent_id)
    return layouts


# ─── Concept Lock ─────────────────────────────────────────────────

@router.post("/concept-lock", response_model=ConceptLockResponse)
def activate_lock(
    data: ConceptLockCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lock = concept_lock_service.activate_concept_lock(
        db, data.intent_id, user.id, data.flexibility_level
    )
    if not lock:
        raise HTTPException(status_code=404, detail="Design intent not found")
    return lock


@router.get("/intents/{intent_id}/concept-lock", response_model=Optional[ConceptLockResponse])
def get_lock(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    lock = concept_lock_service.get_active_lock(db, intent_id)
    if not lock:
        return None
    return lock


@router.delete("/intents/{intent_id}/concept-lock")
def deactivate_lock(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    success = concept_lock_service.deactivate_concept_lock(db, intent_id, user.id)
    if not success:
        raise HTTPException(status_code=404, detail="No active lock found")
    return {"status": "deactivated"}


# ─── Buyer Edits / Validation ─────────────────────────────────────

@router.post("/buyer-edit", response_model=BuyerEditResponse)
def submit_buyer_edit(
    data: BuyerEditRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    edit, validation = ai_validation_service.validate_buyer_edit(
        db, data.layout_id, user.id, data.edit_type, data.edit_data
    )
    if not edit:
        raise HTTPException(status_code=404, detail="Layout not found")
    return edit


@router.get("/layouts/{layout_id}/edits", response_model=list[BuyerEditResponse])
def get_edit_history(
    layout_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return ai_validation_service.get_edit_history(db, layout_id)


# ─── Fixtures ─────────────────────────────────────────────────────

@router.post("/fixtures", response_model=FixtureResponse)
def create_fixture(
    name: str = Form(...),
    fixture_type: str = Form(...),
    num_positions: int = Form(1),
    position_labels: str = Form(""),
    hidden_prompt: str = Form(""),
    dimensions: str = Form(""),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a fixture with optional image upload."""
    import uuid as _uuid
    from pathlib import Path
    from app.core.config import settings
    from app.models.vm_tower import Fixture

    image_url = None
    if image and image.filename:
        ext = Path(image.filename).suffix.lower() or ".jpg"
        filename = f"fixture_{_uuid.uuid4().hex}{ext}"
        upload_dir = Path(settings.UPLOAD_DIR) / "vm_fixtures"
        upload_dir.mkdir(parents=True, exist_ok=True)
        filepath = upload_dir / filename
        with open(filepath, "wb") as f:
            f.write(image.file.read())
        image_url = f"/uploads/vm_fixtures/{filename}"

    labels = [l.strip() for l in position_labels.split(",") if l.strip()] if position_labels else None

    fixture = Fixture(
        user_id=user.id,
        name=name,
        fixture_type=fixture_type,
        image_url=image_url,
        num_positions=num_positions,
        position_labels=labels,
        hidden_prompt=hidden_prompt or None,
        dimensions=dimensions or None,
    )
    db.add(fixture)
    db.commit()
    db.refresh(fixture)
    return fixture


@router.get("/fixtures", response_model=list[FixtureResponse])
def list_fixtures(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.vm_tower import Fixture
    return db.query(Fixture).filter(Fixture.user_id == user.id).order_by(Fixture.created_at.desc()).all()


@router.get("/fixtures/{fixture_id}", response_model=FixtureResponse)
def get_fixture(
    fixture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.vm_tower import Fixture
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id, Fixture.user_id == user.id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    return fixture


@router.delete("/fixtures/{fixture_id}")
def delete_fixture(
    fixture_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.vm_tower import Fixture
    fixture = db.query(Fixture).filter(Fixture.id == fixture_id, Fixture.user_id == user.id).first()
    if not fixture:
        raise HTTPException(status_code=404, detail="Fixture not found")
    db.delete(fixture)
    db.commit()
    return {"status": "deleted"}


# ─── Mockup Generation (Fixture-Aware) ──────────────────────────

@router.post("/mockup/generate", response_model=LayoutResponse)
def generate_mockup(
    data: MockupGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    layout = nano_banana_service.generate_mockup_with_fixture(
        db, data.layout_id, user.id,
        custom_prompt=data.custom_prompt,
        fixture_id=data.fixture_id,
        garment_product_ids=data.garment_product_ids,
        designer_instructions=data.designer_instructions,
    )
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    return layout


# ─── Prompt Studio ───────────────────────────────────────────────

@router.post("/prompt/generate")
def generate_prompt(
    data: PromptGenerateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """AI generates a display prompt from intent + fixture + products + designer instructions."""
    from app.models.vm_tower import DesignIntent, Fixture, VMLayout
    from app.core.gemini_client import gemini_text

    intent = None
    if data.intent_id:
        intent = db.query(DesignIntent).filter(DesignIntent.id == data.intent_id).first()

    fixture = None
    if data.fixture_id:
        fixture = db.query(Fixture).filter(Fixture.id == data.fixture_id).first()

    layout = None
    if data.layout_id:
        layout = db.query(VMLayout).filter(VMLayout.id == data.layout_id).first()

    products_desc = ""
    if data.product_ids:
        prods = db.query(ProductRange).filter(ProductRange.id.in_(data.product_ids)).all()
        products_desc = ", ".join([f"{p.name} ({p.color or ''} {p.category or ''})" for p in prods])

    context = f"""Generate a detailed visual merchandising display prompt for Nano Banana image generation.

Context:
- Theme: {intent.theme if intent else 'Fashion display'}
- Season: {intent.season if intent else 'Current'}
- Visual Mood: {intent.visual_mood if intent else 'premium'}
- Color Flow: {', '.join(intent.color_flow) if intent and intent.color_flow else 'neutral'}
- Store Type: {intent.target_store_type if intent else 'medium'}
{f'- Fixture: {fixture.name} ({fixture.fixture_type}), {fixture.dimensions or "standard"}' if fixture else ''}
{f'- Fixture Positions: {", ".join(fixture.position_labels)}' if fixture and fixture.position_labels else ''}
{f'- Layout Type: {layout.layout_type}' if layout else ''}
{f'- Products: {products_desc}' if products_desc else ''}
{f'- Designer Instructions: {data.designer_instructions}' if data.designer_instructions else ''}

Write a single, detailed prompt (3-5 sentences) for photorealistic VM image generation. Include fixture details, garment placement, color flow, lighting, and mood. Do NOT include any prefix or label — just the prompt text."""

    prompt = gemini_text(
        prompt=context,
        system_instruction="You are a visual merchandising prompt engineer. Return only the prompt text, no labels or prefixes.",
        temperature=0.7,
    )
    return {"prompt": prompt.strip()}


@router.post("/prompt/refine")
def refine_prompt(
    data: PromptRefineRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """AI refines an existing prompt based on designer feedback."""
    from app.core.gemini_client import gemini_text
    from app.models.vm_tower import DesignIntent

    intent_context = ""
    if data.intent_id:
        intent = db.query(DesignIntent).filter(DesignIntent.id == data.intent_id).first()
        if intent:
            intent_context = f"\nDesign context: Theme={intent.theme}, Season={intent.season}, Mood={intent.visual_mood}"

    context = f"""Refine this visual merchandising display prompt based on the designer's feedback.

Current Prompt:
{data.current_prompt}

Designer's Refinement Request:
{data.refinement_instruction}
{intent_context}

Return ONLY the refined prompt text (3-5 sentences). Keep it detailed and specific for photorealistic image generation. No labels or prefixes."""

    refined = gemini_text(
        prompt=context,
        system_instruction="You are a visual merchandising prompt engineer. Return only the refined prompt text.",
        temperature=0.6,
    )
    return {"prompt": refined.strip()}


# ─── VM Guidelines ────────────────────────────────────────────────

@router.post("/intents/{intent_id}/guidelines", response_model=VMGuidelineResponse)
def generate_guidelines(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    guideline = vm_guideline_service.generate_vm_guidelines(db, intent_id, user.id)
    if not guideline:
        raise HTTPException(status_code=404, detail="Design intent not found")
    return guideline


@router.get("/intents/{intent_id}/guidelines", response_model=Optional[VMGuidelineResponse])
def get_guidelines(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    guideline = vm_guideline_service.get_guidelines(db, intent_id, user.id)
    return guideline


# ─── Zone Management (Drag-Drop) ────────────────────────────────

@router.put("/layouts/{layout_id}/zones", response_model=LayoutResponse)
def update_layout_zones(
    layout_id: int,
    data: ZoneUpdateRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update zone placements for a layout (drag-drop data)."""
    from app.models.vm_tower import VMLayout
    layout = db.query(VMLayout).filter(
        VMLayout.id == layout_id, VMLayout.user_id == user.id
    ).first()
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    layout.zone_data = data.zone_data
    db.commit()
    db.refresh(layout)
    return layout


# ─── Version Control ─────────────────────────────────────────────

@router.post("/layouts/{layout_id}/snapshot", response_model=LayoutVersionResponse)
def save_layout_version(
    layout_id: int,
    label: str = "snapshot",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Save a snapshot of current layout state."""
    from app.models.vm_tower import VMLayout, LayoutVersion
    layout = db.query(VMLayout).filter(
        VMLayout.id == layout_id, VMLayout.user_id == user.id
    ).first()
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")

    # Get next version number
    max_ver = db.query(LayoutVersion).filter(
        LayoutVersion.layout_id == layout_id
    ).count()

    version = LayoutVersion(
        layout_id=layout_id,
        user_id=user.id,
        version_number=max_ver + 1,
        label=label,
        zone_data=layout.zone_data,
        placement_plan=layout.placement_plan,
        product_grouping=layout.product_grouping,
    )
    db.add(version)
    layout.version = max_ver + 1
    db.commit()
    db.refresh(version)
    return version


@router.get("/layouts/{layout_id}/versions", response_model=list[LayoutVersionResponse])
def get_layout_versions(
    layout_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.vm_tower import LayoutVersion
    return db.query(LayoutVersion).filter(
        LayoutVersion.layout_id == layout_id
    ).order_by(LayoutVersion.version_number.desc()).all()


@router.post("/layouts/{layout_id}/restore/{version_id}", response_model=LayoutResponse)
def restore_layout_version(
    layout_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Restore a layout to a previous version."""
    from app.models.vm_tower import VMLayout, LayoutVersion
    layout = db.query(VMLayout).filter(
        VMLayout.id == layout_id, VMLayout.user_id == user.id
    ).first()
    version = db.query(LayoutVersion).filter(
        LayoutVersion.id == version_id, LayoutVersion.layout_id == layout_id
    ).first()
    if not layout or not version:
        raise HTTPException(status_code=404, detail="Layout or version not found")

    layout.zone_data = version.zone_data
    layout.placement_plan = version.placement_plan
    layout.product_grouping = version.product_grouping
    db.commit()
    db.refresh(layout)
    return layout


# ─── Send to Buyer ───────────────────────────────────────────────

@router.post("/intents/{intent_id}/send-to-buyer", response_model=DesignIntentResponse)
def send_to_buyer(
    intent_id: int,
    data: SendToBuyerRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Send approved layouts to buyer with lock/edit options."""
    from app.models.vm_tower import DesignIntent, VMLayout, LayoutVersion
    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id, DesignIntent.user_id == user.id
    ).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    intent.lock_hero_looks = 1 if data.lock_hero_looks else 0
    intent.allow_flexible_editing = 1 if data.allow_flexible_editing else 0
    intent.status = "concept_locked"

    # Auto-snapshot all approved layouts as "original"
    layouts = db.query(VMLayout).filter(
        VMLayout.intent_id == intent_id, VMLayout.is_approved == 1
    ).all()
    for layout in layouts:
        existing = db.query(LayoutVersion).filter(
            LayoutVersion.layout_id == layout.id, LayoutVersion.label == "original"
        ).first()
        if not existing:
            version = LayoutVersion(
                layout_id=layout.id,
                user_id=user.id,
                version_number=1,
                label="original",
                zone_data=layout.zone_data,
                placement_plan=layout.placement_plan,
                product_grouping=layout.product_grouping,
            )
            db.add(version)

    db.commit()
    db.refresh(intent)
    return intent


# ─── AI Outfit Recommendations ───────────────────────────────────

@router.post("/ai/outfit-recommendation")
def get_outfit_recommendations(
    data: OutfitRecommendationRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """AI suggests outfit combinations based on available products."""
    from app.models.vm_tower import DesignIntent
    from app.core.gemini_client import gemini_json
    import json

    intent = db.query(DesignIntent).filter(DesignIntent.id == data.intent_id).first()
    products = db.query(ProductRange).filter(ProductRange.intent_id == data.intent_id).all()

    product_list = [
        {"id": p.id, "name": p.name, "category": p.category or "", "color": p.color or "", "fabric": p.fabric or ""}
        for p in products
    ]

    prompt = f"""You are a fashion stylist AI. Suggest outfit combinations for a visual merchandising display.

Products available:
{json.dumps(product_list, indent=2)}

Design Intent:
- Theme: {intent.theme if intent else 'Fashion'}
- Season: {intent.season if intent else 'Current'}
- Visual Mood: {intent.visual_mood if intent else 'premium'}
- Color Flow: {', '.join(intent.color_flow) if intent and intent.color_flow else 'neutral'}
{f'- Style Preference: {data.style_preference}' if data.style_preference else ''}

Generate 3-5 complete outfit combinations. Each should include complementary pieces.
Return JSON:
{{
  "recommendations": [
    {{
      "look_name": "Look name",
      "product_ids": [1, 2, 3],
      "product_names": ["Product A", "Product B"],
      "styling_note": "How to style this look",
      "confidence": 0.85,
      "tags": ["casual", "summer"]
    }}
  ],
  "visual_balance_tips": ["Tip 1 about spacing", "Tip 2 about color grouping"]
}}"""

    try:
        raw = gemini_json(prompt=prompt, system_instruction="Fashion stylist AI. Return valid JSON.", temperature=0.7)
        result = json.loads(raw)
        return result
    except Exception:
        return {
            "recommendations": [
                {
                    "look_name": f"{intent.theme} Look 1" if intent else "Look 1",
                    "product_ids": [p.id for p in products[:3]],
                    "product_names": [p.name for p in products[:3]],
                    "styling_note": "Pair these items for a cohesive look following the color flow",
                    "confidence": 0.7,
                    "tags": ["curated"],
                }
            ],
            "visual_balance_tips": ["Group similar colors together", "Place hero pieces at eye level"],
        }


# ─── Shoot Plan ──────────────────────────────────────────────────

@router.post("/intents/{intent_id}/shoot-plan", response_model=ShootPlanResponse)
def generate_shoot_plan(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate a structured shoot plan from finalized layouts."""
    from app.models.vm_tower import DesignIntent, VMLayout, ShootPlan
    from app.core.gemini_client import gemini_json
    import json

    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id, DesignIntent.user_id == user.id
    ).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    layouts = db.query(VMLayout).filter(
        VMLayout.intent_id == intent_id, VMLayout.is_approved == 1
    ).all()
    products = db.query(ProductRange).filter(ProductRange.intent_id == intent_id).all()

    layouts_desc = [{"name": l.name, "type": l.layout_type, "zone_data": l.zone_data, "grouping": l.product_grouping} for l in layouts]
    products_desc = [{"id": p.id, "name": p.name, "category": p.category, "color": p.color} for p in products]

    prompt = f"""Generate a structured shoot plan for this visual merchandising collection.

Collection: {intent.theme} — {intent.season}
Mood: {intent.visual_mood}
Color Flow: {', '.join(intent.color_flow or [])}

Layouts:
{json.dumps(layouts_desc, indent=2)}

Products:
{json.dumps(products_desc, indent=2)}

Return JSON:
{{
  "outfit_combinations": [
    {{"look_number": 1, "products": ["Product A", "Product B"], "styling_notes": "How to style"}},
  ],
  "styling_instructions": "Overall styling guide as text",
  "checklist": [
    {{"item": "Checklist item", "category": "styling/accessories/props/zones"}},
  ],
  "shot_sequence": [
    {{"shot_number": 1, "zone": "Wall A", "angle": "Front wide", "products": ["Product A"], "notes": "Capture full wall display"}}
  ]
}}"""

    try:
        raw = gemini_json(prompt=prompt, system_instruction="You are a fashion shoot planner. Return valid JSON.", temperature=0.6)
        result = json.loads(raw)
    except Exception:
        result = {
            "outfit_combinations": [{"look_number": i+1, "products": [p.name], "styling_notes": "Style as shown in layout"} for i, p in enumerate(products[:5])],
            "styling_instructions": f"Follow the {intent.visual_mood} mood. Maintain {' → '.join(intent.color_flow or ['neutral'])} color progression.",
            "checklist": [
                {"item": "Steam all garments", "category": "styling"},
                {"item": "Set up accent lighting", "category": "props"},
                {"item": "Prepare styling zone markers", "category": "zones"},
                {"item": "Accessories ready", "category": "accessories"},
            ],
            "shot_sequence": [{"shot_number": i+1, "zone": l.name, "angle": "Front wide", "products": [], "notes": f"Capture {l.layout_type} display"} for i, l in enumerate(layouts)],
        }

    # Delete old shoot plan
    old = db.query(ShootPlan).filter(ShootPlan.intent_id == intent_id, ShootPlan.user_id == user.id).first()
    if old:
        db.delete(old)

    plan = ShootPlan(
        intent_id=intent_id,
        user_id=user.id,
        outfit_combinations=result.get("outfit_combinations"),
        styling_instructions=result.get("styling_instructions"),
        checklist=result.get("checklist"),
        shot_sequence=result.get("shot_sequence"),
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.get("/intents/{intent_id}/shoot-plan", response_model=Optional[ShootPlanResponse])
def get_shoot_plan(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.vm_tower import ShootPlan
    return db.query(ShootPlan).filter(
        ShootPlan.intent_id == intent_id, ShootPlan.user_id == user.id
    ).first()


# ─── Export ──────────────────────────────────────────────────────

@router.post("/intents/{intent_id}/export")
def export_vm_plan(
    intent_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Export complete VM plan as structured JSON (for download/share)."""
    from app.models.vm_tower import DesignIntent, VMLayout, VMGuideline, ShootPlan

    intent = db.query(DesignIntent).filter(
        DesignIntent.id == intent_id, DesignIntent.user_id == user.id
    ).first()
    if not intent:
        raise HTTPException(status_code=404, detail="Intent not found")

    layouts = db.query(VMLayout).filter(VMLayout.intent_id == intent_id, VMLayout.is_approved == 1).all()
    products = db.query(ProductRange).filter(ProductRange.intent_id == intent_id).all()
    guideline = db.query(VMGuideline).filter(VMGuideline.intent_id == intent_id).first()
    shoot_plan = db.query(ShootPlan).filter(ShootPlan.intent_id == intent_id).first()

    return {
        "collection": {
            "theme": intent.theme,
            "season": intent.season,
            "mood": intent.visual_mood,
            "color_flow": intent.color_flow,
            "store_type": intent.target_store_type,
            "category_mix": intent.category_mix,
            "ai_summary": intent.ai_context_summary,
        },
        "products": [
            {"name": p.name, "sku": p.sku, "category": p.category, "color": p.color, "image_url": p.image_url}
            for p in products
        ],
        "layouts": [
            {
                "name": l.name,
                "type": l.layout_type,
                "zone_data": l.zone_data,
                "placement_plan": l.placement_plan,
                "product_grouping": l.product_grouping,
                "reasoning": l.reasoning,
                "mockup_url": l.mockup_image_url,
            }
            for l in layouts
        ],
        "guidelines": {
            "vm_instructions": guideline.vm_instruction_sheet if guideline else None,
            "shot_list": guideline.shoot_team_shot_list if guideline else None,
            "styling_notes": guideline.styling_notes if guideline else None,
            "placement_guide": guideline.placement_guide if guideline else None,
            "concept_explanation": guideline.concept_explanation if guideline else None,
        } if guideline else None,
        "shoot_plan": {
            "outfit_combinations": shoot_plan.outfit_combinations if shoot_plan else None,
            "styling_instructions": shoot_plan.styling_instructions if shoot_plan else None,
            "checklist": shoot_plan.checklist if shoot_plan else None,
            "shot_sequence": shoot_plan.shot_sequence if shoot_plan else None,
        } if shoot_plan else None,
    }


# ─── Dashboard Stats ──────────────────────────────────────────────

@router.get("/stats")
def get_vm_stats(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from app.models.vm_tower import DesignIntent, VMLayout, ConceptLock, VMGuideline

    total_intents = db.query(DesignIntent).filter(DesignIntent.user_id == user.id).count()
    total_layouts = db.query(VMLayout).filter(VMLayout.user_id == user.id).count()
    active_locks = db.query(ConceptLock).filter(
        ConceptLock.user_id == user.id,
        ConceptLock.is_active == 1
    ).count()
    total_guidelines = db.query(VMGuideline).filter(VMGuideline.user_id == user.id).count()

    return {
        "total_intents": total_intents,
        "total_layouts": total_layouts,
        "active_locks": active_locks,
        "total_guidelines": total_guidelines,
    }
