#!/usr/bin/env python3
"""Step 1 of the CMU Recipe Archive import: parse every eligible archive recipe into JSON.

Reads the mirror (ARCHIVE_DIR, default ~/Projects/recipe-sources/cmu-recipe-archive) and its
recipes.csv index. Eligible = not flagged as citing a publication/restaurant/brand and has an
ingredient list. Writes build/parsed.json with, per recipe: key, url, category, title, author
(name only — never an email), posted date, servings, ingredient lines split into
qty/unit/name/prep, and cleaned instruction steps.
"""
import csv
import html
import json
import os
import re
from datetime import datetime
from email.utils import parsedate_to_datetime

ARCHIVE = os.environ.get("ARCHIVE_DIR", os.path.expanduser("~/Projects/recipe-sources/cmu-recipe-archive"))
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build")
BASE_URL = "https://www.cs.cmu.edu/~mjw/recipes/"

UNICODE_FRAC = {"½": "1/2", "¼": "1/4", "¾": "3/4", "⅓": "1/3", "⅔": "2/3", "⅛": "1/8"}
UNITS = {
    "cup": "cup", "cups": "cup", "c": "cup", "c.": "cup", "cp": "cup",
    "tablespoon": "tbsp", "tablespoons": "tbsp", "tbsp": "tbsp", "tbsp.": "tbsp", "tbs": "tbsp", "tbs.": "tbsp",
    "tbl": "tbsp", "tblsp": "tbsp", "tbsps": "tbsp", "tb": "tbsp", "tblspn": "tbsp",
    "teaspoon": "tsp", "teaspoons": "tsp", "tsp": "tsp", "tsp.": "tsp", "tsps": "tsp", "ts": "tsp", "teas": "tsp",
    "ounce": "oz", "ounces": "oz", "oz": "oz", "oz.": "oz",
    "pound": "lb", "pounds": "lb", "lb": "lb", "lbs": "lb", "lb.": "lb", "lbs.": "lb", "#": "lb",
    "clove": "clove", "cloves": "clove",
    "can": "can", "cans": "can", "tin": "can",
    "stalk": "stalk", "stalks": "stalk", "rib": "stalk", "ribs": "stalk",
    "head": "head", "heads": "head", "bunch": "bunch", "bunches": "bunch",
    "slice": "slice", "slices": "slice", "pinch": "pinch", "dash": "pinch", "dashes": "pinch",
    "quart": "quart", "quarts": "quart", "qt": "quart", "pint": "pint", "pints": "pint", "pt": "pint",
    "gram": "g", "grams": "g", "g": "g", "gr": "g", "kg": "kg", "ml": "ml", "l": "l", "liter": "l", "litre": "l",
    "package": "pkg", "packages": "pkg", "pkg": "pkg", "pkg.": "pkg", "pkgs": "pkg", "envelope": "pkg",
    "stick": "stick", "sticks": "stick", "large": "large", "medium": "medium", "small": "small",
    "sprig": "sprig", "sprigs": "sprig", "handful": "handful", "jar": "jar", "bottle": "bottle",
    "ozs": "oz", "ozs.": "oz", "dl": "dl", "tblspoon": "tbsp", "tblspoons": "tbsp", "tablesp": "tbsp", "tbsps.": "tbsp",
    "tesp": "tsp", "tap.": "tsp", "reaspoon": "tsp", "teasp": "tsp", "teaspn": "tsp", "tspn": "tsp", "cps": "cup",
    "gallon": "gallon", "gallons": "gallon", "grams": "g", "gms": "g", "carton": "pkg", "cartons": "pkg",
    "square": "oz", "squares": "oz", "cube": "cube", "cubes": "cube", "box": "pkg", "boxes": "pkg", "bag": "pkg",
    "container": "pkg", "packet": "pkg", "packets": "pkg", "envelopes": "pkg", "ltr": "l", "litres": "l", "liters": "l",
    "mls": "ml", "kilo": "kg", "kgs": "kg", "lbs": "lb", "pounds": "lb", "cl": "cl",
    "tablesppon": "tbsp", "tp": "tsp", "pack": "pkg", "packs": "pkg", "loaf": "loaf", "loaves": "loaf",
    "teaspon": "tsp", "teaspoonful": "tsp", "teaspoonfuls": "tsp", "tablesoon": "tbsp", "tablspoon": "tbsp",
    "tablespoonful": "tbsp", "tablespoonfuls": "tbsp", "tbsn": "tbsp", "tblsps": "tbsp", "tbls": "tbsp", "tbls.": "tbsp",
    "tbl.": "tbsp", "tb.": "tbsp", "drop": "pinch", "drops": "pinch", "dashes.": "pinch", "smidgen": "pinch", "tsp..": "tsp", "cupful": "cup", "cupfuls": "cup", "c": "cup", "lb..": "lb",
}
UNIT_ADJ = {"level", "heaping", "heaped", "rounded", "scant", "generous", "good", "big", "large", "small", "medium", "full"}
QTY = r"(?:(?:\d+\s+)?\d+/\d+\s*(?:-|to)\s*(?:\d+\s+)?\d+(?:/\d+)?|\d+\s+to\s+\d+|\d+\s*(?:&|and)?\s+\d+\s*/\s*\d+|\d+-\d+/\d+|\d+\s*/\s*\d+|\d*\.\d+|\d+(?:\s*-\s*\d+)?|(?:one|two|three|four|five|six|a|an)\b)"
LINE = re.compile(rf"^\s*(?P<qty>{QTY})\s*(?P<rest>.+)$", re.I)
WORDNUM = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "a": 1, "an": 1}
SERVES = re.compile(r"\b(?:serves|servings?|makes|yield[s]?)\s*[:\-]?\s*(?:about\s+)?(\d+)", re.I)
EMAIL = re.compile(r"\S+@\S+")


