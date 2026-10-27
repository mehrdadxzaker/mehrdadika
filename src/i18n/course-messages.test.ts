import assert from "node:assert/strict";
import test from "node:test";
import { courseLabels } from "./course-messages";
import { courseLabels as publicCourseLabels } from "../courses/labels";
import { supportedUiLocales } from "./locale";

test("every course UI message has complete native copy in all three editions", () => {
  const expectedKeys = Object.keys(courseLabels("fa")).sort();
  for (const locale of supportedUiLocales) {
    const labels = courseLabels(locale);
    assert.deepEqual(Object.keys(labels).sort(), expectedKeys, locale);
    for (const [key, value] of Object.entries(labels)) {
      assert.equal(typeof value, "string", `${locale}:${key}`);
      assert.ok(value.trim().length > 0, `${locale}:${key}`);
      if (locale !== "fa")
        assert.doesNotMatch(value, /[\u0600-\u06ff]/u, `${locale}:${key}`);
    }
  }
  assert.equal(courseLabels("fa").courses, "دوره‌ها");
  assert.equal(courseLabels("pt-BR").courses, "Cursos");
  assert.equal(courseLabels("es-419").courses, "Cursos");
  assert.notEqual(
    courseLabels("pt-BR").continue,
    courseLabels("es-419").continue,
  );
});

test("course UI locale defaults follow the active route and preserve explicit selection", () => {
  const before = Object.getOwnPropertyDescriptor(globalThis, "location");
  try {
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: { hash: "#/pt-BR/courses/science-water-weather" },
    });
    assert.equal(courseLabels(), courseLabels("pt-BR"));
    assert.equal(courseLabels("fa").courses, "دوره‌ها");
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: { hash: "#/es-419/courses/science-water-weather" },
    });
    assert.equal(courseLabels(), courseLabels("es-419"));
    assert.equal(publicCourseLabels("pt-BR"), courseLabels("pt-BR"));
    Reflect.deleteProperty(globalThis, "location");
    assert.equal(courseLabels(), courseLabels("fa"));
  } finally {
    if (before) Object.defineProperty(globalThis, "location", before);
    else Reflect.deleteProperty(globalThis, "location");
  }
});
