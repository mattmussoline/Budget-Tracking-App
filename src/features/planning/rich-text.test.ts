import { describe, expect, it } from "vitest";
import { isEmptyNotesHtml, isLikelyNotesHtml, notesHtmlToPlainText, plainTextToNotesHtml, renderNotesHtml, sanitizeNotesHtml } from "./rich-text";

describe("sanitizeNotesHtml", () => {
  it("keeps the formatting the notes editor can produce", () => {
    const markup = "<p>Plain</p><p><strong>Bold</strong> <em>italic</em> <u>underline</u></p><ul><li>One</li></ul><ol><li>Two</li></ol>";

    expect(sanitizeNotesHtml(markup)).toBe(markup);
  });

  it("normalises the tags browsers emit for bold, italic, and blocks", () => {
    expect(sanitizeNotesHtml("<div><b>Bold</b> and <i>italic</i></div>")).toBe("<p><strong>Bold</strong> and <em>italic</em></p>");
  });

  it("drops every attribute except a validated link href", () => {
    expect(sanitizeNotesHtml('<p class="x" onclick="steal()" style="color:red">Keep</p>')).toBe("<p>Keep</p>");
    expect(sanitizeNotesHtml('<a href="https://example.com" onclick="steal()">Link</a>')).toContain('href="https://example.com"');
    expect(sanitizeNotesHtml('<a href="https://example.com" onclick="steal()">Link</a>')).not.toContain("onclick");
  });

  it("unwraps links whose href is not http or https", () => {
    expect(sanitizeNotesHtml('<a href="javascript:steal()">bad</a>')).toBe("bad");
    expect(sanitizeNotesHtml('<a href="data:text/html,<script>steal()</script>">bad</a>')).toBe("bad");
    expect(sanitizeNotesHtml('<a href="/relative">bad</a>')).toBe("bad");
  });

  it("removes disallowed tags and the content of executable ones", () => {
    expect(sanitizeNotesHtml('<p>Keep</p><img src="x" onerror="steal()">')).toBe("<p>Keep</p>");
    expect(sanitizeNotesHtml("<p>Keep</p><script>steal()</script>")).toBe("<p>Keep</p>");
    expect(sanitizeNotesHtml("<p>Keep</p><style>body{display:none}</style>")).toBe("<p>Keep</p>");
    expect(sanitizeNotesHtml('<iframe src="https://evil.test">frame</iframe><p>Keep</p>')).toBe("<p>Keep</p>");
  });

  it("keeps inner text when it unwraps a disallowed wrapper", () => {
    expect(sanitizeNotesHtml('<span class="x">Still here</span>')).toBe("Still here");
    expect(sanitizeNotesHtml("<h1>Heading text</h1>")).toBe("Heading text");
  });

  it("collapses self-closing and stray break tags", () => {
    expect(sanitizeNotesHtml("<p>One<br />Two</p>")).toBe("<p>One<br>Two</p>");
    expect(sanitizeNotesHtml("<p>One</br>Two</p>")).toBe("<p>OneTwo</p>");
  });
});

describe("sanitizeNotesHtml list normalisation", () => {
  it("unwraps the paragraph browsers wrap around a new list", () => {
    expect(sanitizeNotesHtml("<p><ul><li><b>hello</b> world</li></ul></p>")).toBe("<ul><li><strong>hello</strong> world</li></ul>");
    expect(sanitizeNotesHtml("<p><ol><li>One</li></ol></p>")).toBe("<ol><li>One</li></ol>");
  });

  it("drops the empty paragraphs left beside a list", () => {
    expect(sanitizeNotesHtml("<p></p><ul><li>A</li></ul><p></p>")).toBe("<ul><li>A</li></ul>");
  });

  it("keeps real paragraphs around a list", () => {
    expect(sanitizeNotesHtml("<p>Before</p><ul><li>A</li></ul><p>After</p>")).toBe("<p>Before</p><ul><li>A</li></ul><p>After</p>");
  });
});