def qty_value(q: str) -> float:
    q = q.strip().lower()
    if q in WORDNUM:
        return float(WORDNUM[q])
    q = re.sub(r"\s*/\s*", "/", q).replace("&", " ").replace(" and ", " ")
    q = re.sub(r"(\d+)-(\d+/\d+)", r"\1 \2", q)
    q = q.replace(" to ", "-")
    if "-" in q:  # a range: take the upper bound
        q = q.split("-")[-1].strip()
    total = 0.0
    for part in q.split():
        if "/" in part:
            n, d = part.split("/")
            total += float(n) / float(d) if float(d) else 0
        else:
            total += float(part)
    return total


def parse_ingredient(line: str):
    s = line.strip().strip("-*•").strip()
    s = re.sub(r"^(ca\.?|approx\.?|about|abt\.?|appx\.?)\s+|^~\s*", "", s, flags=re.I)
    for k, v in UNICODE_FRAC.items():
        s = s.replace(k, v)
    s = re.sub(r"^(\d[\d/.\s-]*?)(T|t|c|tbsp|tsp|oz|lb|g)\b\.?", r"\1 \2 ", s)
    plus = re.match(rf"^({QTY})\s*([A-Za-z.]+)\s+(?:plus|\+)\s+({QTY})\s*([A-Za-z.]+)\s+(.+)$", s, re.I)
    if plus:
        u1, u2 = UNITS.get(plus.group(2).lower().rstrip(".")), UNITS.get(plus.group(4).lower().rstrip("."))
        tsp = {"tsp": 1, "tbsp": 3, "cup": 48}
        if u1 in tsp and u2 in tsp:
            total = qty_value(plus.group(1)) * tsp[u1] + qty_value(plus.group(3)) * tsp[u2]
            s = f"{round(total / tsp[u1], 4)} {plus.group(2)} {plus.group(5)}"
    m = LINE.match(s)
    if not m:
        return None
    qty = qty_value(m.group("qty"))
    rest = m.group("rest").strip()
    # "17-ounce can sweet potatoes": the number is the can's size, not a count of cans.
    sized = re.match(r"^-\s*(ounce|oz|pound|lb)s?\.?\s+((?:can|jar|package|pkg|box|bag|tin|carton)s?\b.*)$", rest, re.I)
    if sized:
        size_hint = qty * (16 if sized.group(1).lower() in ("pound", "lb") else 1)
        qty, rest = 1.0, sized.group(2)
    else:
        size_hint = None
    rest = re.sub(r"^or so\s+", "", rest, flags=re.I)  # "1/4 cup or so chopped onions"
    # "four or five potatoes" / "2 or 3 carrots": a range written with "or" — take the upper bound.
    alt = re.match(rf"^or\s+({QTY})\s+(.+)$", rest, re.I)
    if alt and alt.group(1).lower() not in ("a", "an"):
        qty, rest = max(qty, qty_value(alt.group(1))), alt.group(2).strip()
    # "(15 oz) can" / "12-oz can" size hints
    size = re.match(r"^\(?\s*(\d+(?:\.\d+)?)\s*-?\s*(oz|ounce|lb|g|ml)\.?\s*\)?\s*(.*)$", rest, re.I)
    size_oz = size_hint
    if size:
        size_oz = float(size.group(1)) * {"oz": 1, "ounce": 1, "lb": 16, "g": 1 / 28.35, "ml": 1 / 29.57}[size.group(2).lower()]
        rest = size.group(3)
    # A size can also follow the unit: "1 pkg (8 ounces each) cream cheese".
    inner = re.search(r"\(\s*(\d+(?:\.\d+)?)\s*-?\s*(oz|ounces?|lbs?|pounds?|g|grams?|ml)\.?\s*(?:each|ea\.?)?\s*\)", rest, re.I)
    if inner and size_oz is None:
        u0 = inner.group(2).lower()
        size_oz = float(inner.group(1)) * (16 if u0.startswith(("lb", "pound")) else 1 / 28.35 if u0.startswith("g") else 1 / 29.57 if u0 == "ml" else 1)
    rest = re.sub(r"(\w)\(", r"\1 (", rest)  # "grams(1 pkg)" → "grams (1 pkg)"
    tok = rest.split()
    unit = None
    if len(tok) > 1 and tok[0].lower() in UNIT_ADJ and (tok[1].rstrip(",.").lower() in UNITS or tok[1] in ("T", "t")):
        tok = tok[1:]
        rest = " ".join(tok)
    if tok:
        t0 = tok[0].rstrip(",")
        t0 = t0.rstrip(".") if t0 not in ("c.",) else t0
        u = {"T": "tbsp", "t": "tsp"}.get(t0) or UNITS.get(t0.lower())
        if u:
            unit = u
            rest = " ".join(tok[1:])
    if m.group("qty").lower() in ("a", "an") and unit is None:
        return None  # "a soft dough." is prose; "a pinch salt" has a unit
    # "1 lb. can whole tomatoes", "8 oz. can tomato sauce": the weight is the can's size.
    can = re.match(r"^(cans?|jars?|tins?|packages?|pkgs?\.?|box(?:es)?|bags?|cartons?)\s+(.*)$", rest.strip(), re.I)
    if unit in ("oz", "lb") and can and size_oz is None:
        size_oz, qty, unit, rest = qty * (16 if unit == "lb" else 1), 1.0, UNITS.get(can.group(1).lower().rstrip(".")), can.group(2)
    rest = re.sub(r"^(of|or so)\s+", "", rest.strip(), flags=re.I)  # "1/4 cup or so chopped onions"
    name, prep = split_name_prep(rest)
    name = re.sub(r"\(.*?\)|\(.*$", "", name).strip(" -.;:")
    if not name or len(name) > 60 or not re.match(r"^[A-Za-z]", name):
        return None
    if re.match(r"^(mg|milligrams?|calor|kcal|cal\b|g (fat|protein|carb)|grams? (fat|protein|carb)|% ?|percent|exchange)", name, re.I):
        return None  # a nutrition footer, not an ingredient
    # \b so "minced garlic" isn't read as "min(utes)".
    if re.match(r"^(minutes?|mins?|hours?|hrs?|degrees?|inch(es)?|servings?|people|persons?|to \d|times?|x|dd|or more|seconds?)\b", name, re.I):
        return None
    return {"qty": round(qty, 4), "unit": unit, "name": name, "prep": prep.strip(" .;") or None, "sizeOz": size_oz, "raw": line.strip()}


