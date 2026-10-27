import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import ts from "typescript";
import { resolveConfig } from "vite";
import { minuteCount, minuteUnit, streakCount, wordCount } from "../i18n";
import { href, parseRouteLocation, type Route } from "../lib/router";
import {
  datasetForLocale,
  localeFromHash,
  localizedHref,
  supportedUiLocales,
  uiDirection,
} from "./locale";
import { loadUiMessages, tr } from "./messages";
import { localizeReactProps } from "./react-props";

await Promise.all([loadUiMessages("pt-BR"), loadUiMessages("es-419")]);

test("Vite keeps the application's JSX catalog state outside dependency prebundling", async () => {
  const config = await resolveConfig({}, "serve");
  for (const dependencies of [
    config.optimizeDeps,
    config.environments.client.optimizeDeps,
  ]) {
    assert.equal(
      dependencies.include?.some((id) => id.startsWith("@mehrdadika/i18n")),
      false,
    );
    assert.ok(dependencies.include?.includes("react/jsx-dev-runtime"));
    assert.ok(
      dependencies.exclude?.includes("@mehrdadika/i18n/jsx-dev-runtime"),
    );
  }
});

test("all full-app routes keep the selected edition and stable English identifiers", () => {
  const routes: Route[] = [
    { page: "today" },
    {
      page: "atlas",
      topic: "medicine-healthcare",
      q: "pressão + força",
      status: "saved",
      view: "grid",
    },
    { page: "learn" },
    { page: "practice" },
    { page: "me" },
    { page: "about" },
    { page: "read", id: "a-clinic-visit", tab: "short" },
    { page: "read", tab: "books" },
    { page: "books", book: "one book/a", chapter: 2 },
    { page: "paraphrase", id: "beginner" },
    { page: "confuse", id: "make-do" },
  ];
  for (const locale of supportedUiLocales)
    for (const route of routes) {
      const path = href(route, "pressure:medical", locale);
      const parsed = parseRouteLocation(path);
      assert.equal(parsed.locale, locale);
      assert.equal(parsed.word, "pressure:medical");
      assert.equal(parsed.route.page, route.page);
      for (const [key, value] of Object.entries(route))
        assert.equal(
          (parsed.route as unknown as Record<string, unknown>)[key],
          value,
        );
    }
  assert.equal(localeFromHash("#/pt-BRish/learn"), "fa");
  assert.equal(uiDirection("es-419"), "ltr");
  assert.equal(datasetForLocale("english-corpus", "fa"), "english-corpus");
  assert.equal(
    datasetForLocale("english-corpus", "pt-BR"),
    "english-corpus:pt-BR",
  );
  assert.equal(
    datasetForLocale("english-corpus", "es-419"),
    "english-corpus:es-419",
  );
});

test("visible word counts use Portuguese and Spanish singular and plural forms", () => {
  assert.equal(wordCount(1, "pt-BR"), "1 palavra");
  assert.equal(wordCount(2, "pt-BR"), "2 palavras");
  assert.equal(wordCount(0, "pt-BR"), "0 palavras");
  assert.equal(wordCount(1, "es-419"), "1 palabra");
  assert.equal(wordCount(2, "es-419"), "2 palabras");
  assert.equal(minuteCount(1, "pt-BR"), "1 minuto");
  assert.equal(minuteUnit(2, "es-419"), "minutos");
  assert.equal(streakCount(1, "pt-BR"), "1 dia seguido");
  assert.equal(streakCount(2, "pt-BR"), "2 dias seguidos");
  assert.equal(streakCount(1, "es-419"), "1 día seguido");
  assert.equal(streakCount(2, "es-419"), "2 días seguidos");
});

test("old Portuguese bookmark/search deep links open the shared atlas without dropping filters", () => {
  const legacy = parseRouteLocation(
    "#/pt-BR?topic=cooking-food-drink&q=pão&saved=1&w=bake",
  );
  assert.deepEqual(legacy, {
    locale: "pt-BR",
    word: "bake",
    route: {
      page: "atlas",
      topic: "cooking-food-drink",
      q: "pão",
      status: "saved",
      level: undefined,
      view: undefined,
    },
  });
  assert.equal(
    localizedHref("#/books/story/2", "pt-BR"),
    "#/pt-BR/books/story/2",
  );
  assert.equal(localizedHref("#main", "es-419"), "#main");
  assert.equal(
    localizedHref("https://example.com/#/learn", "es-419"),
    "https://example.com/#/learn",
  );
  assert.equal(localizedHref("#/", "pt-BR", true), "#/");
});

test("JSX localization translates text and accessible copy without mutating values, elements or native language links", () => {
  const element = { type: "strong", props: { children: "already built" } };
  const source = {
    children: ["امروز", [" کتابخانه ", element, 7]],
    title: "جست‌وجوی واژه",
    placeholder: "جست‌وجوی واژه",
    "aria-label": "جست‌وجوی واژه",
    value: "فارسی user data",
    href: "#/learn",
    lang: "fa",
    dir: "rtl",
  };
  const output = localizeReactProps(source, "pt-BR");
  assert.deepEqual(output.children, ["Hoje", [" Biblioteca ", element, 7]]);
  assert.equal((output.children[1] as unknown[])[1], element);
  assert.equal(output.title, "Buscar palavra");
  assert.equal(output.placeholder, output.title);
  assert.equal(output["aria-label"], output.title);
  assert.equal(output.value, source.value);
  assert.equal(output.href, "#/pt-BR/learn");
  assert.equal(output.lang, "pt-BR");
  assert.equal(output.dir, "ltr");
  assert.equal(source.href, "#/learn");
  const native = {
    children: "فارسی",
    href: "#/",
    lang: "fa",
    dir: "rtl",
    "data-native-copy": true,
    "data-locale-link": true,
  };
  assert.deepEqual(localizeReactProps(native, "es-419"), native);
  assert.equal(tr("  امروز  ", "es-419"), "  Hoy  ");
});

test("every Persian UI message and interpolation fragment has a native translation in both editions", () => {
  const root = dirname(fileURLToPath(new URL("../", import.meta.url)));
  const files = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? files(join(directory, entry.name))
        : /\.(ts|tsx)$/.test(entry.name) && !/\.test\./.test(entry.name)
          ? [join(directory, entry.name)]
          : [],
    );
  const missing: string[] = [];
  for (const path of files(join(root, "src"))) {
    if (path.includes("/i18n/")) continue;
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      path.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const visit = (node: ts.Node) => {
      if (
        ts.isStringLiteral(node) ||
        ts.isJsxText(node) ||
        ts.isTemplateHead(node) ||
        ts.isTemplateMiddle(node) ||
        ts.isTemplateTail(node) ||
        ts.isNoSubstitutionTemplateLiteral(node)
      ) {
        const message = node.text.replace(/\s+/g, " ").trim();
        if (/[\u0600-\u06ff]/u.test(message) && message !== "فارسی")
          for (const locale of ["pt-BR", "es-419"] as const) {
            if (/[\u0600-\u06ff]/u.test(tr(message, locale)))
              missing.push(
                `${path}:${source.getLineAndCharacterOfPosition(node.pos).line + 1} ${locale}: ${message}`,
              );
          }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(missing, []);
});
