export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ColorPalette {
  name: string;
  hex: string;
  description: string;
}

export interface FabricSuggestion {
  name: string;
  reason: string;
  care: string;
}

export interface ArtifaxInput {
  category: string;
  occasion: string;
  price_segment: string;
  trend_inspiration: string;
}

export interface ArtifaxOutput {
  moodboard_description: string;
  color_palette: ColorPalette[];
  fabric_suggestions: FabricSuggestion[];
  style_attributes: string[];
  tech_pack_content: string;
}

export interface PhotogenixOutput {
  generated_image_url: string;
  original_image_url: string;
  image_id: string;
}

export interface CatalogixOutput {
  seo_title: string;
  description: string;
  bullet_features: string[];
  keywords: string[];
  tags: string[];
  confidence_score: number;
}

export interface DashboardStats {
  total_designs: number;
  total_images: number;
  total_catalogs: number;
  recent_activity: unknown[];
}