def split_name_prep(rest: str):
    """"mangoes (or two fresh ones, very ripe), drained" → ("mangoes (or two fresh ones, very ripe)", "drained"):
    split at the first comma outside parentheses."""
    depth = 0
    for i, ch in enumerate(rest):
        depth += {"(": 1, ")": -1}.get(ch, 0)
        if ch == "," and depth <= 0:
            return rest[:i], rest[i + 1:]
    return rest, ""


def clean_author(poster: str) -> str:
    m = re.search(r"\(([^)]+)\)", poster)
    name = m.group(1) if m else EMAIL.sub("", poster)
    name = re.sub(r"\s+", " ", name).strip(" <>\"'")
    name = re.split(r"\s*[/,]\s*", name)[0].strip()  # "Linda/BDT Burbank, Ca" → "Linda"
    # A phone number in the signature ("harlon whitley 952-2342", "Susie Keating (713+567-8251").
    name = re.sub(r"\s*\(?\+?\d[\d+\s().-]{5,}\d\)?", "", name).strip(" (+")
    # Not a name: an email, or a mail-system label ("login 3 of account 10573").
    ok = name and "@" not in name and not re.search(r"\b(login|account)\b|\d", name, re.I)
    return name if ok else "a rec.food.cooking contributor"


def iso_date(raw: str):
    try:
        return parsedate_to_datetime(raw).date().isoformat()
    except Exception:
        m = re.search(r"\b(19\d\d)\b", raw or "")
        return f"{m.group(1)}" if m else None


