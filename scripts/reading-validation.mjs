/** Validate authoring data before the release compiler filters publication states. */
export function validateReadings(raw) {
  const fail = (condition, message) => {
    if (!condition) throw new Error(`Reading content: ${message}`);
  };
  const object = (value, where) => {
    fail(
      value && typeof value === "object" && !Array.isArray(value),
      `${where} must be an object.`,
    );
    return value;
  };
  const list = (value, where, maximum = 10000) => {
    fail(
      Array.isArray(value) && value.length <= maximum,
      `${where} must be a bounded array.`,
    );
    return value;
  };
  const text = (value, where, maximum = 12000) => {
    fail(
      typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= maximum,
      `${where} must be nonempty text.`,
    );
    return value;
  };
  const shape = (value, allowed, where) => {
    object(value, where);
    fail(
      Object.keys(value).every((key) => allowed.includes(key)),
      `${where} contains unsupported fields.`,
    );
  };
  const identifiers = new Set();
  const id = (value, where, seen = identifiers) => {
    fail(
      typeof value === "string" &&
        /^[A-Za-z0-9][A-Za-z0-9:._-]{0,179}$/.test(value) &&
        !["__proto__", "constructor", "prototype"].includes(value),
      `${where} has an invalid ID.`,
    );
    fail(!seen.has(value), `${where} repeats ID ${value}.`);
    seen.add(value);
  };
  const review = (value, where) => {
    shape(
      value,
      [
        "status",
        "humanReviewed",
        "reviewer",
        "reviewedAt",
        "revision",
        "domainReviewer",
        "domainQualified",
        "contentHash",
      ],
      `${where}.review`,
    );
    text(value.status, `${where}.review.status`, 80);
    fail(
      typeof value.humanReviewed === "boolean",
      `${where}.review.humanReviewed must be boolean.`,
    );
    if (value.humanReviewed)
      text(value.reviewer, `${where}.review.reviewer`, 200);
    if (value.domainQualified !== undefined)
      fail(
        typeof value.domainQualified === "boolean",
        `${where}.review.domainQualified must be boolean.`,
      );
    if (value.domainQualified)
      text(value.domainReviewer, `${where}.review.domainReviewer`, 200);
    else if (value.domainReviewer !== undefined)
      text(value.domainReviewer, `${where}.review.domainReviewer`, 200);
    if (value.contentHash !== undefined)
      fail(
        typeof value.contentHash === "string" &&
          /^[a-f0-9]{64}$/.test(value.contentHash),
        `${where}.review.contentHash must be a SHA-256 hash.`,
      );
    if (value.status === "approved")
      fail(
        value.humanReviewed,
        `${where} approved review requires human review.`,
      );
    if (value.reviewedAt !== undefined)
      fail(
        typeof value.reviewedAt === "string" &&
          Number.isFinite(Date.parse(value.reviewedAt)),
        `${where}.review.reviewedAt is invalid.`,
      );
    if (value.revision !== undefined)
      fail(
        Number.isInteger(value.revision) && value.revision >= 1,
        `${where}.review.revision is invalid.`,
      );
  };
  const publication = (item, where) => {
    fail(
      ["draft", "preview", "published", "withdrawn"].includes(item.publication),
      `${where}.publication is invalid.`,
    );
    review(item.review, where);
  };
  const level = (value, where) =>
    fail(
      ["A1", "A2", "B1", "B2", "C1", "C2"].includes(value),
      `${where}.level is invalid.`,
    );
  const localQuestions = (questions, where, validate) => {
    const seen = new Set();
    for (const [index, question] of list(
      questions,
      `${where}.questions`,
      100,
    ).entries()) {
      object(question, `${where}.questions[${index}]`);
      id(question.id, `${where}.questions[${index}]`, seen);
      validate(question, `${where}.questions[${index}]`);
    }
  };
  const reading = (item, where, chapter = false) => {
    shape(
      item,
      [
        "id",
        "titleEn",
        "titleFa",
        "level",
        "domainId",
        "minutes",
        "targetWords",
        "paragraphs",
        "questions",
        "publication",
        "review",
        ...(chapter ? ["number"] : []),
      ],
      where,
    );
    id(item.id, where);
    text(item.titleEn, `${where}.titleEn`, 300);
    text(item.titleFa, `${where}.titleFa`, 300);
    level(item.level, where);
    text(item.domainId, `${where}.domainId`, 100);
    fail(
      Number.isInteger(item.minutes) &&
        item.minutes >= 1 &&
        item.minutes <= 10000,
      `${where}.minutes must be positive.`,
    );
    publication(item, where);
    for (const word of list(item.targetWords, `${where}.targetWords`, 200))
      text(word, `${where}.targetWords`, 200);
    fail(
      list(item.paragraphs, `${where}.paragraphs`, 2000).length > 0,
      `${where} needs paragraphs.`,
    );
    for (const [paragraphIndex, paragraph] of item.paragraphs.entries()) {
      const p = `${where}.paragraphs[${paragraphIndex}]`;
      shape(paragraph, ["id", "sentences"], p);
      id(paragraph.id, p);
      fail(
        list(paragraph.sentences, `${p}.sentences`, 200).length > 0,
        `${p} needs sentences.`,
      );
      for (const [sentenceIndex, sentence] of paragraph.sentences.entries()) {
        const s = `${p}.sentences[${sentenceIndex}]`;
        shape(sentence, ["id", "en", "fa"], s);
        id(sentence.id, s);
        text(sentence.en, `${s}.en`);
        text(sentence.fa, `${s}.fa`);
      }
    }
    localQuestions(item.questions, where, (question, q) => {
      shape(question, ["id", "statement", "answer", "explanationFa"], q);
      text(question.statement, `${q}.statement`);
      text(question.explanationFa, `${q}.explanationFa`);
      fail(
        ["true", "false", "not-given"].includes(question.answer),
        `${q}.answer is invalid.`,
      );
    });
    if (chapter)
      fail(
        Number.isInteger(item.number) && item.number > 0 && item.number <= 2000,
        `${where}.number must be a positive chapter number.`,
      );
  };
  object(raw, "catalog");
  fail(raw.schemaVersion === 1, "unsupported schemaVersion.");
  fail(["preview", "stable"].includes(raw.channel), "invalid channel.");
  object(raw.provenance, "provenance");
  fail(
    ["CC-BY-4.0", "CC BY 4.0"].includes(raw.provenance.license),
    "a supported content license is required.",
  );
  fail(
    typeof raw.provenance.aiAssisted === "boolean",
    "provenance.aiAssisted must be boolean.",
  );
  for (const [index, passage] of list(raw.passages, "passages").entries())
    reading(passage, `passages[${index}]`);
  for (const [index, book] of list(raw.books, "books").entries()) {
    const where = `books[${index}]`;
    shape(
      book,
      [
        "id",
        "titleEn",
        "titleFa",
        "author",
        "summaryFa",
        "level",
        "chapters",
        "publication",
        "review",
      ],
      where,
    );
    id(book.id, where);
    text(book.titleEn, `${where}.titleEn`, 300);
    text(book.titleFa, `${where}.titleFa`, 300);
    text(book.author, `${where}.author`, 300);
    text(book.summaryFa, `${where}.summaryFa`);
    level(book.level, where);
    publication(book, where);
    const chapterNumbers = new Set();
    for (const [chapterIndex, chapter] of list(
      book.chapters,
      `${where}.chapters`,
      2000,
    ).entries()) {
      reading(chapter, `${where}.chapters[${chapterIndex}]`, true);
      fail(
        !chapterNumbers.has(chapter.number),
        `${where} repeats a chapter number.`,
      );
      chapterNumbers.add(chapter.number);
    }
  }
  for (const [index, item] of list(raw.paraphrases, "paraphrases").entries()) {
    const where = `paraphrases[${index}]`;
    shape(
      item,
      ["id", "titleFa", "level", "questions", "publication", "review"],
      where,
    );
    id(item.id, where);
    text(item.titleFa, `${where}.titleFa`, 300);
    level(item.level, where);
    publication(item, where);
    fail(
      list(item.questions, `${where}.questions`, 100).length > 0,
      `${where} needs questions.`,
    );
    localQuestions(item.questions, where, (question, q) => {
      shape(
        question,
        [
          "id",
          "source",
          "target",
          "prompt",
          "options",
          "answer",
          "explanationFa",
        ],
        q,
      );
      for (const key of ["source", "target", "prompt", "explanationFa"])
        text(question[key], `${q}.${key}`);
      fail(
        question.source.includes(question.target),
        `${q}.target must occur in the source.`,
      );
      fail(
        list(question.options, `${q}.options`, 8).length >= 2,
        `${q} needs at least two options.`,
      );
      question.options.forEach((option) => text(option, `${q}.option`, 500));
      fail(
        new Set(question.options).size === question.options.length,
        `${q} repeats an option.`,
      );
      fail(
        Number.isInteger(question.answer) &&
          question.answer >= 0 &&
          question.answer < question.options.length,
        `${q}.answer is out of range.`,
      );
    });
  }
  for (const [index, item] of list(raw.confusables, "confusables").entries()) {
    const where = `confusables[${index}]`;
    shape(
      item,
      [
        "id",
        "level",
        "differenceFa",
        "tipFa",
        "words",
        "questions",
        "publication",
        "review",
      ],
      where,
    );
    id(item.id, where);
    level(item.level, where);
    text(item.differenceFa, `${where}.differenceFa`);
    text(item.tipFa, `${where}.tipFa`);
    publication(item, where);
    fail(
      list(item.words, `${where}.words`, 8).length >= 2,
      `${where} needs at least two words.`,
    );
    for (const [wordIndex, word] of item.words.entries()) {
      const w = `${where}.words[${wordIndex}]`;
      shape(
        word,
        ["word", "meaningFa", "explanationFa", "exampleEn", "exampleFa"],
        w,
      );
      for (const key of [
        "word",
        "meaningFa",
        "explanationFa",
        "exampleEn",
        "exampleFa",
      ])
        text(word[key], `${w}.${key}`);
    }
    fail(
      list(item.questions, `${where}.questions`, 100).length > 0,
      `${where} needs questions.`,
    );
    localQuestions(item.questions, where, (question, q) => {
      shape(question, ["id", "sentence", "answer", "explanationFa"], q);
      text(question.sentence, `${q}.sentence`);
      text(question.explanationFa, `${q}.explanationFa`);
      fail(question.sentence.includes("____"), `${q} needs a visible blank.`);
      fail(
        Number.isInteger(question.answer) &&
          question.answer >= 0 &&
          question.answer < item.words.length,
        `${q}.answer is out of range.`,
      );
    });
  }
  return raw;
}
