"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { ThemeDocumentRenderer } from "@/components/theme-renderer/theme-document";
import type { ThemeRenderContext } from "@/components/theme-renderer/context";
import {
  THEME_CATEGORIES,
  ThemeSettingsPanel,
  SectionSettingsPanel,
  BlockSettingsPanel,
  type ThemeSettingsCategory,
} from "@/components/theme-editor/fields";
import type { ThemeMetafieldOption, ThemeCollectionCard, ThemeProductCard } from "@/components/theme-editor/types";
import { cn } from "@/lib/cn";
import type { Locale } from "@/i18n/config";
import type {
  ThemeAssignment,
  ThemeBlockInstance,
  ThemeDocument,
  ThemeSectionInstance,
  ThemeTemplate,
  ThemeTemplateType,
} from "@/lib/theme-editor/types";
import { TEMPLATE_TYPES } from "@/lib/theme-editor/types";
import {
  blockTypesForSection,
  cloneTemplate,
  createThemeDocument,
  makeId,
  newBlock,
  newSection,
  newTemplate,
  sectionCategoryLabel,
  sectionsForTemplateType,
  templateLabel,
} from "@/lib/theme-editor/defaults";
import {
  SECTION_SCHEMAS,
  getBlockSchema,
  getSectionSchema,
} from "@/lib/theme-editor/schema";
import type { ThemeAppBlock, ThemeAppEmbed } from "@/lib/theme-editor/types";

type Selection =
  | { kind: "section"; area: SectionArea; sectionId: string; templateId?: string }
  | { kind: "block"; area: SectionArea; sectionId: string; blockId: string; templateId?: string }
  | { kind: "template"; templateId: string }
  | null;

type SectionArea = "header" | "footer" | "template";
type Panel = "sections" | "theme" | "apps";
type Device = "desktop" | "tablet" | "mobile";

export type ThemeEditorProps = {
  themeId: string;
  themeName: string;
  themeStatus: "draft" | "published";
  themeActive: boolean;
  initialDocument: ThemeDocument;
  locale: Locale;
  store: {
    id: string;
    name: string;
    slug: string;
    currency: string;
    country: string;
    codEnabled: boolean;
  };
  renderContext: ThemeRenderContext;
  products: ThemeProductCard[];
  collections: ThemeCollectionCard[];
  metafields: ThemeMetafieldOption[];
  appEmbeds: ThemeAppEmbed[];
  appBlocks: ThemeAppBlock[];
  assignments: ThemeAssignment[];
};

function deepCloneSection(section: ThemeSectionInstance): ThemeSectionInstance {
  return {
    ...section,
    id: makeId("section"),
    settings: { ...section.settings },
    blocks: section.blocks.map((block) => ({
      ...block,
      id: makeId("block"),
      settings: { ...block.settings },
    })),
  };
}

function findSection(
  document: ThemeDocument,
  area: SectionArea,
  sectionId: string,
  templateId?: string,
): ThemeSectionInstance | null {
  if (area === "header") return document.header.find((entry) => entry.id === sectionId) ?? null;
  if (area === "footer") return document.footer.find((entry) => entry.id === sectionId) ?? null;
  const template = document.templates.find((entry) => entry.id === templateId);
  return template?.sections.find((entry) => entry.id === sectionId) ?? null;
}

function mapArea(
  document: ThemeDocument,
  area: SectionArea,
  templateId: string | undefined,
  mapper: (sections: ThemeSectionInstance[]) => ThemeSectionInstance[],
): ThemeDocument {
  if (area === "header") return { ...document, header: mapper(document.header) };
  if (area === "footer") return { ...document, footer: mapper(document.footer) };
  return {
    ...document,
    templates: document.templates.map((template) =>
      template.id === templateId ? { ...template, sections: mapper(template.sections) } : template,
    ),
  };
}

/* ------------------------------------------------------------------ *
 *  Éditeur
 * ------------------------------------------------------------------ */