def block_text(file: str, anchor: str) -> str:
    raw = open(os.path.join(ARCHIVE, "site", file), encoding="latin-1").read()
    if anchor:
        parts = re.split(r'<A NAME="?(\d+)"?>\s*</A>', raw, flags=re.I)
        raw = parts[parts.index(anchor) + 1]
    raw = re.sub(r"<\s*(br|p|li|tr|div|h\d)\b[^>]*>", "\n", raw, flags=re.I)
    text = html.unescape(re.sub(r"<[^>]+>", "", raw))
    text = text.split("Carnegie Mellon's School")[0]
    return text.replace("\r", "")


HEADER_WORDS = re.compile(r"^(ingredients?|instructions?|directions?|method|preparation|procedure|to prepare|garnish|topping|filling|frosting|glaze|icing|crust|dough|sauce|dressing|marinade|batter|for the [a-z ]+|recipe|notes?)\b", re.I)
SIGNATURE = re.compile(r"^(--+|enjoy|bon app|happy (cooking|eating|baking)|cheers|regards|thanks|good luck|posted by|sent by|from the kitchen of)\b", re.I)
ABBREV = re.compile(r"\b(tsps?|tbsps?|tbs|tbl|tblsp|oz|ozs|lbs?|c|pkgs?|approx|appx|opt|med|lg|sm|pt|qt|t|T|env|sq|doz)\.", re.I)
NUTRITION_NOTE = re.compile(r"^(nutritional|nutrition|per serving|exchanges?|calories|each serving|approx\.? calories)\b|^(makes|serves|yields?|servings|preparation time|prep time|cooking time|cook time|total time|categories|title)\s*:", re.I)
META_LINE = re.compile(r"^(servings|yield|makes|serves|preparation time|prep time|cooking time|cook time|total time|categories|title|recipe via meal-master|-+ ?recipe via|mmmmm|from the files of)\b", re.I)
NUMBERED = re.compile(r"^\(?\d{1,2}[.)]\s+(?=[A-Za-z])")


