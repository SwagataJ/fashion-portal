import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ArtifaxSection =
  | "research"
  | "moodboard"
  | "color-studio"
  | "photo-studio";

export interface CanvasItem {
  id: string;
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  url?: string;
  text?: string;
  fontSize?: number;
  fill?: string;
  rotation: number;
}

export interface PaletteColor {
  name: string;
  hex: string;
  description: string;
  usage: string;
}

export interface SavedPalette {
  id: string;
  palette_name: string;
  mood_description: string;
  palette: PaletteColor[];
}

export interface VisualizationImage {
  url: string;
  angle: string;
  timestamp: number;
}

interface ProjectState {
  id?: number;
  name: string;

  // Research section
  research: {
    trends: Record<string, unknown> | null;
    competitor: Record<string, unknown> | null;
    runway: Record<string, unknown> | null;
    savedImages: string[];
  };

  // Moodboard section
  moodboard: {
    items: CanvasItem[];
    generatedImages: string[];
  };

  // Color studio section
  colorData: {
    palettes: SavedPalette[];
    activePaletteId: string | null;
  };

  // Photo studio section
  visualization: {
    images: VisualizationImage[];
    attributes: Record<string, string>;
  };

}

interface ArtifaxStore {
  activeSection: ArtifaxSection;
  project: ProjectState;

  setActiveSection: (section: ArtifaxSection) => void;
  setProjectId: (id: number) => void;
  setProjectName: (name: string) => void;

  // Research
  setTrends: (data: Record<string, unknown>) => void;
  setCompetitor: (data: Record<string, unknown>) => void;
  setRunway: (data: Record<string, unknown>) => void;
  addInspirationImage: (url: string) => void;
  removeInspirationImage: (url: string) => void;

  // Moodboard
  setMoodboardItems: (items: CanvasItem[]) => void;
  addMoodboardGeneratedImage: (url: string) => void;

  // Color Studio
  addPalette: (palette: SavedPalette) => void;
  removePalette: (id: string) => void;
  setActivePalette: (id: string | null) => void;

  // Visualization
  addVisualizationImage: (img: VisualizationImage) => void;
  setAttributes: (attrs: Record<string, string>) => void;

  // Reset
  resetProject: () => void;
}

const defaultProject: ProjectState = {
  name: "Untitled Project",
  research: { trends: null, competitor: null, runway: null, savedImages: [] },
  moodboard: { items: [], generatedImages: [] },
  colorData: { palettes: [], activePaletteId: null },
  visualization: { images: [], attributes: {} },
};

export const useArtifaxStore = create<ArtifaxStore>()(
  persist(
    (set) => ({
      activeSection: "research",
      project: defaultProject,

      setActiveSection: (section) => set({ activeSection: section }),
      setProjectId: (id) =>
        set((s) => ({ project: { ...s.project, id } })),
      setProjectName: (name) =>
        set((s) => ({ project: { ...s.project, name } })),

      // Research
      setTrends: (data) =>
        set((s) => ({
          project: {
            ...s.project,
            research: { ...s.project.research, trends: data },
          },
        })),
      setCompetitor: (data) =>
        set((s) => ({
          project: {
            ...s.project,
            research: { ...s.project.research, competitor: data },
          },
        })),
      setRunway: (data) =>
        set((s) => ({
          project: {
            ...s.project,
            research: { ...s.project.research, runway: data },
          },
        })),
      addInspirationImage: (url) =>
        set((s) => ({
          project: {
            ...s.project,
            research: {
              ...s.project.research,
              savedImages: [...s.project.research.savedImages, url],
            },
          },
        })),
      removeInspirationImage: (url) =>
        set((s) => ({
          project: {
            ...s.project,
            research: {
              ...s.project.research,
              savedImages: s.project.research.savedImages.filter((u) => u !== url),
            },
          },
        })),

      // Moodboard
      setMoodboardItems: (items) =>
        set((s) => ({
          project: {
            ...s.project,
            moodboard: { ...s.project.moodboard, items },
          },
        })),
      addMoodboardGeneratedImage: (url) =>
        set((s) => ({
          project: {
            ...s.project,
            moodboard: {
              ...s.project.moodboard,
              generatedImages: [...s.project.moodboard.generatedImages, url],
            },
          },
        })),

      // Color Studio
      addPalette: (palette) =>
        set((s) => ({
          project: {
            ...s.project,
            colorData: {
              ...s.project.colorData,
              palettes: [...s.project.colorData.palettes, palette],
              activePaletteId: palette.id,
            },
          },
        })),
      removePalette: (id) =>
        set((s) => ({
          project: {
            ...s.project,
            colorData: {
              ...s.project.colorData,
              palettes: s.project.colorData.palettes.filter((p) => p.id !== id),
              activePaletteId:
                s.project.colorData.activePaletteId === id
                  ? null
                  : s.project.colorData.activePaletteId,
            },
          },
        })),
      setActivePalette: (id) =>
        set((s) => ({
          project: {
            ...s.project,
            colorData: { ...s.project.colorData, activePaletteId: id },
          },
        })),

      // Visualization
      addVisualizationImage: (img) =>
        set((s) => ({
          project: {
            ...s.project,
            visualization: {
              ...s.project.visualization,
              images: [img, ...s.project.visualization.images].slice(0, 20),
            },
          },
        })),
      setAttributes: (attrs) =>
        set((s) => ({
          project: {
            ...s.project,
            visualization: { ...s.project.visualization, attributes: attrs },
          },
        })),

      // Reset
      resetProject: () =>
        set({ project: { ...defaultProject, name: "Untitled Project" } }),
    }),
    {
      name: "artifax-project-storage",
      partialize: (state) => ({ project: state.project }),
    }
  )
);