export function ThemeEditor(props: ThemeEditorProps) {
  const {
    themeId,
    locale,
    initialDocument,
    renderContext,
    products,
    collections,
    metafields,
    appEmbeds,
    appBlocks,
    assignments,
  } = props;

  const router = useRouter();
  const [document, setDocument] = useState<ThemeDocument>(initialDocument);
  const documentRef = useRef(document);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [status, setStatus] = useState<{ status: "draft" | "published"; active: boolean }>({
    status: props.themeStatus,
    active: props.themeActive,
  });
  const [name, setName] = useState(props.themeName);

  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialDocument.templates.find((template) => template.type === "index")?.id ??
      initialDocument.templates[0]?.id ??
      "index",
  );
  const [selection, setSelection] = useState<Selection>(null);
  const [panel, setPanel] = useState<Panel>("sections");
  const [themeCategory, setThemeCategory] = useState<ThemeSettingsCategory>("logo");
  const [device, setDevice] = useState<Device>("desktop");
  const [inspect, setInspect] = useState(true);
  const [market, setMarket] = useState("all");
  const [mobilePane, setMobilePane] = useState<"structure" | "preview" | "settings">("preview");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryArea, setLibraryArea] = useState<SectionArea>("template");
  const [templateModal, setTemplateModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [previewLink, setPreviewLink] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [localBackup, setLocalBackup] = useState<string | null>(null);

  const [appList, setAppList] = useState(appEmbeds);
  const [appBlockList] = useState(appBlocks);
  const [assignmentList, setAssignmentList] = useState(assignments);
  const [metafieldList, setMetafieldList] = useState(metafields);

  const currentTemplate =
    document.templates.find((template) => template.id === selectedTemplateId) ??
    document.templates[0];

  const resourceType: "product" | "collection" | null =
    currentTemplate?.type === "product"
      ? "product"
      : currentTemplate?.type === "collection"
        ? "collection"
        : null;
  const assignableItems =
    resourceType === "product"
      ? products
      : resourceType === "collection"
        ? collections
        : [];

  const pastRef = useRef<ThemeDocument[]>([]);
  const futureRef = useRef<ThemeDocument[]>([]);
  const lastHistory = useRef({ key: "", time: 0 });
  const [, setHistoryVersion] = useState(0);
  const [historyCount, setHistoryCount] = useState({ past: 0, future: 0 });

  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  // Sur téléphone, l'éditeur s'ouvre directement sur l'aperçu mobile.
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDevice("mobile");
    }
  }, []);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Restauration proposée d'un brouillon local plus récent.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`pashove-theme-draft-${themeId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { at?: string; document?: ThemeDocument };
      if (parsed.document && parsed.at) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocalBackup(parsed.at);
      }
    } catch {
      // Navigation privée : pas de copie locale.
    }
  }, [themeId]);

  const commit = useCallback(
    (next: ThemeDocument, historyKey?: string) => {
      const previous = documentRef.current;
      const now = Date.now();
      const shouldPush =
        !historyKey ||
        lastHistory.current.key !== historyKey ||
        now - lastHistory.current.time > 700;

      if (shouldPush) {
        pastRef.current.push(previous);
        if (pastRef.current.length > 60) pastRef.current.shift();
        futureRef.current = [];
        setHistoryVersion((value) => value + 1);
        setHistoryCount({ past: pastRef.current.length, future: futureRef.current.length });
      }
      lastHistory.current = { key: historyKey ?? "", time: now };

      documentRef.current = next;
      setDocument(next);
      setDirty(true);
      dirtyRef.current = true;
      try {
        window.localStorage.setItem(
          `pashove-theme-draft-${themeId}`,
          JSON.stringify({ at: new Date().toISOString(), document: next }),
        );
      } catch {
        // Pas de stockage local : le serveur reste la seule copie.
      }
    },
    [themeId],
  );

  const undo = useCallback(() => {
    const previous = pastRef.current.pop();
    if (!previous) return;
    futureRef.current.push(documentRef.current);
    documentRef.current = previous;
    setDocument(previous);
    setDirty(true);
    setHistoryVersion((value) => value + 1);
    setHistoryCount({ past: pastRef.current.length, future: futureRef.current.length });
  }, []);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(documentRef.current);
    documentRef.current = next;
    setDocument(next);
    setDirty(true);
    setHistoryVersion((value) => value + 1);
    setHistoryCount({ past: pastRef.current.length, future: futureRef.current.length });
  }, []);

  const save = useCallback(
    async (makeVersion = false, announce = false) => {
      setSaveState("saving");
      try {
        const response = await fetch(`/api/themes/${themeId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ document: documentRef.current, makeVersion }),
        });
        if (!response.ok) throw new Error("save_failed");
        setDirty(false);
        dirtyRef.current = false;
        setSaveState("saved");
        setLocalBackup(null);
        try {
          window.localStorage.removeItem(`pashove-theme-draft-${themeId}`);
        } catch {
          // Rien à nettoyer.
        }
        if (announce) setToast(makeVersion ? "Version enregistrée." : "Brouillon enregistré.");
      } catch {
        setSaveState("error");
        if (announce) setToast("Impossible d’enregistrer le thème.");
      }
    },
    [themeId],
  );

  // Sauvegarde automatique toutes les 30 secondes.
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (dirtyRef.current) void save(false);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [save]);

  // Raccourcis clavier.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void save(true, true);
        return;
      }
      if (meta && event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
        return;
      }
      if (meta && (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))) {
        event.preventDefault();
        redo();
        return;
      }
      if (meta && event.key === "/") {
        event.preventDefault();
        setShortcutsOpen((open) => !open);
        return;
      }
      if (event.key === "Escape") {
        setLibraryOpen(false);
        setTemplateModal(false);
        setAssignModal(false);
        setShortcutsOpen(false);
        setPreviewLink(null);
        return;
      }
      if (event.shiftKey && (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "ArrowLeft" || event.key === "ArrowUp")) {
        const sections = currentTemplate?.sections ?? [];
        if (sections.length === 0) return;
        event.preventDefault();
        const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
        const index = selection?.kind === "section" ? sections.findIndex((entry) => entry.id === selection.sectionId) : -1;
        const nextIndex = Math.min(sections.length - 1, Math.max(0, index + direction));
        setSelection({ kind: "section", area: "template", sectionId: sections[nextIndex].id, templateId: currentTemplate.id });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, save, selection, currentTemplate]);

  const restoreBackup = () => {
    try {
      const raw = window.localStorage.getItem(`pashove-theme-draft-${themeId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { document?: ThemeDocument };
      if (parsed.document) {
        commit(parsed.document, `restore-${Date.now()}`);
        setLocalBackup(null);
        setToast("Copie locale restaurée.");
      }
    } catch {
      setToast("La copie locale est illisible.");
    }
  };

  const publish = async () => {
    if (!window.confirm("Publier ce thème ? La boutique publique affichera immédiatement cette version.")) {
      return;
    }
    await save(true);
    setSaveState("saving");
    try {
      const response = await fetch(`/api/themes/${themeId}/publish`, { method: "POST" });
      if (!response.ok) throw new Error("publish_failed");
      setStatus({ status: "published", active: true });
      setToast("Thème publié. Ta boutique est en ligne avec ce design.");
      router.refresh();
    } catch {
      setSaveState("error");
      setToast("Impossible de publier le thème.");
    }
  };

  const duplicateTheme = async () => {
    const response = await fetch(`/api/themes/${themeId}/duplicate`, { method: "POST" });
    if (!response.ok) {
      setToast("Impossible de dupliquer le thème.");
      return;
    }
    const payload = (await response.json()) as { data?: { id?: string } };
    if (payload.data?.id) {
      router.push(`/${locale}/app/themes/${payload.data.id}/editor`);
    }
  };

  const renameTheme = async () => {
    const next = window.prompt("Nom du thème", name);
    if (!next || next.trim() === name) return;
    const trimmed = next.trim().slice(0, 80);
    setName(trimmed);
    await fetch(`/api/themes/${themeId}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setToast("Thème renommé.");
  };

  const resetTheme = () => {
    if (!window.confirm("Réinitialiser le thème sur le modèle Pashove Dawn ? Les modifications du brouillon seront perdues.")) return;
    const fresh = createThemeDocument("dawn");
    commit(fresh, `reset-${Date.now()}`);
    setSelectedTemplateId(fresh.templates[0].id);
    setSelection(null);
    setToast("Thème réinitialisé. Enregistre pour conserver.");
  };

  const downloadTheme = () => {
    const blob = new Blob([JSON.stringify(documentRef.current, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "theme"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openPreview = async () => {
    const response = await fetch(`/api/themes/${themeId}/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale, template: currentTemplate?.type }),
    });
    if (!response.ok) {
      setToast("Impossible de générer l’aperçu.");
      return;
    }
    const payload = (await response.json()) as { data?: { url?: string } };
    if (payload.data?.url) {
      const target = new URL(payload.data.url);
      target.searchParams.set("template", currentTemplate?.id ?? "index");
      window.open(target.toString(), "_blank", "noopener");
    }
  };

  const sharePreview = async () => {
    const response = await fetch(`/api/themes/${themeId}/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    if (!response.ok) {
      setToast("Impossible de créer le lien.");
      return;
    }
    const payload = (await response.json()) as { data?: { url?: string } };
    if (payload.data?.url) setPreviewLink(payload.data.url);
  };

  const createMetafield = async (ownerType: string, ownerId: string, key: string, value: string) => {
    const response = await fetch("/api/metafields", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ownerType,
        ownerId,
        key: key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        namespace: "custom",
        value,
        type: "text",
      }),
    });
    if (!response.ok) {
      setToast("Impossible de créer le méta-champ.");
      return null;
    }
    const payload = (await response.json()) as { data?: { id: string; namespace: string; key: string } };
    if (!payload.data) return null;
    const option: ThemeMetafieldOption = {
      id: payload.data.id,
      owner: ownerType as ThemeMetafieldOption["owner"],
      ownerId,
      namespace: payload.data.namespace,
      key: payload.data.key,
      label: value,
      value,
    };
    setMetafieldList((current) => [...current, option]);
    return option;
  };

  const toggleApp = async (embed: ThemeAppEmbed) => {
    const next = !embed.enabled;
    setAppList((current) =>
      current.map((entry) => (entry.appId === embed.appId ? { ...entry, enabled: next } : entry)),
    );
    await fetch(`/api/themes/${themeId}/apps`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId: embed.appId, name: embed.name, enabled: next }),
    });
  };

  const addApp = async () => {
    const appId = window.prompt("Identifiant de l’application (ex. avis-clients)");
    if (!appId) return;
    const label = window.prompt("Nom affiché", appId) || appId;
    await fetch(`/api/themes/${themeId}/apps`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appId, name: label, enabled: true }),
    });
    setAppList((current) => [
      ...current,
      { id: makeId("app"), appId, name: label, enabled: true, settings: {} },
    ]);
  };

  const fieldContext = {
    storeId: props.store.id,
    storeSlug: props.store.slug,
    products,
    collections,
    metafields: metafieldList,
    settings: document.settings,
    onCreateMetafield: createMetafield,
  };

  const previewBase: ThemeRenderContext = useMemo(
    () => ({
      ...renderContext,
      appEmbeds: appList
        .filter((embed) => embed.enabled)
        .map((embed) => ({ appId: embed.appId, name: embed.name, settings: embed.settings })),
    }),
    [renderContext, appList],
  );

  const previewContext: ThemeRenderContext = useMemo(() => {
    if (currentTemplate?.type === "product") {
      return {
        ...previewBase,
        metafields: {
          ...previewBase.metafields,
          product: {
            ...(previewBase.metafields?.product ?? {}),
            ...Object.fromEntries(
              metafieldList
                .filter((entry) => entry.owner === "product")
                .map((entry) => [`${entry.namespace}.${entry.key}`, entry.value]),
            ),
          },
        },
      };
    }
    return previewBase;
  }, [previewBase, currentTemplate?.type, metafieldList]);

  const selectedSection =
    selection?.kind === "section"
      ? findSection(document, selection.area, selection.sectionId, selection.templateId)
      : selection?.kind === "block"
        ? findSection(document, selection.area, selection.sectionId, selection.templateId)
        : null;

  const selectedBlock =
    selection?.kind === "block" && selectedSection
      ? selectedSection.blocks.find((block) => block.id === selection.blockId) ?? null
      : null;

  const updateSection = (next: ThemeSectionInstance) => {
    if (!selection || (selection.kind !== "section" && selection.kind !== "block")) return;
    commit(
      mapArea(document, selection.area, selection.templateId, (sections) =>
        sections.map((section) => (section.id === next.id ? next : section)),
      ),
      `${next.id}:settings`,
    );
  };

  const updateBlock = (next: ThemeBlockInstance) => {
    if (!selection || selection.kind !== "block" || !selectedSection) return;
    const section = {
      ...selectedSection,
      blocks: selectedSection.blocks.map((block) => (block.id === next.id ? next : block)),
    };
    updateSection(section);
  };

  const moveSection = (area: SectionArea, templateId: string | undefined, sectionId: string, delta: number) => {
    commit(
      mapArea(document, area, templateId, (sections) => {
        const index = sections.findIndex((section) => section.id === sectionId);
        const target = index + delta;
        if (index < 0 || target < 0 || target >= sections.length) return sections;
        const next = [...sections];
        const [item] = next.splice(index, 1);
        next.splice(target, 0, item);
        return next;
      }),
      `move-${sectionId}-${Date.now()}`,
    );
  };

  const duplicateSection = (area: SectionArea, templateId: string | undefined, section: ThemeSectionInstance) => {
    const copy = deepCloneSection(section);
    copy.name = `${section.name} (copie)`;
    commit(
      mapArea(document, area, templateId, (sections) => [...sections, copy]),
      `dup-${section.id}-${Date.now()}`,
    );
    setSelection({ kind: "section", area, sectionId: copy.id, templateId });
  };

  const deleteSection = (area: SectionArea, templateId: string | undefined, sectionId: string) => {
    if (!window.confirm("Supprimer cette section ?")) return;
    commit(
      mapArea(document, area, templateId, (sections) => sections.filter((section) => section.id !== sectionId)),
      `del-${sectionId}-${Date.now()}`,
    );
    setSelection(null);
  };

  const renameSection = (area: SectionArea, templateId: string | undefined, section: ThemeSectionInstance, nextName: string) => {
    commit(
      mapArea(document, area, templateId, (sections) =>
        sections.map((entry) => (entry.id === section.id ? { ...entry, name: nextName.slice(0, 80) } : entry)),
      ),
      `rename-${section.id}-${Date.now()}`,
    );
  };

  const toggleSection = (area: SectionArea, templateId: string | undefined, section: ThemeSectionInstance) => {
    commit(
      mapArea(document, area, templateId, (sections) =>
        sections.map((entry) => (entry.id === section.id ? { ...entry, visible: !entry.visible } : entry)),
      ),
      `vis-${section.id}`,
    );
  };

  const mutateBlocks = (
    area: SectionArea,
    templateId: string | undefined,
    sectionId: string,
    mutate: (blocks: ThemeBlockInstance[]) => ThemeBlockInstance[] | null,
    historyKey: string,
  ) => {
    commit(
      mapArea(document, area, templateId, (sections) =>
        sections.map((section) => {
          if (section.id !== sectionId) return section;
          const blocks = mutate(section.blocks);
          return blocks ? { ...section, blocks } : section;
        }),
      ),
      historyKey,
    );
  };

  const moveBlock = (
    area: SectionArea,
    templateId: string | undefined,
    sectionId: string,
    blockId: string,
    delta: number,
  ) => {
    mutateBlocks(
      area,
      templateId,
      sectionId,
      (blocks) => {
        const index = blocks.findIndex((block) => block.id === blockId);
        const target = index + delta;
        if (index < 0 || target < 0 || target >= blocks.length) return null;
        const next = [...blocks];
        const [item] = next.splice(index, 1);
        next.splice(target, 0, item);
        return next;
      },
      `move-block-${blockId}-${Date.now()}`,
    );
  };

  const duplicateBlock = (
    area: SectionArea,
    templateId: string | undefined,
    section: ThemeSectionInstance,
    block: ThemeBlockInstance,
  ) => {
    const limit = getSectionSchema(section.type)?.blocks?.limit ?? 0;
    if (section.blocks.length >= limit) {
      setToast(`Limite de ${limit} blocs atteinte pour cette section.`);
      return;
    }
    const copy: ThemeBlockInstance = {
      ...block,
      id: makeId("block"),
      settings: { ...block.settings },
    };
    mutateBlocks(
      area,
      templateId,
      section.id,
      (blocks) => {
        const index = blocks.findIndex((entry) => entry.id === block.id);
        const next = [...blocks];
        next.splice(index < 0 ? next.length : index + 1, 0, copy);
        return next;
      },
      `dup-block-${block.id}-${Date.now()}`,
    );
    setSelection({ kind: "block", area, sectionId: section.id, blockId: copy.id, templateId });
  };

  const toggleBlock = (
    area: SectionArea,
    templateId: string | undefined,
    sectionId: string,
    block: ThemeBlockInstance,
  ) => {
    mutateBlocks(
      area,
      templateId,
      sectionId,
      (blocks) =>
        blocks.map((entry) => (entry.id === block.id ? { ...entry, visible: !entry.visible } : entry)),
      `vis-block-${block.id}`,
    );
  };

  const renameBlock = (
    area: SectionArea,
    templateId: string | undefined,
    sectionId: string,
    block: ThemeBlockInstance,
    name: string,
  ) => {
    mutateBlocks(
      area,
      templateId,
      sectionId,
      (blocks) =>
        blocks.map((entry) =>
          entry.id === block.id ? { ...entry, name: name.trim().slice(0, 80) || undefined } : entry,
        ),
      `rename-block-${block.id}-${Date.now()}`,
    );
  };

  const deleteBlock = (
    area: SectionArea,
    templateId: string | undefined,
    sectionId: string,
    blockId: string,
  ) => {
    mutateBlocks(
      area,
      templateId,
      sectionId,
      (blocks) => blocks.filter((entry) => entry.id !== blockId),
      `del-block-${blockId}-${Date.now()}`,
    );
    setSelection({ kind: "section", area, sectionId, templateId });
  };

  /** Déplace un bloc vers une autre section si son type y est autorisé. */
  const moveBlockToSection = (
    area: SectionArea,
    templateId: string | undefined,
    fromSectionId: string,
    blockId: string,
    toSectionId: string,
  ) => {
    if (fromSectionId === toSectionId) return;
    const from = findSection(document, area, fromSectionId, templateId);
    const to = findSection(document, area, toSectionId, templateId);
    if (!from || !to) return;
    const block = from.blocks.find((entry) => entry.id === blockId);
    if (!block) return;
    const targetSchema = getSectionSchema(to.type);
    if (!targetSchema?.blocks?.allowed.includes(block.type)) {
      setToast("Ce bloc n’est pas compatible avec la section de destination.");
      return;
    }
    if (to.blocks.length >= targetSchema.blocks.limit) {
      setToast(`La section de destination a atteint sa limite de ${targetSchema.blocks.limit} blocs.`);
      return;
    }
    commit(
      mapArea(document, area, templateId, (sections) =>
        sections.map((section) => {
          if (section.id === fromSectionId) {
            return { ...section, blocks: section.blocks.filter((entry) => entry.id !== blockId) };
          }
          if (section.id === toSectionId) {
            return { ...section, blocks: [...section.blocks, block] };
          }
          return section;
        }),
      ),
      `move-block-section-${blockId}-${Date.now()}`,
    );
    setSelection({ kind: "block", area, sectionId: toSectionId, blockId, templateId });
    setToast(`Bloc déplacé vers « ${to.name} ».`);
  };

  const addSection = (type: string, area: SectionArea, templateId?: string) => {
    const section = newSection(type);
    if (area === "template" && currentTemplate) {
      if (currentTemplate.sections.length >= 25) {
        setToast("Limite de 25 sections par modèle atteinte.");
        return;
      }
      commit(
        {
          ...document,
          templates: document.templates.map((template) =>
            template.id === currentTemplate.id
              ? { ...template, sections: [...template.sections, section] }
              : template,
          ),
        },
        `add-${Date.now()}`,
      );
      setSelection({ kind: "section", area, sectionId: section.id, templateId: currentTemplate.id });
    } else {
      commit(
        area === "header"
          ? { ...document, header: [...document.header, section] }
          : { ...document, footer: [...document.footer, section] },
        `add-${Date.now()}`,
      );
      setSelection({ kind: "section", area, sectionId: section.id });
    }
    setLibraryOpen(false);
    setLibraryArea("template");
    setPanel("sections");
  };

  const addBlock = (section: ThemeSectionInstance, type: string) => {
    const schema = getSectionSchema(section.type);
    if (!schema?.blocks) return;
    if (section.blocks.length >= schema.blocks.limit) {
      setToast(`Limite de ${schema.blocks.limit} blocs atteinte.`);
      return;
    }
    updateSection({ ...section, blocks: [...section.blocks, newBlock(type)] });
  };

  /** Ajoute un app block comme section du modèle courant. */
  const addAppBlockSection = (block: ThemeAppBlock) => {
    if (!currentTemplate) return;
    if (currentTemplate.sections.length >= 25) {
      setToast("Limite de 25 sections par modèle atteinte.");
      return;
    }
    const section = newSection("app-block");
    section.name = block.name || "Bloc d’application";
    section.settings = {
      ...section.settings,
      heading: block.name,
      appId: block.appId,
      blockType: block.blockType,
    };
    commit(
      {
        ...document,
        templates: document.templates.map((template) =>
          template.id === currentTemplate.id
            ? { ...template, sections: [...template.sections, section] }
            : template,
        ),
      },
      makeId("add-app"),
    );
    setSelection({ kind: "section", area: "template", sectionId: section.id, templateId: currentTemplate.id });
    setPanel("sections");
    setToast(`« ${block.name} » ajouté au modèle.`);
  };

  const createTemplate = (type: ThemeTemplateType, templateName: string, baseId: string) => {
    const base = document.templates.find((template) => template.id === baseId);
    const template = base ? cloneTemplate(base, templateName) : newTemplate(type, templateName);
    template.type = type;
    commit(
      { ...document, templates: [...document.templates, template] },
      `template-${Date.now()}`,
    );
    setSelectedTemplateId(template.id);
    setSelection({ kind: "template", templateId: template.id });
    setTemplateModal(false);
    setToast("Modèle créé.");
  };

  const deleteTemplate = (templateId: string) => {
    const template = document.templates.find((entry) => entry.id === templateId);
    if (!template || template.type === "index") {
      setToast("Le modèle de la page d’accueil ne peut pas être supprimé.");
      return;
    }
    if (!window.confirm(`Supprimer le modèle « ${template.name} » ?`)) return;
    const templates = document.templates.filter((entry) => entry.id !== templateId);
    commit({ ...document, templates }, `del-template-${Date.now()}`);
    setSelectedTemplateId(templates[0]?.id ?? "index");
    setSelection(null);
  };

  const assignResource = async (resourceId: string) => {
    if (!resourceType) return;
    await save(true);
    const response = await fetch(`/api/themes/${themeId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        templateKey: currentTemplate?.id,
        resourceType,
        resourceId,
      }),
    });
    if (!response.ok) {
      setToast("Impossible d’appliquer le modèle.");
      return;
    }
    setAssignmentList((current) => [
      ...current.filter((entry) => !(entry.resourceType === resourceType && entry.resourceId === resourceId)),
      { resourceType, resourceId, templateKey: currentTemplate?.id ?? "" },
    ]);
    setAssignModal(false);
    setToast("Modèle appliqué.");
  };

  const assignedResources = assignmentList.filter((entry) => entry.templateKey === currentTemplate?.id);

  return (
    <div className="pashove-editor min-h-dvh bg-bg text-fg">
      <style>{`@media (max-width: 1023px) { .pashove-editor button, .pashove-editor select { min-height: 44px; } }`}</style>
      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-ink-950 px-5 py-2.5 text-[0.8rem] font-medium text-white shadow-2xl">
          {toast}
        </div>
      ) : null}

      {localBackup ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-[0.72rem] text-amber-200">
          <span>Une copie locale plus récente existe ({new Date(localBackup).toLocaleString("fr-FR")}).</span>
          <div className="flex gap-2">
            <button type="button" className="rounded-full bg-amber-500 px-3 py-1 font-semibold text-black" onClick={restoreBackup}>Restaurer</button>
            <button type="button" className="rounded-full border border-amber-500/40 px-3 py-1" onClick={() => setLocalBackup(null)}>Ignorer</button>
          </div>
        </div>
      ) : null}

      <TopBar
        {...{
          name,
          status,
          saveState,
          dirty,
          document,
          currentTemplate,
          templates: document.templates,
          selectedTemplateId,
          setSelectedTemplateId,
          selection,
          setSelection,
          panel,
          setPanel,
          themeCategory,
          setThemeCategory,
          device,
          setDevice,
          inspect,
          setInspect,
          market,
          setMarket,
          undo,
          redo,
          canUndo: historyCount.past > 0,
          canRedo: historyCount.future > 0,
          save,
          publish,
          duplicateTheme,
          renameTheme,
          resetTheme,
          downloadTheme,
          openPreview,
          sharePreview,
          setShortcutsOpen,
          locale,
          themeId,
          onTemplateModal: () => setTemplateModal(true),
          onAssign: () => setAssignModal(true),
          onDeleteTemplate: deleteTemplate,
        }}
      />

      <div className="grid min-h-[calc(100dvh-57px)] lg:grid-cols-[280px_minmax(0,1fr)_350px]">
        <aside
          className={cn(
            "border-b border-border bg-surface/40 lg:border-b-0 lg:border-r",
            mobilePane !== "structure" && "hidden lg:block",
          )}
        >
          <LeftPanel
            document={document}
            panel={panel}
            setPanel={setPanel}
            themeCategory={themeCategory}
            setThemeCategory={setThemeCategory}
            currentTemplate={currentTemplate}
            selection={selection}
            setSelection={setSelection}
            onMoveSection={moveSection}
            onDuplicateSection={duplicateSection}
            onDeleteSection={deleteSection}
            onToggleSection={toggleSection}
            onAddSection={addSection}
            onAddBlock={addBlock}
            onRenameSection={renameSection}
            onMoveBlock={moveBlock}
            onDuplicateBlock={duplicateBlock}
            onToggleBlock={toggleBlock}
            onRenameBlock={renameBlock}
            onDeleteBlock={deleteBlock}
            onMoveBlockToSection={moveBlockToSection}
            onOpenLibrary={(area) => { setLibraryArea(area); setLibraryOpen(true); }}
            appList={appList}
            appBlockList={appBlockList}
            onToggleApp={toggleApp}
            onAddApp={addApp}
            assignedResources={assignedResources}
            products={products}
            onAssign={() => setAssignModal(true)}
          />
        </aside>

        <section className={cn("min-w-0 bg-bg-soft/40 p-3 sm:p-4", mobilePane !== "preview" && "hidden lg:block")}>
          <PreviewPane
            document={document}
            context={previewContext}
            templateId={currentTemplate?.id ?? "index"}
            device={device}
            inspect={inspect}
            market={market}
            selection={selection}
            onSelectSection={(sectionId) => {
              setSelection({ kind: "section", area: "template", sectionId, templateId: currentTemplate?.id });
              setPanel("sections");
            }}
            onSelectBlock={(sectionId, blockId) => {
              setSelection({ kind: "block", area: "template", sectionId, blockId, templateId: currentTemplate?.id });
              setPanel("sections");
            }}
          />
        </section>

        <aside
          className={cn(
            "border-t border-border bg-surface/40 lg:border-l lg:border-t-0",
            mobilePane !== "settings" && "hidden lg:block",
          )}
        >
          <div className="max-h-[calc(100dvh-57px)] overflow-y-auto p-4">
            {panel === "theme" ? (
              <ThemeSettingsPanel
                category={themeCategory}
                settings={document.settings}
                context={fieldContext}
                onChange={(patch) =>
                  commit(
                    { ...document, settings: { ...document.settings, ...patch } },
                    `theme-${themeCategory}`,
                  )
                }
                onDeletePalette={(id) =>
                  commit({
                    ...document,
                    settings: {
                      ...document.settings,
                      palettes: document.settings.palettes.filter((palette) => palette.id !== id),
                      activePaletteId:
                        document.settings.activePaletteId === id
                          ? document.settings.palettes.find((palette) => palette.id !== id)?.id ?? ""
                          : document.settings.activePaletteId,
                    },
                  }, `palette-del-${id}`)
                }
                onDuplicatePalette={(id) => {
                  const palette = document.settings.palettes.find((entry) => entry.id === id);
                  if (!palette) return;
                  commit({
                    ...document,
                    settings: {
                      ...document.settings,
                      palettes: [
                        ...document.settings.palettes,
                        { ...palette, id: `palette-${Date.now().toString(36)}`, name: `${palette.name} (copie)` },
                      ],
                    },
                  }, `palette-dup-${id}`);
                }}
              />
            ) : panel === "apps" ? (
              <div className="grid gap-3">
                <h2 className="text-sm font-semibold text-fg">Intégrations d’applications</h2>
                <p className="text-[0.72rem] leading-relaxed text-subtle">
                  Les app embeds s’ajoutent à toutes les pages. Les app blocks s’ajoutent dans une section compatible.
                </p>
                {appBlockList.length > 0 ? (
                  <div className="grid gap-1">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-faint">Blocs disponibles</p>
                    {appBlockList.map((block) => (
                      <div key={block.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg-soft px-3 py-2 text-[0.72rem]">
                        <span className="min-w-0 truncate">
                          {block.name} · {block.blockType}
                        </span>
                        <button
                          type="button"
                          className="h-8 shrink-0 rounded-lg border border-border px-2 text-[0.65rem] font-medium text-fg hover:border-brand-500"
                          onClick={() => addAppBlockSection(block)}
                        >
                          + Ajouter à la page
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="rounded-xl border border-dashed border-border p-3 text-[0.7rem] text-subtle">
                  Ajoute une application depuis le panneau de gauche. Une application sans embed ni bloc n’a aucun effet sur la vitrine.
                </p>
              </div>
            ) : selection?.kind === "template" ? (
              <div className="grid gap-4">
                <div>
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">Modèle</p>
                  <h2 className="mt-1 text-lg font-semibold">{currentTemplate?.name}</h2>
                  <p className="text-[0.72rem] text-subtle">{templateLabel(currentTemplate?.type ?? "index")} · {currentTemplate?.sections.length ?? 0} sections</p>
                </div>
                <label className="grid gap-1">
                  <span className="text-[0.6875rem] font-semibold text-subtle">Nom du modèle</span>
                  <input
                    className="h-10 rounded-xl border border-border bg-bg-soft px-3 text-[0.8rem] text-fg"
                    value={currentTemplate?.name ?? ""}
                    onChange={(event) => {
                      if (!currentTemplate) return;
                      commit({
                        ...document,
                        templates: document.templates.map((template) =>
                          template.id === currentTemplate.id ? { ...template, name: event.target.value } : template,
                        ),
                      }, `template-name-${currentTemplate.id}`);
                    }}
                  />
                </label>
                {resourceType ? (
                  <button
                    type="button"
                    className="h-10 rounded-xl border border-border text-[0.72rem] font-medium text-fg hover:border-brand-500"
                    onClick={() => setAssignModal(true)}
                  >
                    Appliquer ce modèle à un {resourceType === "product" ? "produit" : "collection"} ({assignedResources.length})
                  </button>
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-3 text-[0.7rem] text-subtle">
                    Les modèles de pages, blog et articles s’appliquent automatiquement à leur type de contenu.
                  </p>
                )}
                <p className="text-[0.7rem] leading-relaxed text-subtle">
                  Le modèle par défaut s’applique aux produits qui n’ont pas d’affectation spécifique. Tu peux créer un modèle « produit premium » et l’appliquer à un seul produit.
                </p>
              </div>
            ) : selectedSection && selectedBlock ? (
              <BlockSettingsPanel
                block={selectedBlock}
                context={fieldContext}
                onChange={updateBlock}
                onDelete={() => {
                  if (!selection || selection.kind !== "block") return;
                  updateSection({
                    ...selectedSection,
                    blocks: selectedSection.blocks.filter((block) => block.id !== selectedBlock.id),
                  });
                  setSelection({ kind: "section", area: selection.area, sectionId: selectedSection.id, templateId: selection.templateId });
                }}
              />
            ) : selectedSection ? (
              <SectionSettingsPanel
                section={selectedSection}
                context={fieldContext}
                onChange={updateSection}
                onDelete={() => {
                  if (!selection) return;
                  deleteSection(selection.area, selection.templateId, selectedSection.id);
                }}
                onDuplicate={() => {
                  if (!selection) return;
                  duplicateSection(selection.area, selection.templateId, selectedSection);
                }}
              />
            ) : (
              <div className="grid gap-3 text-[0.75rem] leading-relaxed text-subtle">
                <p className="text-sm font-semibold text-fg">Construis ta boutique</p>
                <p>Sélectionne une section dans la colonne de gauche ou clique directement dans l’aperçu.</p>
                <button type="button" className="h-10 rounded-xl border border-brand-500/40 bg-brand-500/10 text-[0.72rem] font-semibold text-brand-300" onClick={() => setLibraryOpen(true)}>
                  + Ajouter une section
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Barre mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-border bg-surface/95 backdrop-blur lg:hidden">
        {(["structure", "preview", "settings"] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            onClick={() => setMobilePane(pane)}
            className={cn(
              "flex min-h-12 items-center justify-center text-[0.7rem] font-semibold",
              mobilePane === pane ? "text-brand-300" : "text-subtle",
            )}
          >
            {pane === "structure" ? "Structure" : pane === "preview" ? "Aperçu" : "Paramètres"}
          </button>
        ))}
      </nav>

      {libraryOpen ? (
        <SectionLibraryModal
          available={
            libraryArea === "template"
              ? sectionsForTemplateType(currentTemplate?.type ?? "index")
              : SECTION_SCHEMAS.filter((schema) => schema.chrome === libraryArea).map((schema) => schema.type)
          }
          onClose={() => setLibraryOpen(false)}
          onAdd={(type) => addSection(type, libraryArea, libraryArea === "template" ? currentTemplate?.id : undefined)}
        />
      ) : null}

      {templateModal ? (
        <TemplateModal
          templates={document.templates}
          onClose={() => setTemplateModal(false)}
          onCreate={createTemplate}
        />
      ) : null}

      {assignModal && currentTemplate && resourceType ? (
        <AssignModal
          template={currentTemplate}
          items={assignableItems}
          assignments={assignmentList}
          resourceType={resourceType}
          onClose={() => setAssignModal(false)}
          onAssign={assignResource}
        />
      ) : null}

      {shortcutsOpen ? (
        <ShortcutsModal onClose={() => setShortcutsOpen(false)} />
      ) : null}

      {previewLink ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-5" onClick={() => setPreviewLink(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-5" onClick={(event) => event.stopPropagation()}>
            <h2 className="text-sm font-semibold text-fg">Lien d’aperçu partageable</h2>
            <p className="mt-1 text-[0.72rem] leading-relaxed text-subtle">Ce lien montre le brouillon sans publier. Il expire dans 7 jours.</p>
            <div className="mt-3 flex gap-2">
              <input readOnly className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-bg-soft px-3 text-[0.7rem] text-fg" value={previewLink} onFocus={(event) => event.target.select()} />
              <button type="button" className="h-10 rounded-xl bg-brand-500 px-3 text-[0.7rem] font-semibold text-white" onClick={async () => { await navigator.clipboard.writeText(previewLink); setToast("Lien copié."); }}>
                Copier
              </button>
            </div>
            <button type="button" className="mt-4 h-9 w-full rounded-xl border border-border text-[0.72rem] text-subtle" onClick={() => setPreviewLink(null)}>Fermer</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Barre supérieure
 * ------------------------------------------------------------------ */

function TopBar(props: {
  name: string;
  status: { status: "draft" | "published"; active: boolean };
  saveState: "idle" | "saving" | "saved" | "error";
  dirty: boolean;
  document: ThemeDocument;
  currentTemplate?: ThemeTemplate;
  templates: ThemeTemplate[];
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  selection: Selection;
  setSelection: (selection: Selection) => void;
  panel: Panel;
  setPanel: (panel: Panel) => void;
  themeCategory: ThemeSettingsCategory;
  setThemeCategory: (category: ThemeSettingsCategory) => void;
  device: Device;
  setDevice: (device: Device) => void;
  inspect: boolean;
  setInspect: (value: boolean) => void;
  market: string;
  setMarket: (value: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  save: (makeVersion?: boolean, announce?: boolean) => Promise<void>;
  publish: () => Promise<void>;
  duplicateTheme: () => Promise<void>;
  renameTheme: () => Promise<void>;
  resetTheme: () => void;
  downloadTheme: () => void;
  openPreview: () => Promise<void>;
  sharePreview: () => Promise<void>;
  setShortcutsOpen: (open: boolean) => void;
  locale: Locale;
  themeId: string;
  onTemplateModal: () => void;
  onAssign: () => void;
  onDeleteTemplate: (id: string) => void;
}) {
  const router = useRouter();
  const [themeMenu, setThemeMenu] = useState(false);
  const [templateMenu, setTemplateMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const groups: { label: string; types: ThemeTemplateType[] }[] = [
    { label: "Pages", types: ["index", "page", "404", "password"] },
    { label: "Produits", types: ["product"] },
    { label: "Collections", types: ["collection", "list-collections"] },
    { label: "Blog", types: ["blog", "article"] },
    { label: "Autres", types: ["search", "cart"] },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
        <div className="flex items-center gap-1">
          <Link href={`/${props.locale}/app/themes`} className="flex h-10 w-10 items-center justify-center rounded-xl text-subtle hover:bg-hairline hover:text-fg" aria-label="Retour aux thèmes">
            ‹
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            <button type="button" onClick={() => props.setPanel("sections")} className={cn("h-9 rounded-full px-3 text-[0.72rem] font-medium", props.panel === "sections" ? "bg-hairline text-fg" : "text-subtle hover:text-fg")}>Sections</button>
            <button type="button" onClick={() => props.setPanel("theme")} className={cn("h-9 rounded-full px-3 text-[0.72rem] font-medium", props.panel === "theme" ? "bg-hairline text-fg" : "text-subtle hover:text-fg")}>Paramètres du thème</button>
            <button type="button" onClick={() => props.setPanel("apps")} className={cn("h-9 rounded-full px-3 text-[0.72rem] font-medium", props.panel === "apps" ? "bg-hairline text-fg" : "text-subtle hover:text-fg")}>Intégrations</button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="relative">
            <button type="button" className="flex max-w-[220px] items-center gap-2 truncate text-[0.8rem] font-semibold text-fg" onClick={() => setThemeMenu((open) => !open)}>
              <span className="truncate">{props.name}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold", props.status.active ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300")}>
                {props.status.active ? "En ligne" : "Brouillon"}
              </span>
              <span className="hidden text-[0.65rem] text-subtle sm:inline">
                {props.saveState === "saving" ? "· Enregistrement…" : props.saveState === "error" ? "· Erreur" : props.dirty ? "· Modifié" : "· Sauvegardé"}
              </span>
            </button>
            {themeMenu ? (
              <div className="absolute left-0 top-11 z-50 w-60 rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
                {[
                  ["Renommer le thème", props.renameTheme],
                  ["Modifier le code (CSS personnalisé)", () => { props.setPanel("theme"); props.setThemeCategory("custom-css"); }],
                  ["Modifier le contenu du thème (traductions)", () => { props.setPanel("theme"); props.setThemeCategory("translations"); }],
                  ["Dupliquer le thème", props.duplicateTheme],
                  ["Voir l’historique des versions", () => { router.push(`/${props.locale}/app/themes/${props.themeId}/versions`); }],
                  ["Télécharger le thème", props.downloadTheme],
                  ["Partager l’aperçu", props.sharePreview],
                  ["Réinitialiser le thème", props.resetTheme],
                ].map(([label, action]) => (
                  <button key={label as string} type="button" className="block w-full rounded-lg px-2.5 py-2 text-left text-[0.72rem] text-subtle hover:bg-hairline hover:text-fg" onClick={() => { setThemeMenu(false); void (action as () => void)(); }}>
                    {label as string}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <select
            className="h-9 max-w-[120px] rounded-lg border border-border bg-bg-soft px-2 text-[0.68rem] text-fg"
            value={props.market}
            onChange={(event) => props.setMarket(event.target.value)}
            title="Marché d’aperçu"
          >
            <option value="all">Tous les marchés</option>
            <option value="ML">Mali</option>
            <option value="SN">Sénégal</option>
            <option value="CI">Côte d’Ivoire</option>
            <option value="GH">Ghana</option>
            <option value="FR">France</option>
            <option value="INT">International</option>
          </select>

          <div className="relative">
            <button type="button" className="h-9 max-w-[160px] truncate rounded-lg border border-border bg-bg-soft px-2 text-[0.68rem] text-fg" onClick={() => setTemplateMenu((open) => !open)}>
              {props.currentTemplate?.name ?? "Modèle"} ▾
            </button>
            {templateMenu ? (
              <div className="absolute right-0 top-11 z-50 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
                {groups.map((group) => {
                  const templates = props.templates.filter((template) => group.types.includes(template.type));
                  if (templates.length === 0) return null;
                  return (
                    <div key={group.label} className="mb-1">
                      <p className="px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-faint">{group.label}</p>
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          className={cn("block w-full rounded-lg px-2.5 py-1.5 text-left text-[0.7rem]", template.id === props.selectedTemplateId ? "bg-brand-500/15 text-brand-300" : "text-subtle hover:bg-hairline hover:text-fg")}
                          onClick={() => {
                            props.setSelectedTemplateId(template.id);
                            props.setSelection({ kind: "template", templateId: template.id });
                            setTemplateMenu(false);
                          }}
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  );
                })}
                <div className="border-t border-border pt-1">
                  <button type="button" className="block w-full rounded-lg px-2.5 py-2 text-left text-[0.7rem] font-semibold text-brand-300" onClick={() => { props.onTemplateModal(); setTemplateMenu(false); }}>+ Créer un modèle</button>
                  {props.currentTemplate && props.currentTemplate.type !== "index" ? (
                    <button type="button" className="block w-full rounded-lg px-2.5 py-2 text-left text-[0.7rem] text-red-400" onClick={() => { props.onDeleteTemplate(props.currentTemplate!.id); setTemplateMenu(false); }}>Supprimer ce modèle</button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={props.undo} disabled={!props.canUndo} className="hidden h-9 w-9 rounded-lg text-subtle hover:bg-hairline hover:text-fg disabled:opacity-30 sm:block" title="Annuler (Ctrl+Z)">↶</button>
          <button type="button" onClick={props.redo} disabled={!props.canRedo} className="hidden h-9 w-9 rounded-lg text-subtle hover:bg-hairline hover:text-fg disabled:opacity-30 sm:block" title="Rétablir (Ctrl+Y)">↷</button>
          <button type="button" onClick={() => props.setInspect(!props.inspect)} className={cn("hidden h-9 rounded-lg px-2 text-[0.65rem] font-semibold sm:block", props.inspect ? "bg-brand-500/15 text-brand-300" : "text-subtle hover:text-fg")} title="Inspecteur">Inspecter</button>
          <div className="hidden items-center gap-0.5 rounded-lg border border-border p-0.5 sm:flex">
            {(["desktop", "tablet", "mobile"] as const).map((entry) => (
              <button key={entry} type="button" onClick={() => props.setDevice(entry)} className={cn("h-8 rounded-md px-2 text-[0.62rem]", props.device === entry ? "bg-hairline text-fg" : "text-subtle")} title={entry === "desktop" ? "Ordinateur" : entry === "tablet" ? "Tablette" : "Mobile"}>
                {entry === "desktop" ? "🖥" : entry === "tablet" ? "▭" : "▯"}
              </button>
            ))}
          </div>
          <button type="button" onClick={props.openPreview} className="hidden h-9 rounded-lg border border-border px-2.5 text-[0.65rem] font-medium text-subtle hover:text-fg md:block">Aperçu</button>
          <button type="button" onClick={() => props.save(false, true)} className="h-9 rounded-lg border border-border px-2.5 text-[0.65rem] font-semibold text-fg">Enregistrer</button>
          <button type="button" onClick={props.publish} className="h-9 rounded-lg bg-brand-500 px-2.5 text-[0.65rem] font-semibold text-white hover:bg-brand-600">Publier</button>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg text-subtle md:hidden" onClick={() => setMobileMenu((open) => !open)}>☰</button>
        </div>
      </div>

      {mobileMenu ? (
        <div className="grid gap-1 border-t border-border p-3 md:hidden">
          <div className="grid grid-cols-3 gap-1">
            <button type="button" onClick={() => { props.setPanel("sections"); setMobileMenu(false); }} className="h-10 rounded-lg border border-border text-[0.68rem]">Sections</button>
            <button type="button" onClick={() => { props.setPanel("theme"); setMobileMenu(false); }} className="h-10 rounded-lg border border-border text-[0.68rem]">Thème</button>
            <button type="button" onClick={() => { props.setPanel("apps"); setMobileMenu(false); }} className="h-10 rounded-lg border border-border text-[0.68rem]">Apps</button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["desktop", "tablet", "mobile"] as const).map((entry) => (
              <button key={entry} type="button" onClick={() => props.setDevice(entry)} className={cn("h-10 rounded-lg border text-[0.68rem]", props.device === entry ? "border-brand-500 text-brand-300" : "border-border text-subtle")}>{entry === "desktop" ? "Ordinateur" : entry === "tablet" ? "Tablette" : "Mobile"}</button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button type="button" onClick={props.undo} className="h-10 rounded-lg border border-border text-[0.68rem]">Annuler</button>
            <button type="button" onClick={props.redo} className="h-10 rounded-lg border border-border text-[0.68rem]">Rétablir</button>
            <button type="button" onClick={props.openPreview} className="h-10 rounded-lg border border-border text-[0.68rem]">Aperçu</button>
            <button type="button" onClick={() => props.setShortcutsOpen(true)} className="h-10 rounded-lg border border-border text-[0.68rem]">Aide</button>
          </div>
        </div>
      ) : null}
    </header>
  );
}

/* ------------------------------------------------------------------ *
 *  Panneau gauche
 * ------------------------------------------------------------------ */

function LeftPanel(props: {
  document: ThemeDocument;
  panel: Panel;
  setPanel: (panel: Panel) => void;
  themeCategory: ThemeSettingsCategory;
  setThemeCategory: (category: ThemeSettingsCategory) => void;
  currentTemplate?: ThemeTemplate;
  selection: Selection;
  setSelection: (selection: Selection) => void;
  onMoveSection: (area: SectionArea, templateId: string | undefined, sectionId: string, delta: number) => void;
  onDuplicateSection: (area: SectionArea, templateId: string | undefined, section: ThemeSectionInstance) => void;
  onDeleteSection: (area: SectionArea, templateId: string | undefined, sectionId: string) => void;
  onToggleSection: (area: SectionArea, templateId: string | undefined, section: ThemeSectionInstance) => void;
  onAddSection: (type: string, area: SectionArea, templateId?: string) => void;
  onAddBlock: (section: ThemeSectionInstance, type: string) => void;
  onRenameSection: (area: SectionArea, templateId: string | undefined, section: ThemeSectionInstance, name: string) => void;
  onMoveBlock: (area: SectionArea, templateId: string | undefined, sectionId: string, blockId: string, delta: number) => void;
  onDuplicateBlock: (area: SectionArea, templateId: string | undefined, section: ThemeSectionInstance, block: ThemeBlockInstance) => void;
  onToggleBlock: (area: SectionArea, templateId: string | undefined, sectionId: string, block: ThemeBlockInstance) => void;
  onRenameBlock: (area: SectionArea, templateId: string | undefined, sectionId: string, block: ThemeBlockInstance, name: string) => void;
  onDeleteBlock: (area: SectionArea, templateId: string | undefined, sectionId: string, blockId: string) => void;
  onMoveBlockToSection: (area: SectionArea, templateId: string | undefined, fromSectionId: string, blockId: string, toSectionId: string) => void;
  onOpenLibrary: (area: SectionArea) => void;
  appList: ThemeAppEmbed[];
  appBlockList: ThemeAppBlock[];
  onToggleApp: (embed: ThemeAppEmbed) => void;
  onAddApp: () => void;
  assignedResources: ThemeAssignment[];
  products: ThemeProductCard[];
  onAssign: () => void;
}) {
  type DragItem =
    | { kind: "section"; area: SectionArea; id: string; templateId?: string }
    | { kind: "block"; area: SectionArea; id: string; templateId?: string; sectionId: string };

  const [drag, setDrag] = useState<DragItem | null>(null);
  const [touchDrag, setTouchDrag] = useState<DragItem | null>(null);

  useEffect(() => {
    if (!touchDrag) return;

    const move = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY);
      if (!element) return;

      // Glisser un bloc : on cible une autre ligne de bloc ou une section.
      if (touchDrag.kind === "block") {
        const blockRow = element.closest("[data-block-row]") as HTMLElement | null;
        const sectionRow = element.closest("[data-section-row]") as HTMLElement | null;
        const area = (blockRow ?? sectionRow)?.getAttribute("data-area") as SectionArea | null;
        const templateId = (blockRow ?? sectionRow)?.getAttribute("data-template-id") ?? "";
        if (!area || area !== touchDrag.area || templateId !== (touchDrag.templateId ?? "")) return;

        const targetSectionId = blockRow
          ? blockRow.getAttribute("data-section-id")
          : sectionRow?.getAttribute("data-section-id") ?? null;
        if (!targetSectionId) return;

        event.preventDefault();
        if (targetSectionId !== touchDrag.sectionId) {
          props.onMoveBlockToSection(touchDrag.area, touchDrag.templateId, touchDrag.sectionId, touchDrag.id, targetSectionId);
          setTouchDrag(null);
          return;
        }
        if (!blockRow) return;
        const targetBlockId = blockRow.getAttribute("data-block-id");
        if (!targetBlockId || targetBlockId === touchDrag.id) return;
        const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-block-row]")).filter(
          (entry) =>
            entry.getAttribute("data-section-id") === touchDrag.sectionId &&
            entry.getAttribute("data-area") === touchDrag.area &&
            (entry.getAttribute("data-template-id") ?? "") === (touchDrag.templateId ?? ""),
        );
        const from = rows.findIndex((entry) => entry.getAttribute("data-block-id") === touchDrag.id);
        const to = rows.findIndex((entry) => entry.getAttribute("data-block-id") === targetBlockId);
        if (from < 0 || to < 0) return;
        props.onMoveBlock(touchDrag.area, touchDrag.templateId, touchDrag.sectionId, touchDrag.id, to - from);
        return;
      }

      const row = element.closest("[data-section-row]") as HTMLElement | null;
      if (!row) return;

      const area = row.getAttribute("data-area") as SectionArea | null;
      const templateId = row.getAttribute("data-template-id") ?? "";
      const targetId = row.getAttribute("data-section-id");
      if (!area || !targetId || area !== touchDrag.area || templateId !== (touchDrag.templateId ?? "")) return;
      if (targetId === touchDrag.id) return;

      const rows = Array.from(
        document.querySelectorAll<HTMLElement>("[data-section-row]"),
      ).filter(
        (entry) =>
          entry.getAttribute("data-area") === touchDrag.area &&
          (entry.getAttribute("data-template-id") ?? "") === (touchDrag.templateId ?? ""),
      );
      const from = rows.findIndex((entry) => entry.getAttribute("data-section-id") === touchDrag.id);
      const to = rows.findIndex((entry) => entry.getAttribute("data-section-id") === targetId);
      if (from < 0 || to < 0) return;

      event.preventDefault();
      props.onMoveSection(touchDrag.area, touchDrag.templateId, touchDrag.id, to - from);
    };

    const end = () => setTouchDrag(null);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [touchDrag, props]);

  if (props.panel === "theme") {
    return (
      <div className="p-3">
        <p className="px-2 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">Paramètres du thème</p>
        <div className="grid gap-0.5">
          {THEME_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => props.setThemeCategory(category.id)}
              className={cn("flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-left text-[0.75rem]", props.themeCategory === category.id ? "bg-brand-500/15 text-brand-200" : "text-subtle hover:bg-hairline hover:text-fg")}
            >
              <span>{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (props.panel === "apps") {
    return (
      <div className="grid gap-2 p-3">
        <p className="px-2 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-faint">App embeds</p>
        {props.appList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-3 text-[0.7rem] leading-relaxed text-subtle">Aucune application installée. Ajoute un embed pour afficher un widget sur la vitrine.</p>
        ) : (
          props.appList.map((embed) => (
            <div key={embed.appId} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-bg-soft px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[0.75rem] font-medium text-fg">{embed.name}</p>
                <p className="truncate text-[0.62rem] text-faint">{embed.appId}</p>
              </div>
              <button type="button" role="switch" aria-checked={embed.enabled} onClick={() => props.onToggleApp(embed)} className={cn("h-6 w-10 shrink-0 rounded-full", embed.enabled ? "bg-brand-500" : "bg-border")}>
                <span className={cn("block h-5 w-5 rounded-full bg-white transition-transform", embed.enabled ? "translate-x-4" : "translate-x-0.5")} />
              </button>
            </div>
          ))
        )}
        <button type="button" onClick={props.onAddApp} className="h-10 rounded-xl border border-dashed border-border text-[0.7rem] font-medium text-subtle hover:border-brand-500 hover:text-fg">+ Ajouter une application</button>
      </div>
    );
  }

  const renderGroup = (area: SectionArea, label: string, sections: ThemeSectionInstance[], templateId?: string) => (
    <div className="mb-3">
      <div className="flex items-center justify-between px-2 py-1.5">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-faint">{label}</p>
        <span className="flex items-center gap-1 text-[0.6rem] text-faint">
          {sections.length}
          {area !== "template" ? (
            <button type="button" className="h-6 w-6 rounded-md text-[0.7rem] hover:bg-hairline hover:text-fg" title="Ajouter une section" onClick={() => props.onOpenLibrary(area)}>+</button>
          ) : null}
        </span>
      </div>
      <div className="grid gap-0.5">
        {sections.map((section, index) => (
          <div key={section.id}>
            <div
              data-section-row
              data-section-id={section.id}
              data-area={area}
              data-template-id={templateId ?? ""}
              draggable
              onDragStart={(event: DragEvent) => {
                event.stopPropagation();
                setDrag({ kind: "section", area, id: section.id, templateId });
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (!drag || drag.area !== area || drag.templateId !== templateId) return;
                if (drag.kind === "block") {
                  props.onMoveBlockToSection(area, templateId, drag.sectionId, drag.id, section.id);
                  setDrag(null);
                  return;
                }
                const from = sections.findIndex((entry) => entry.id === drag.id);
                if (from < 0 || from === index) return;
                props.onMoveSection(area, templateId, drag.id, index - from);
                setDrag(null);
              }}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-1 py-0.5",
                props.selection?.kind === "section" && props.selection.sectionId === section.id ? "bg-brand-500/15" : "hover:bg-hairline",
              )}
            >
              <span
                className="cursor-grab px-1 text-[0.65rem] text-faint"
                title="Glisser pour réordonner"
                style={{ touchAction: "none" }}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse") return;
                  event.preventDefault();
                  setTouchDrag({ kind: "section", area, id: section.id, templateId });
                }}
              >⠿</span>
              <button
                type="button"
                className="min-w-0 flex-1 truncate py-1.5 text-left text-[0.72rem] font-medium text-fg"
                onClick={() => props.setSelection({ kind: "section", area, sectionId: section.id, templateId })}
              >
                {section.name}
              </button>
              <button
                type="button"
                className={cn("h-7 w-6 text-[0.65rem]", section.visible ? "text-faint" : "text-amber-400")}
                title={section.visible ? "Masquer" : "Afficher"}
                onClick={() => props.onToggleSection(area, templateId, section)}
              >
                {section.visible ? "👁" : "—"}
              </button>
              <SectionMenu
                onUp={() => props.onMoveSection(area, templateId, section.id, -1)}
                onDown={() => props.onMoveSection(area, templateId, section.id, 1)}
                onDuplicate={() => props.onDuplicateSection(area, templateId, section)}
                onDelete={() => props.onDeleteSection(area, templateId, section.id)}
                onRename={() => {
                  const next = window.prompt("Nom de la section", section.name);
                  if (next) props.onRenameSection(area, templateId, section, next);
                }}
              />
            </div>

            {props.selection && (props.selection.kind === "section" || props.selection.kind === "block") && props.selection.sectionId === section.id ? (
              <div className="ml-4 grid gap-0.5 border-l border-border pl-2">
                {section.blocks.map((block, blockIndex) => (
                  <div
                    key={block.id}
                    data-block-row
                    data-block-id={block.id}
                    data-section-id={section.id}
                    data-area={area}
                    data-template-id={templateId ?? ""}
                    draggable
                    onDragStart={(event: DragEvent) => {
                      event.stopPropagation();
                      setDrag({ kind: "block", area, id: block.id, sectionId: section.id, templateId });
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!drag || drag.kind !== "block" || drag.area !== area || drag.templateId !== templateId) return;
                      if (drag.sectionId !== section.id) {
                        props.onMoveBlockToSection(area, templateId, drag.sectionId, drag.id, section.id);
                        setDrag(null);
                        return;
                      }
                      if (drag.id === block.id) return;
                      props.onMoveBlock(area, templateId, section.id, drag.id, blockIndex - section.blocks.findIndex((entry) => entry.id === drag.id));
                      setDrag(null);
                    }}
                    className={cn("group flex items-center gap-1 rounded-md px-1", props.selection?.kind === "block" && props.selection.blockId === block.id ? "bg-brand-500/10" : "hover:bg-hairline")}
                  >
                    <span
                      className="cursor-grab px-0.5 text-[0.6rem] text-faint"
                      title="Glisser le bloc · déposer sur une section compatible"
                      style={{ touchAction: "none" }}
                      onPointerDown={(event) => {
                        if (event.pointerType === "mouse") return;
                        event.preventDefault();
                        event.stopPropagation();
                        setTouchDrag({ kind: "block", area, id: block.id, sectionId: section.id, templateId });
                      }}
                    >⠿</span>
                    <button type="button" className="min-w-0 flex-1 truncate py-1 text-left text-[0.66rem] text-subtle" onClick={() => props.setSelection({ kind: "block", area, sectionId: section.id, blockId: block.id, templateId })}>
                      {block.name || getBlockSchema(block.type)?.label || block.type}
                      {!block.visible ? " · masqué" : ""}
                    </button>
                    <button
                      type="button"
                      className={cn("h-6 w-5 text-[0.6rem]", block.visible ? "text-faint" : "text-amber-400")}
                      title={block.visible ? "Masquer le bloc" : "Afficher le bloc"}
                      onClick={() => props.onToggleBlock(area, templateId, section.id, block)}
                    >
                      {block.visible ? "👁" : "—"}
                    </button>
                    <BlockMenu
                      onUp={() => props.onMoveBlock(area, templateId, section.id, block.id, -1)}
                      onDown={() => props.onMoveBlock(area, templateId, section.id, block.id, 1)}
                      onDuplicate={() => props.onDuplicateBlock(area, templateId, section, block)}
                      onRename={() => {
                        const next = window.prompt("Nom du bloc", block.name || getBlockSchema(block.type)?.label || block.type);
                        if (next !== null) props.onRenameBlock(area, templateId, section.id, block, next);
                      }}
                      onDelete={() => props.onDeleteBlock(area, templateId, section.id, block.id)}
                    />
                  </div>
                ))}
                {getSectionSchema(section.type)?.blocks ? (
                  <div className="flex flex-wrap gap-1 py-1">
                    {blockTypesForSection(section.type).map((type) => (
                      <button
                        key={type}
                        type="button"
                        className="rounded-md border border-border px-1.5 py-0.5 text-[0.58rem] text-subtle hover:border-brand-500 hover:text-fg"
                        onClick={() => props.onAddBlock(section, type)}
                      >
                        + {getBlockSchema(type)?.label ?? type}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-3">
      {renderGroup("header", "En-tête", props.document.header)}
      <div className="mb-1 flex items-center justify-between px-2 py-1.5">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-faint">Modèle de page</p>
        <span className="text-[0.6rem] text-faint">{props.currentTemplate?.sections.length ?? 0}/25</span>
      </div>
      {renderGroup("template", props.currentTemplate?.name ?? "Page", props.currentTemplate?.sections ?? [], props.currentTemplate?.id)}
      <button type="button" onClick={() => props.onOpenLibrary("template")} className="mb-4 h-10 w-full rounded-xl border border-dashed border-border text-[0.7rem] font-medium text-subtle hover:border-brand-500 hover:text-fg">+ Ajouter une section</button>
      {renderGroup("footer", "Pied de page", props.document.footer)}
      <div className="rounded-xl border border-border bg-bg-soft p-2.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-faint">Modèles appliqués</p>
        <p className="mt-1 text-[0.66rem] leading-relaxed text-subtle">{props.assignedResources.length} élément(s) utilisent « {props.currentTemplate?.name} ».</p>
        <button type="button" onClick={props.onAssign} className="mt-2 h-9 w-full rounded-lg border border-border text-[0.65rem] font-medium text-fg">Appliquer le modèle</button>
      </div>
    </div>
  );
}

function SectionMenu({
  onUp,
  onDown,
  onDuplicate,
  onDelete,
  onRename,
}: {
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="h-7 w-6 text-[0.7rem] text-faint" onClick={() => setOpen((value) => !value)} title="Menu">⋮</button>
      {open ? (
        <div className="absolute right-0 top-7 z-50 w-44 rounded-xl border border-border bg-surface p-1 shadow-2xl">
          {[
            ["Renommer", onRename],
            ["Déplacer vers le haut", onUp],
            ["Déplacer vers le bas", onDown],
            ["Dupliquer", onDuplicate],
          ].map(([label, action]) => (
            <button key={label as string} type="button" className="block w-full rounded-lg px-2 py-1.5 text-left text-[0.68rem] text-subtle hover:bg-hairline hover:text-fg" onClick={() => { setOpen(false); (action as () => void)(); }}>{label as string}</button>
          ))}
          <div className="my-1 h-px bg-border" />
          <button type="button" className="block w-full rounded-lg px-2 py-1.5 text-left text-[0.68rem] text-red-400 hover:bg-hairline" onClick={() => { setOpen(false); onDelete(); }}>Supprimer</button>
        </div>
      ) : null}
    </div>
  );
}

function BlockMenu({
  onUp,
  onDown,
  onDuplicate,
  onDelete,
  onRename,
}: {
  onUp: () => void;
  onDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" className="h-6 w-5 text-[0.65rem] text-faint" onClick={() => setOpen((value) => !value)} title="Menu du bloc">⋮</button>
      {open ? (
        <div className="absolute right-0 top-6 z-50 w-44 rounded-xl border border-border bg-surface p-1 shadow-2xl">
          {[
            ["Renommer", onRename],
            ["Déplacer vers le haut", onUp],
            ["Déplacer vers le bas", onDown],
            ["Dupliquer", onDuplicate],
          ].map(([label, action]) => (
            <button key={label as string} type="button" className="block w-full rounded-lg px-2 py-1.5 text-left text-[0.68rem] text-subtle hover:bg-hairline hover:text-fg" onClick={() => { setOpen(false); (action as () => void)(); }}>{label as string}</button>
          ))}
          <div className="my-1 h-px bg-border" />
          <button type="button" className="block w-full rounded-lg px-2 py-1.5 text-left text-[0.68rem] text-red-400 hover:bg-hairline" onClick={() => { setOpen(false); onDelete(); }}>Supprimer</button>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Aperçu
 * ------------------------------------------------------------------ */

function PreviewPane({
  document,
  context,
  templateId,
  device,
  inspect,
  market,
  selection,
  onSelectSection,
  onSelectBlock,
}: {
  document: ThemeDocument;
  context: ThemeRenderContext;
  templateId: string;
  device: Device;
  inspect: boolean;
  market: string;
  selection: Selection;
  onSelectSection: (id: string) => void;
  onSelectBlock: (sectionId: string, blockId: string) => void;
}) {
  const width = device === "desktop" ? 1440 : device === "tablet" ? 768 : 390;
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.5);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const element = outerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const available = element.clientWidth - 16;
      setScale(Math.min(1, Math.max(0.2, available / width)));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [width]);

  useEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setHeight(element.scrollHeight));
    observer.observe(element);
    setHeight(element.scrollHeight);
    return () => observer.disconnect();
  }, [templateId, device, document]);

  const selectedSectionId =
    selection?.kind === "section" || selection?.kind === "block" ? selection.sectionId : null;
  const selectedBlockId = selection?.kind === "block" ? selection.blockId : null;

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-faint">
          Aperçu · {device === "desktop" ? "1440 px" : device === "tablet" ? "768 px" : "390 px"}
        </p>
        <p className="text-[0.62rem] text-faint">{inspect ? "Clique pour sélectionner" : "Navigation libre"}</p>
      </div>
      <div ref={outerRef} className="overflow-hidden rounded-2xl border border-border bg-white" style={{ height: Math.max(400, height * scale) }}>
        <div
          ref={innerRef}
          style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <ThemeDocumentRenderer
            document={document}
            context={context}
            templateId={templateId}
            flags={{
              editable: inspect,
              selectedSectionId,
              selectedBlockId,
              onSelectSection,
              onSelectBlock,
              device,
              market,
            }}
          />
        </div>
      </div>
      <p className="px-1 text-center text-[0.6rem] text-faint">
        Glisse une section dans la colonne de gauche pour la réordonner · Molette pour défiler la page.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 *  Modales
 * ------------------------------------------------------------------ */

function SectionLibraryModal({
  available,
  onClose,
  onAdd,
}: {
  available: string[];
  onClose: () => void;
  onAdd: (type: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const schemas = SECTION_SCHEMAS.filter(
    (schema) =>
      available.includes(schema.type) &&
      (category === "all" || schema.category === category) &&
      (query.trim() === "" || schema.label.toLowerCase().includes(query.toLowerCase())),
  );

  const categories = [
    ["all", "Tout"],
    ["banner", "Bannières"],
    ["content", "Contenu"],
    ["commerce", "Commerce"],
    ["marketing", "Marketing"],
    ["advanced", "Avancé"],
    ["header", "En-tête"],
    ["footer", "Pied de page"],
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-5" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-surface p-4 sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-fg">Ajouter une section</h2>
          <button type="button" className="h-9 w-9 rounded-lg border border-border text-subtle" onClick={onClose}>✕</button>
        </div>
        <input className="mt-3 h-10 w-full rounded-xl border border-border bg-bg-soft px-3 text-[0.8rem] text-fg" placeholder="Rechercher une section…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="mt-2 flex flex-wrap gap-1">
          {categories.map(([value, label]) => (
            <button key={value} type="button" onClick={() => setCategory(value)} className={cn("rounded-full px-2.5 py-1 text-[0.65rem]", category === value ? "bg-brand-500 text-white" : "border border-border text-subtle")}>{label}</button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {schemas.map((schema) => (
            <button key={schema.type} type="button" className="rounded-xl border border-border bg-bg-soft p-3 text-left hover:border-brand-500" onClick={() => onAdd(schema.type)}>
              <span className="block text-[0.78rem] font-semibold text-fg">{schema.label}</span>
              <span className="mt-0.5 block text-[0.65rem] leading-relaxed text-subtle">{schema.description ?? sectionCategoryLabel(schema.category)}</span>
            </button>
          ))}
        </div>
        {schemas.length === 0 ? <p className="mt-4 text-center text-[0.75rem] text-subtle">Aucune section ne correspond.</p> : null}
      </div>
    </div>
  );
}

function TemplateModal({
  templates,
  onClose,
  onCreate,
}: {
  templates: ThemeTemplate[];
  onClose: () => void;
  onCreate: (type: ThemeTemplateType, name: string, baseId: string) => void;
}) {
  const [type, setType] = useState<ThemeTemplateType>("product");
  const [name, setName] = useState("Produit premium");
  const [baseId, setBaseId] = useState(templates.find((template) => template.type === "product")?.id ?? templates[0]?.id ?? "");

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-sm font-semibold text-fg">Créer un modèle</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="text-[0.68rem] font-semibold text-subtle">Type de page</span>
            <select className="h-10 rounded-xl border border-border bg-bg-soft px-3 text-[0.78rem] text-fg" value={type} onChange={(event) => setType(event.target.value as ThemeTemplateType)}>
              {TEMPLATE_TYPES.map((entry) => <option key={entry} value={entry}>{templateLabel(entry)}</option>)}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-[0.68rem] font-semibold text-subtle">Nom du modèle</span>
            <input className="h-10 rounded-xl border border-border bg-bg-soft px-3 text-[0.78rem] text-fg" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="grid gap-1">
            <span className="text-[0.68rem] font-semibold text-subtle">Basé sur</span>
            <select className="h-10 rounded-xl border border-border bg-bg-soft px-3 text-[0.78rem] text-fg" value={baseId} onChange={(event) => setBaseId(event.target.value)}>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name} ({templateLabel(template.type)})</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" className="h-10 flex-1 rounded-xl bg-brand-500 text-[0.75rem] font-semibold text-white" onClick={() => onCreate(type, name, baseId)}>Créer le modèle</button>
          <button type="button" className="h-10 rounded-xl border border-border px-4 text-[0.75rem] text-subtle" onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function AssignModal({
  template,
  items,
  assignments,
  resourceType,
  onClose,
  onAssign,
}: {
  template: ThemeTemplate;
  items: { id: string; name: string }[];
  assignments: ThemeAssignment[];
  resourceType: "product" | "collection";
  onClose: () => void;
  onAssign: (resourceId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-5" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-sm font-semibold text-fg">Appliquer « {template.name} »</h2>
        <p className="mt-1 text-[0.7rem] leading-relaxed text-subtle">Choisis {resourceType === "product" ? "le produit" : "la collection"} qui utilisera ce modèle. Les autres gardent le modèle par défaut.</p>
        <input className="mt-3 h-10 w-full rounded-xl border border-border bg-bg-soft px-3 text-[0.8rem] text-fg" placeholder="Rechercher un produit…" value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className="mt-2 grid gap-1">
          {filtered.map((item) => {
            const assigned = assignments.some((entry) => entry.resourceType === resourceType && entry.resourceId === item.id && entry.templateKey === template.id);
            return (
              <button
                key={item.id}
                type="button"
                disabled={busy}
                className={cn("flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left", assigned ? "border-brand-500 bg-brand-500/10" : "border-border hover:border-brand-500")}
                onClick={async () => {
                  setBusy(true);
                  await onAssign(item.id);
                  setBusy(false);
                }}
              >
                <span className="min-w-0 truncate text-[0.75rem] text-fg">{item.name}</span>
                <span className="text-[0.62rem] text-subtle">{assigned ? "Appliqué" : "Appliquer"}</span>
              </button>
            );
          })}
          {filtered.length === 0 ? <p className="py-4 text-center text-[0.72rem] text-subtle">Aucun élément trouvé.</p> : null}
        </div>
        <button type="button" className="mt-4 h-10 w-full rounded-xl border border-border text-[0.75rem] text-subtle" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ["Ctrl / Cmd + Z", "Annuler"],
    ["Ctrl / Cmd + Y", "Rétablir"],
    ["Ctrl / Cmd + S", "Enregistrer et créer une version"],
    ["Ctrl / Cmd + /", "Afficher les raccourcis"],
    ["Maj + → / ↓", "Section suivante"],
    ["Maj + ← / ↑", "Section précédente"],
    ["Échap", "Fermer une fenêtre"],
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5" onClick={(event) => event.stopPropagation()}>
        <h2 className="text-sm font-semibold text-fg">Raccourcis clavier</h2>
        <div className="mt-3 grid gap-1.5">
          {shortcuts.map(([keys, label]) => (
            <div key={keys} className="flex items-center justify-between gap-3 text-[0.72rem]">
              <span className="text-subtle">{label}</span>
              <kbd className="rounded-md border border-border bg-bg-soft px-2 py-0.5 text-[0.62rem] text-fg">{keys}</kbd>
            </div>
          ))}
        </div>
        <button type="button" className="mt-4 h-9 w-full rounded-xl border border-border text-[0.72rem] text-subtle" onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}