def classify(line: str, title: str):
    """→ ('ing', [parsed...]) | ('header', None) | ('text', None)"""
    if NUMBERED.match(line):
        return "text", None  # "1. Preheat the oven" is a step, not "1 Preheat"
    # Columns ("1 cup x      2 tbsp y") and comma lists ("3 egg whites, 3/4 cup milk") split only
    # where the next piece starts with its own quantity.
    cols = [c for c in re.split(rf"(?:\t+|\s{{3,}}|,\s+)(?={QTY}\s)", line) if c.strip()]
    parsed = [parse_ingredient(re.sub(r"\s+", " ", c)) for c in cols]
    words = line.split()
    no_abbrev = ABBREV.sub(r"\1", line)
    if parsed and all(parsed) and len(line) < 140 and not re.search(r"[.!?]\s+[A-Z]", no_abbrev):
        return "ing", parsed
    # Side-by-side layout: "1 3/4 cups yogurt        In large bowl, combine: yogurt, …"
    gaps = re.split(r"\t+|\s{3,}", line)
    for k in range(len(gaps) - 1, 0, -1):
        left, right = " ".join(gaps[:k]), " ".join(gaps[k:]).strip()
        ing = parse_ingredient(left)
        if ing and right and re.match(r"^[A-Za-z(]", right) and not parse_ingredient(right):
            if len(right.split()) <= 2 and right[:1].islower():
                return "ing", [ing]  # an aligned prep note ("sifted")
            return "ing+text", ([ing], right)
    if re.search(r"\b\d+\s*(mg|milligrams?|calories?|kcal|g fat|grams? fat|% calories)\b", line, re.I):
        return "header", None  # nutrition footer
    letters = re.sub(r"[^A-Za-z]", "", line)
    # A Title Case name on its own ("Raspberry Sauce") introduces a sub-recipe.
    if 1 <= len(words) <= 4 and not re.search(r"\d", line) and all(w[:1].isupper() or w.lower() in ("and", "or", "of", "for", "the", "with", "&") for w in words) and not line.rstrip().endswith("."):
        return "header", None
    if line.rstrip().endswith(":") and len(words) <= 6:
        return "header", None
    if letters and letters.isupper() and len(words) <= 9:
        return "header", None
    if line.strip().lower() == title.strip().lower() or (HEADER_WORDS.match(line) and len(words) <= 3):
        return "header", None
    return "text", None


def looks_like_sentence(line: str) -> bool:
    return len(line.split()) >= 7 or line.rstrip().endswith((".", "!", "?"))


