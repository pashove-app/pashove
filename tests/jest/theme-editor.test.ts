import {
  createThemeDocument,
  newSection,
  sectionsForTemplateType,
} from "@/lib/theme-editor/defaults";
import {
  MAX_SECTIONS_PER_TEMPLATE,
  normalizeDocument,
  normalizeSettings,
} from "@/lib/theme-editor/normalize";
import { getSectionSchema } from "@/lib/theme-editor/schema";

describe("document de thème", () => {
  it("crée un document avec tous les modèles par défaut", () => {
    const document = createThemeDocument("dawn");
    const types = document.templates.map((template) => template.type);

    expect(types).toEqual(
      expect.arrayContaining([
        "index",
        "product",
        "collection",
        "page",
        "blog",
        "article",
        "search",
        "cart",
        "404",
        "password",
      ]),
    );
    expect(document.header.length).toBeGreaterThan(0);
    expect(document.footer.length).toBeGreaterThan(0);
  });

  it("applique la palette et la typographie du preset", () => {
    const mode = createThemeDocument("mode");
    expect(mode.settings.headingFont).toBe("serif");
    expect(mode.settings.activePaletteId).toBe("palette-mode");
    expect(mode.settings.palettes[0].background).toBe("#F6F1E8");
  });

  it("refuse un document sans modèle d’accueil", () => {
    expect(normalizeDocument({ settings: {}, templates: [], header: [], footer: [] })).toBeNull();
  });

  it("borne le nombre de sections et supprime les types inconnus", () => {
    const sections = Array.from({ length: MAX_SECTIONS_PER_TEMPLATE + 8 }, (_, index) => ({
      id: `section-${index}`,
      type: index === 0 ? "inconnue" : "rich-text",
      name: "Section",
      visible: true,
      settings: {},
      blocks: [],
    }));

    const normalized = normalizeDocument({
      settings: {},
      header: [],
      footer: [],
      templates: [
        {
          id: "index",
          type: "index",
          name: "Accueil",
          sections,
        },
      ],
    });

    expect(normalized).not.toBeNull();
    expect(normalized!.templates[0].sections.length).toBe(MAX_SECTIONS_PER_TEMPLATE - 1);
  });

  it("conserve une connexion à un méta-champ", () => {
    const document = createThemeDocument("dawn");
    document.templates[0].sections[0].settings.heading = {
      $metafield: {
        owner: "product",
        namespace: "custom",
        key: "delai_livraison",
        fallback: "Livraison sous 48 h",
      },
    };

    const normalized = normalizeDocument(document);
    expect(normalized).not.toBeNull();
    expect(normalized!.templates[0].sections[0].settings.heading).toEqual({
      $metafield: {
        owner: "product",
        namespace: "custom",
        key: "delai_livraison",
        fallback: "Livraison sous 48 h",
      },
    });
  });

  it("conserve le nom personnalisé d’un bloc et son ordre", () => {
    const section = newSection("testimonials");
    section.blocks = [
      { id: "bloc-1", type: "testimonial", name: "Avis principal", visible: true, settings: { name: "Awa", text: "Parfait" } },
      { id: "bloc-2", type: "testimonial", name: "Avis secondaire", visible: false, settings: { name: "Koffi", text: "Rapide" } },
    ];

    const normalized = normalizeDocument({
      settings: {},
      header: [],
      footer: [],
      templates: [{ id: "index", type: "index", name: "Accueil", sections: [section] }],
    });

    const blocks = normalized!.templates[0].sections[0].blocks;
    expect(blocks.map((block) => block.name)).toEqual(["Avis principal", "Avis secondaire"]);
    expect(blocks[1].visible).toBe(false);
  });

  it("ignore les blocs d’un type non autorisé dans la section", () => {
    const section = newSection("image-banner");
    section.blocks = [
      {
        id: "bloc-faq",
        type: "faq",
        visible: true,
        settings: { question: "Question", answer: "Réponse" },
      },
    ];

    const normalized = normalizeDocument({
      settings: {},
      header: [],
      footer: [],
      templates: [
        { id: "index", type: "index", name: "Accueil", sections: [section] },
      ],
    });

    expect(normalized!.templates[0].sections[0].blocks).toHaveLength(0);
  });

  it("normalise les couleurs et les bornes des réglages", () => {
    const settings = normalizeSettings({
      palettes: [
        {
          id: "p",
          name: "Test",
          background: "pas-une-couleur",
          text: "#fff",
          muted: "#FFFFFF",
          accent: "#2F5CFF",
          buttonBg: "#2F5CFF",
          buttonText: "#FFFFFF",
          border: "#1A2131",
          badgePromo: "#2F5CFF",
          badgeSoldOut: "#6B7280",
          badgeNew: "#10B981",
        },
      ],
      typeScale: 99,
      baseFontSize: 2,
      cartType: "nimporte-quoi",
    });

    expect(settings.palettes[0].background).toBe("#04060D");
    expect(settings.typeScale).toBe(2);
    expect(settings.baseFontSize).toBe(12);
    expect(settings.cartType).toBe("drawer");
  });
});

describe("bibliothèque de sections", () => {
  it("propose les sections produit uniquement dans le modèle produit", () => {
    const productSections = sectionsForTemplateType("product");
    const indexSections = sectionsForTemplateType("index");

    expect(productSections).toContain("product-gallery");
    expect(productSections).toContain("product-info");
    expect(indexSections).not.toContain("product-gallery");
    expect(indexSections).not.toContain("collection-grid");
  });

  it("donne des valeurs par défaut à chaque section", () => {
    const banner = newSection("image-banner");
    expect(banner.settings.sectionHeight).toBe("auto");
    expect(banner.settings.columnsDesktop).toBe(3);
    expect(getSectionSchema("image-banner")?.fields.length).toBeGreaterThan(10);
  });
});