describe("sanitizeNotesHtml with style-only formatting", () => {
  it("converts inline CSS bold, italic, and underline into tags", () => {
    expect(sanitizeNotesHtml('<span style="font-weight: bold;">Bold</span>')).toBe("<strong>Bold</strong>");
    expect(sanitizeNotesHtml('<span style="font-weight:700">Bold</span>')).toBe("<strong>Bold</strong>");
    expect(sanitizeNotesHtml('<span style="font-style: italic">Ital</span>')).toBe("<em>Ital</em>");
    expect(sanitizeNotesHtml('<span style="text-decoration: underline">Und</span>')).toBe("<u>Und</u>");
  });

  it("keeps nested style wrappers balanced", () => {
    expect(sanitizeNotesHtml('<span style="font-weight:bold"><span style="font-style:italic">Both</span> bold</span>'))
      .toBe("<strong><em>Both</em> bold</strong>");
  });

  it("unwraps style wrappers that carry no supported formatting", () => {
    expect(sanitizeNotesHtml('<span style="color:#ff0000">Red text</span>')).toBe("Red text");
    expect(sanitizeNotesHtml('<font face="Arial" size="4">Sized</font>')).toBe("Sized");
  });

  it("handles the markup a Word or Google Docs paste produces", () => {
    const pasted = '<p style="margin:0"><span style="font-weight:700">Deal terms</span></p><p><span style="color:#111">Two year window</span></p>';

    expect(sanitizeNotesHtml(pasted)).toBe("<p><strong>Deal terms</strong></p><p>Two year window</p>");
  });
});

describe("plain text compatibility", () => {
  it("recognises which storage format a stored note uses", () => {
    expect(isLikelyNotesHtml("<p>Rich</p>")).toBe(true);
    expect(isLikelyNotesHtml("Just text with a > sign")).toBe(false);
  });

  it("turns legacy plain text into paragraphs and line breaks", () => {
    expect(plainTextToNotesHtml("One\n\nTwo")).toBe("<p>One</p><p>Two</p>");
    expect(plainTextToNotesHtml("One\nTwo")).toBe("<p>One<br>Two</p>");
    expect(plainTextToNotesHtml("   ")).toBe("");
  });

  it("escapes plain text before it becomes markup", () => {
    expect(plainTextToNotesHtml('<script>steal()</script>')).toBe("<p>&lt;script&gt;steal()&lt;/script&gt;</p>");
  });

  it("linkifies bare URLs found in legacy plain text", () => {
    const rendered = plainTextToNotesHtml("Watch https://example.com/a now");

    expect(rendered).toContain('<a href="https://example.com/a"');
    expect(rendered).toContain("target=\"_blank\"");
  });

  it("renders either storage format through one entry point", () => {
    expect(renderNotesHtml("Legacy note")).toBe("<p>Legacy note</p>");
    expect(renderNotesHtml("<p>Rich note</p>")).toBe("<p>Rich note</p>");
    expect(renderNotesHtml(null)).toBe("");
  });
});

describe("notesHtmlToPlainText", () => {
  it("flattens markup for consumers that need plain text", () => {
    expect(notesHtmlToPlainText("<p>One</p><p>Two<br>Three</p>")).toBe("One\nTwo\nThree");
    expect(notesHtmlToPlainText("<ul><li>A</li><li>B</li></ul>")).toBe("A\nB");
  });

  it("decodes entities and keeps legacy plain text untouched", () => {
    expect(notesHtmlToPlainText("<p>Fish &amp; Chips &lt;now&gt;</p>")).toBe("Fish & Chips <now>");
    expect(notesHtmlToPlainText("Already plain")).toBe("Already plain");
  });

  it("treats formatting-only markup as an empty note", () => {
    expect(isEmptyNotesHtml("<p><br></p>")).toBe(true);
    expect(isEmptyNotesHtml("<p>&nbsp;</p>")).toBe(true);
    expect(isEmptyNotesHtml("<p>Real</p>")).toBe(false);
  });
});