def split(text: str, title: str = "", author: str = ""):
    """Separate ingredient lines from instructions.

    Returns (ingredients, steps, leftovers). Leftovers are short non-sentence lines inside the
    ingredient block that didn't parse — usually an ingredient with no amount ("salt to taste")
    or a format we can't read. The builder maps the easy ones and sends the rest to review.
    """
    rows = []  # (kind, payload, line, paragraph_break_before, indent)
    blank = True
    for ln in text.split("\n"):
        stripped = ln.strip()
        indent = len(ln.expandtabs(8)) - len(ln.expandtabs(8).lstrip())
        if not stripped:
            blank = True
            continue
        if re.match(r"^(From|Date|Subject|Newsgroups|Message-ID|Organization|Lines|Path|Reply-To|Sender|Keywords|Summary|Distribution|References|X-[\w-]+):", stripped, re.I):
            continue
        if re.match(r"^[=\-_%*~#+]{3,}$", stripped) or "@" in stripped or "http" in stripped.lower():
            blank = True
            continue
        stripped = re.sub(r"^(\d+)\.(\d+/\d+)", r"\1 \2", stripped)  # "1.2/3 cups" = 1 2/3
        kind, payload = classify(stripped, title)
        rows.append((kind, payload, stripped, blank, indent))
        blank = False
    # A quantity at the start of a wrapped prose line ("... There should be\n1 cup juice left")
    # continues the sentence; it is not an ingredient.
    for i in range(1, len(rows)):
        kind, payload, line, brk, indent = rows[i]
        pk, _, pline, _, _ = rows[i - 1]
        if kind == "ing" and not brk and pk == "text" and not pline.rstrip().endswith((".", "!", "?", ":", ")")) and len(pline.split()) >= 5:
            rows[i] = ("text", None, line, brk, indent)
    ing_idx = [i for i, r in enumerate(rows) if r[0] in ("ing", "ing+text")]
    if not ing_idx:
        return [], [], [], False
    first, last = ing_idx[0], ing_idx[-1]
    # Two-column page: the right column is the method, wrapped beside the ingredient list.
    two_col = sum(1 for r in rows if r[0] == "ing+text") >= 2
    ingredients, leftovers, paragraphs = [], [], []
    interrupted = False  # a method sentence was split by a non-method line (layout we can't read)
    for i, (kind, payload, line, brk, indent) in enumerate(rows):
        if kind != "text" and i > last and i + 1 < len(rows) and not rows[i + 1][3] and paragraphs and paragraphs[-1] \
                and not paragraphs[-1][-1].rstrip().endswith((".", "!", "?", ":", ")")):
            interrupted = True
        if kind == "ing":
            ingredients.extend(payload)
            continue
        if kind == "ing+text":
            ingredients.extend(payload[0])
            if not paragraphs:
                paragraphs.append([])
            paragraphs[-1].append(payload[1])
            continue
        if two_col and first <= i <= last and kind == "text" and indent >= 12:
            if not paragraphs:
                paragraphs.append([])
            paragraphs[-1].append(line)
            continue
        if kind == "header":
            if i > last:
                paragraphs.append([])  # sub-recipe header ends the previous step
            continue
        if i < first:
            continue  # intro and commentary before the ingredient list
        if META_LINE.match(line.lstrip("- ")):
            continue
        if i <= last and re.match(r"^[a-z]", line) and re.search(r"\b(the|and|until|it|was|be|is|if|then|these|this|for|with|into|rises|well)\b", line) and len(line.split()) >= 3 and not parse_ingredient(line):
            continue  # a wrapped prose fragment inside the list ("mix these first three ingredients")
        if re.match(r"^#?\d+$|^\W+$", line):
            continue
        if (i <= last or i <= last + 2) and not looks_like_sentence(line) and len(line.split()) <= 8:
            leftovers.append(line)  # inside the list, or a short trailer right after it
            continue
        if brk or NUMBERED.match(line) or not paragraphs:
            paragraphs.append([])
        paragraphs[-1].append(NUMBERED.sub("", line))
    steps = []
    for para in paragraphs:
        body = re.sub(r"\s+", " ", " ".join(para)).strip()
        body = EMAIL.sub("", body)
        if not body:
            continue
        sentences = [x.strip() for x in re.split(r"(?<=[.!?])\s+(?=[A-Z0-9(])", body) if x.strip() and not NUTRITION_NOTE.match(x.strip())]
        cur = ""
        for sent in sentences:
            if cur and len(cur) + len(sent) > 240:
                steps.append(cur)
                cur = ""
            cur = f"{cur} {sent}".strip()
        if cur:
            steps.append(cur)
    # Drop sign-offs and the poster's own name at the end.
    first_name = (author.split() or [""])[0].lower()
    while steps and (SIGNATURE.match(steps[-1]) or (len(steps[-1].split()) <= 4 and (not steps[-1].endswith(".") or (first_name and first_name in steps[-1].lower())))):
        steps.pop()
    # Method lines that were swallowed by the ingredient list leave a step ending mid-sentence.
    if any(not st.rstrip().endswith((".", "!", "?", ")", '"')) for st in steps[:-1]):
        interrupted = True
    return ingredients, steps, leftovers, interrupted


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    rows = list(csv.DictReader(open(os.path.join(ARCHIVE, "recipes.csv"))))
    out, skipped = [], {"cited": 0, "no_ingredients": 0, "too_few_parsed": 0}
    for r in rows:
        if r["publication_flag"] == "yes":
            skipped["cited"] += 1
            continue
        if r["has_ingredients"] != "yes":
            skipped["no_ingredients"] += 1
            continue
        text = block_text(r["file"], r["anchor"])
        title = re.sub(r"\s+", " ", EMAIL.sub("", r["title"])).strip(" -=")  # never an email, even in a title
        author = clean_author(r["poster"])
        ingredients, steps, leftovers, interrupted = split(text, title, author)
        if len(ingredients) < 2 or not steps:
            skipped["too_few_parsed"] += 1
            continue
        m = SERVES.search(text)
        out.append({
            "key": r["key"],
            "url": BASE_URL + r["file"] + (f"#{r['anchor']}" if r["anchor"] else ""),
            "category": r["category"],
            "title": title[:80],
            "author": author,
            "posted": iso_date(r["date"]),
            "servings": int(m.group(1)) if m and 0 < int(m.group(1)) <= 24 else None,
            "ingredients": ingredients,
            "steps": steps,
            "leftovers": leftovers,
            "interrupted": interrupted,
        })
    json.dump(out, open(os.path.join(OUT_DIR, "parsed.json"), "w"), indent=1)
    names = {}
    for rec in out:
        for ing in rec["ingredients"]:
            k = ing["name"].lower()
            names[k] = names.get(k, 0) + 1
    print(f"parsed {len(out)} recipes; skipped {skipped}; {len(names)} distinct ingredient names")
    json.dump(sorted(names.items(), key=lambda x: -x[1]), open(os.path.join(OUT_DIR, "names.json"), "w"), indent=0)


if __name__ == "__main__":
    main()
