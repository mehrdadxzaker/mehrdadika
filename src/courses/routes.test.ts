import assert from "node:assert/strict";
import { test } from "node:test";
import { href, parseRouteLocation } from "../lib/router";
test("course and Library links round-trip within all support-language editions", () => {
  for (const locale of ["fa", "pt-BR", "es-419"] as const) {
    const route = {
      page: "course" as const,
      course: "science-water-weather",
      lesson: "where-puddles-go",
    };
    assert.deepEqual(parseRouteLocation(href(route, null, locale)), {
      route,
      locale,
      word: null,
    });
    assert.equal(
      parseRouteLocation(href({ page: "read", tab: "courses" }, null, locale))
        .route.page,
      "read",
    );
    assert.deepEqual(
      parseRouteLocation(href({ page: "read", tab: "courses" }, null, locale))
        .route,
      { page: "read", id: undefined, tab: "courses" },
    );
  }
});
