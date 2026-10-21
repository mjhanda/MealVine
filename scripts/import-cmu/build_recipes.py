#!/usr/bin/env python3
"""Step 2 of the CMU Recipe Archive import: turn build/parsed.json into Dishcart catalog code.

Run (from the repo root):
    npx tsx scripts/import-cmu/export-catalog.ts   # current catalog → build/catalog.json
    python3 scripts/import-cmu/parse_archive.py    # archive → build/parsed.json
    python3 scripts/import-cmu/build_recipes.py    # → src/data/importedRecipes.ts + catalog blocks
    npm run nutrition:build                        # regenerate nutrition for new ingredients

A recipe is imported only when every ingredient maps to a catalog ingredient and its amount
converts into that ingredient's unit family; everything else is listed with a reason in
build/review.csv and summarized in docs/recipes/cmu-import-report.md.
"""
import csv
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
from ingredient_map import MAP as BASE_MAP, SKIP  # noqa: E402
from new_ingredients import NEW  # noqa: E402
from normalize import normalize  # noqa: E402
from parse_archive import parse_ingredient  # noqa: E402

BUILD = os.path.join(HERE, "build")

# --- ingredient table -------------------------------------------------------------------------

VOLUME_TSP = {"pinch": 1 / 16, "tsp": 1, "tbsp": 3, "cup": 48, "pint": 96, "quart": 192, "gallon": 768, "ml": 0.2029, "cl": 2.029, "dl": 20.29, "l": 202.9}
WEIGHT_G = {"oz": 28.3495, "lb": 453.592, "g": 1, "kg": 1000}
COUNT_UNITS = {None, "large", "medium", "small"}

# Importer-only conversion data for existing catalog ingredients (grams per unit), used when the
# archive measures something differently from how Dishcart stores it.
EXTRA = {
    "chicken-breast": {"null": 170, "cup": 140}, "chicken-thighs": {"null": 115, "cup": 140},
    "ground-beef": {"cup": 225}, "sirloin": {"cup": 150, "null": 225}, "pork-tenderloin": {"cup": 140, "null": 450},
    "pork-chops": {"null": 170}, "ground-turkey": {"cup": 225}, "turkey-breast": {"cup": 140},
    "shrimp": {"cup": 145, "null": 15}, "salmon": {"null": 170, "cup": 140}, "cod": {"null": 170, "cup": 140},
    "firm-tofu": {"cup": 248, "null": 397}, "cream-cheese": {"cup": 232, "tbsp": 14.5},
    "fresh-mozzarella": {"cup": 112}, "tuna": {"cup": 160}, "eggs": {"cup": 243},
    "tomato": {"cup": 180}, "yellow-onion": {"cup": 160}, "red-onion": {"cup": 160}, "carrot": {"cup": 128},
    "bell-pepper": {"cup": 149}, "potato": {"cup": 150}, "sweet-potato": {"cup": 200}, "zucchini": {"cup": 124},
    "celery": {"cup": 101}, "garlic": {"tsp": 2.8, "head": 30}, "apple": {"cup": 125}, "banana": {"cup": 225},
    "avocado": {"cup": 230}, "cucumber": {"cup": 120}, "eggplant": {"cup": 82}, "peach": {"cup": 154},
    "green-onion": {"cup": 100}, "jalapeno": {"tbsp": 9}, "portobello": {"cup": 86},
    "diced-tomatoes": {"cup": 240}, "black-beans": {"cup": 172}, "kidney-beans": {"cup": 177},
    "white-beans": {"cup": 179}, "chickpeas": {"cup": 164}, "coconut-milk": {"cup": 226},
    "chicken-broth": {"can": 411}, "vegetable-broth": {"can": 411}, "tomato-sauce": {"can": 227},
    "tomato-paste": {"can": 170}, "lemon": {"null": 84}, "pineapple-chunks": {"can": 340},
    "ginger": {"slice": 3, "null": 28}, "broccoli-florets": {"head": 600, "null": 600, "bunch": 600}, "lime": {"null": 67}, "parsley": {"bunch": 60},
    "basil": {"bunch": 70}, "kale": {"bunch": 170}, "broccoli-florets": {"head": 600, "null": 600},
    "cauliflower-florets": {"head": 600, "null": 600, "bunch": 600}, "baby-spinach": {"bunch": 340, "oz": 28.35},
    "mint": {"bunch": 50}, "dill": {"bunch": 50}, "white-rice": {"lb": 453.6}, "rolled-oats": {"lb": 453.6},
    "cheddar": {"lb": 453.6}, "parmesan": {"lb": 453.6}, "mozzarella": {"lb": 453.6},
    # A soup can (10¾ oz) of milk; a drained can of mango or corn.
    "milk": {"can": 318}, "mango": {"can": 250}, "corn-kernels": {"can": 250},
}
# Grams in one package/item when the archive doesn't say (typical US sizes).
DEFAULT_PKG_G = {
    "cream-cheese": 227, "yeast": 7, "dark-chocolate-chips": 340, "raspberries": 283, "strawberries": 283,
    "mixed-berries": 283, "blueberries": 283, "baby-spinach": 283, "peach": 454, "shredded-coconut": 198,
    "unsweetened-chocolate": 227, "graham-cracker-crumbs": 255, "sour-cream": 227, "greek-yogurt": 227,
    "cheddar": 227, "mozzarella": 227, "parmesan": 85, "firm-tofu": 397, "egg-noodles": 340, "corn-kernels": 283,
    "broccoli-florets": 283, "green-beans": 283, "lasagna-noodles": 454, "whole-wheat-spaghetti": 454,
    "whole-wheat-penne": 454, "heavy-cream": 238, "half-and-half": 242, "chicken-broth": 411, "beef-broth": 411,
    "vegetable-broth": 411, "pecans": 170, "walnuts": 170, "almonds": 170, "raisins": 425, "dates": 227, "tortellini": 255,
}
# Items counted in the archive but measured here ("10 peppercorns", "2 whole cloves", "1 stock cube").
EACH_G = {
    "black-pepper": 0.05, "ground-cloves": 0.1, "almonds": 1.2, "walnuts": 4, "pecans": 2, "vanilla-extract": 13,
    "shredded-coconut": 400, "allspice": 0.1, "cardamom": 0.15, "chicken-broth": 240, "beef-broth": 240,
    "vegetable-broth": 240, "pineapple-chunks": 450, "mango": 200, "garlic": 3, "dark-chocolate-chips": 28.35,
    "unsweetened-chocolate": 28.35, "butter": 113, "cinnamon": 2.6, "milk": 244, "heavy-cream": 238,
    "graham-cracker-crumbs": 15, "cocoa-powder": 5.4, "baking-powder": 4.6, "ginger": 28, "cream-cheese": 227,
    "lasagna-noodles": 19, "basil": 0.5,
}
# Citrus counted by juice/zest yield (tbsp per fruit) — "2 tbsp lemon juice" → ⅔ lemon.
CITRUS = {"lemon": {"juice": 3, "zest": 1}, "lime": {"juice": 2, "zest": 0.67}, "orange": {"juice": 5, "zest": 1}}
NOMINAL = {"volume": (1, "tsp"), "count": (1, None), "weight": (1, "oz")}


def family_of(unit):
    if unit is None or unit == "null":
        return "count"
    if unit in ("tsp", "tbsp", "cup", "pinch"):
        return "volume"
    if unit in ("oz", "lb"):
        return "weight"
    return unit


def load_table():
    table = {}
    for d in json.load(open(os.path.join(BUILD, "catalog.json"))):
        units = d["units"] or ["null"]
        fam = family_of(units[0] if units[0] != "null" else None)
        canon = units[0] if units[0] != "null" else None
        grams = dict(d["grams"]) | EXTRA.get(d["id"], {})
        table[d["id"]] = {"id": d["id"], "family": fam, "unit": canon, "grams": grams, "tags": d.get("tags", []),
                          "staple": bool(d.get("staple")), "new": False}
    for n in NEW:
        table[n["id"]] = {"id": n["id"], "family": family_of(n["unit"]), "unit": n["unit"], "grams": dict(n["grams"]),
                          "tags": n["tags"], "staple": bool(n.get("staple")), "new": True, "spec": n}
        for k in ("each_g", "bunch_g", "head_g", "tbsp_g"):
            if k in n:
                table[n["id"]]["grams"][{"each_g": "null", "bunch_g": "bunch", "head_g": "head", "tbsp_g": "tbsp"}[k]] = n[k]
        if "can_cups" in n:
            cup = grams_per(table[n["id"]], "cup")
            if cup:
                table[n["id"]]["grams"]["can"] = n["can_cups"] * cup
    return table


def grams_per(ing, unit):
    """Grams in one `unit` of this ingredient, deriving volume units from each other."""
    g = ing["grams"]
    key = "null" if unit in COUNT_UNITS else unit
    if key in g:
        return g[key]
    if unit in VOLUME_TSP:
        for known in ("tsp", "tbsp", "cup"):
            if known in g:
                return g[known] / VOLUME_TSP[known] * VOLUME_TSP[unit]
    if unit in WEIGHT_G:
        return WEIGHT_G[unit]
    return None


NAME_MAP = dict(BASE_MAP)
for n in NEW:
    for name in n["names"]:
        NAME_MAP[name] = n["id"]

RAW_OVERRIDES = [
    (r"\b(ground|powdered|dry|dried) ginger\b|\bginger powder\b", "ground-ginger"),
    (r"\b(dry|dried|powdered|ground) mustard\b|\bmustard powder\b", "dry-mustard"),
    (r"\bmustard seeds?\b", "mustard-seed"),
    (r"\b(fresh|green) coriander\b|\bcoriander (leaves|leaf|sprigs?)\b|\bcilantro\b", "cilantro"),
    (r"\b(ground|whole) cloves?\b", "ground-cloves"),
    (r"\bpeanut oil\b", "peanut-oil"),
    (r"\bsesame oil\b", "sesame-oil"),
    (r"\bolive oil\b", "olive-oil"),
    (r"\bcoconut milk\b|\bcoconut cream\b", "coconut-milk"),
    (r"\bchicken (stock|broth|bouillon)\b", "chicken-broth"),
    (r"\bvegetable (stock|broth)\b", "vegetable-broth"),
    (r"\bbeef (stock|broth|bouillon)\b", "beef-broth"),
    (r"\bcream cheese\b", "cream-cheese"),
    (r"\bsour cream\b", "sour-cream"),
    (r"\bpeanut butter\b", "peanut-butter"),
    (r"\bbrown sugar\b", "brown-sugar"),
    (r"\b(powdered|confectioner'?s'?|icing) sugar\b", "powdered-sugar"),
    (r"\bbaking soda\b|\bbicarbonate\b", "baking-soda"),
    (r"\bbaking powder\b", "baking-powder"),
    (r"\bcake flour\b", "cake-flour"),
    (r"\b(whole ?wheat|wholemeal) flour\b", "whole-wheat-flour"),
    (r"\bevaporated milk\b", "evaporated-milk"),
    (r"\bcondensed milk\b", "condensed-milk"),
    (r"\bgreen onions?\b|\bscallions?\b|\bspring onions?\b", "green-onion"),
    (r"\bred onions?\b", "red-onion"),
    (r"\bred (pepper|chile|chili) flakes\b|\bcrushed red pepper\b", "red-pepper-flakes"),
    (r"\bcayenne\b", "cayenne"),
    (r"\bsoy sauce\b|\btamari\b", "soy-sauce"),
    (r"\bfish sauce\b", "fish-sauce"),
    (r"\boyster sauce\b", "oyster-sauce"),
    (r"\bworcestershire\b", "worcestershire-sauce"),
    (r"\bgarlic powder\b|\bgarlic salt\b", "garlic-powder"),
    (r"\bchili powder\b|\bchile powder\b", "chili-powder"),
    (r"\bcurry powder\b", "curry-powder"),
    (r"\bvanilla\b", "vanilla-extract"),
    (r"\balmond (extract|essence)\b", "almond-extract"),
    (r"\bcocoa\b", "cocoa-powder"),
    (r"\b(semi-?sweet|bittersweet|dark|milk) chocolate\b|\bchocolate (chips?|morsels?|pieces)\b", "dark-chocolate-chips"),
    (r"\bunsweetened chocolate\b|\bbaking chocolate\b", "unsweetened-chocolate"),
    (r"\bwhite wine vinegar\b", "white-wine-vinegar"),
    (r"\bred wine vinegar\b", "red-wine-vinegar"),
    (r"\b(cider|apple cider) vinegar\b", "cider-vinegar"),
    (r"\brice (wine )?vinegar\b", "rice-vinegar"),
    (r"\bbalsamic\b", "balsamic-vinegar"),
    (r"\bbutter ?milk\b", "buttermilk"),
    (r"\bheavy cream\b|\bwhipping cream\b", "heavy-cream"),
    (r"\bgraham\b", "graham-cracker-crumbs"),
    (r"\bbean sprouts?\b", "bean-sprouts"),
    (r"\bbamboo shoots?\b", "bamboo-shoots"),
    (r"\blemon ?grass\b", "lemongrass"),
    (r"\bstraw mushrooms?\b", "straw-mushrooms"),
]
RAW_OVERRIDES = [(re.compile(p, re.I), i) for p, i in RAW_OVERRIDES]
CITRUS_PART = re.compile(r"\b(juice|juiced)\b|\b(peel|zest|rind)\b", re.I)


def resolve(name, unit, raw, prep=None):
    """→ (id, prep_hint) or (None, reason)."""
    text = f"{name} {raw}".lower()
    nm = normalize(name)
    if prep and (not nm or nm not in NAME_MAP) and normalize(f"{name} {prep}") in NAME_MAP:
        nm = normalize(f"{name} {prep}")
        name = f"{name} {prep}"
    elif prep and not nm:
        nm, name = normalize(prep), prep
    if nm in SKIP or re.match(r"^(ice|water)\b", nm):
        return "SKIP", None
    for rx, ing_id in RAW_OVERRIDES:
        if rx.search(name):
            return ing_id, None
    if nm in ("clove", "cloves"):
        return ("ground-cloves" if unit in VOLUME_TSP and "garlic" not in text else "garlic"), None
    if nm == "chicken" and unit in COUNT_UNITS:
        return "whole-chicken", None
    # "3-4 lb chicken" is a whole bird; "1 lb chicken, cubed" is meat.
    if nm == "chicken" and unit in ("lb", "kg") and not re.search(r"breast|thigh|leg|wing|piece|part|cube|dice|bone|cooked|meat|strip|tender", text):
        return "whole-chicken", None
    ing_id = NAME_MAP.get(nm)
    if ing_id is None and re.search(r"\bor\b", name, re.I):
        # "spicy or regular pork sausage", "pearl or pot barley": the noun is in the last alternative.
        for alt in reversed(re.split(r"\s+or\s+", re.sub(r"\(.*?\)", " ", name), flags=re.I)[1:]):
            ing_id = NAME_MAP.get(normalize(alt))
            if ing_id:
                break
    if ing_id == "bell-pepper" and unit in ("tsp", "pinch") and "flake" not in text:
        return "cayenne", None  # "1/4 tsp red pepper" is ground red pepper
    if ing_id == "jalapeno" and unit in ("tsp", "pinch") and not re.search(r"fresh|green|minced|chopped|seeded", text):
        return "chili-powder", None  # "1 tsp chili" is the ground spice
    # "1 (16 oz) can tomatoes" is canned; "2 tomatoes (1 can … can be used)" is fresh.
    if ing_id == "tomato" and (unit in ("can", "pkg") or (unit is None and re.search(r"\bcans?\b|\boz\b", re.sub(r"\((?![^)]*\boz\b)[^)]*\)", " ", text)))):
        return "diced-tomatoes", None
    if ing_id is None:
        return None, f"unmapped: {nm or name}"
    if ing_id in ("white-rice", "brown-rice") and re.search(r",\s*cooked\s*$", raw.strip(" .")):
        return "cooked-" + ing_id, None  # "1 1/2 cups rice, cooked" is measured cooked
    return ing_id, None


# --- amounts ------------------------------------------------------------------------------------

FRACS = [0, 1 / 8, 1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4, 1]


def nice(n):
    if n >= 20:
        return float(round(n))
    if n >= 10:
        return round(n * 2) / 2
    whole = math.floor(n)
    frac = min(FRACS, key=lambda f: abs(f - (n - whole)))
    v = whole + frac
    return round(v if v > 0 else 1 / 8, 4)


def to_grams(ing, qty, unit, size_oz):
    if size_oz and unit in (None, "can", "pkg", "jar", "bottle", "large", "medium", "small"):
        return qty * size_oz * WEIGHT_G["oz"]
    if unit in ("pkg", "jar", "bottle") and ing["id"] in DEFAULT_PKG_G:
        return qty * DEFAULT_PKG_G[ing["id"]]
    if unit == "cube" and ing["id"] in ("chicken-broth", "beef-broth", "vegetable-broth"):
        return qty * 240  # one bouillon cube makes a cup of broth
    if unit in COUNT_UNITS and ing["id"] in EACH_G and "null" not in ing["grams"]:
        return qty * EACH_G[ing["id"]]
    if unit in WEIGHT_G:
        return qty * WEIGHT_G[unit]
    if unit == "stick" and ing["id"] in ("butter", "margarine"):
        return qty * 8 * 14.2
    g = grams_per(ing, unit)
    return qty * g if g else None


def convert(ing, qty, unit, size_oz, raw):
    """Archive (qty, unit) → (amount, unit) in the ingredient's family, or (None, reason)."""
    fam, canon = ing["family"], ing["unit"]
    if unit == "dash":
        unit = "pinch"
    if unit in ("sprig", "handful") and fam != "count":
        unit = "tbsp" if unit == "sprig" else "cup"
        qty = qty if unit == "tbsp" else qty / 2
    if fam == "volume":
        if unit in VOLUME_TSP:
            tsp = qty * VOLUME_TSP[unit]
            if unit in ("tsp", "tbsp", "cup", "pinch"):
                keep = unit
                if unit == "pinch" and ing["id"] not in ("salt", "black-pepper", "red-pepper-flakes", "cayenne", "nutmeg", "saffron", "cinnamon"):
                    keep = None
                return pick_volume(tsp, keep)
            return pick_volume(tsp, None)
        g = to_grams(ing, qty, unit, size_oz)
        cup_g = grams_per(ing, "cup")
        if g is None or not cup_g:
            return None, f"no conversion {unit or 'count'}→volume"
        return pick_volume(g / cup_g * 48, None)
    if fam == "weight":
        g = to_grams(ing, qty, unit, size_oz)
        if g is None:
            return None, f"no conversion {unit or 'count'}→weight"
        oz = g / WEIGHT_G["oz"]
        return (nice(oz / 16), "lb") if oz >= 16 else (nice(oz), "oz")
    if fam == "count":
        if unit in COUNT_UNITS and not size_oz:
            return nice(qty), None
        if ing["id"] in WHOLE_BIRDS:  # "3-4 lb chicken" → 1 chicken, never "1⅛ chickens"
            g = to_grams(ing, qty, unit, size_oz)
            each = grams_per(ing, None)
            if g and each:
                return float(max(1, round(g / each))), None
        if ing["id"] in CITRUS and unit in VOLUME_TSP:
            part = CITRUS_PART.search(raw or "")
            per = CITRUS[ing["id"]]["zest" if part and part.group(2) else "juice"]
            return max(nice(qty * VOLUME_TSP[unit] / 3 / per), 0.25), None
        g = to_grams(ing, qty, unit, size_oz)
        each = grams_per(ing, None)
        if g is None or not each:
            return None, f"no conversion {unit}→count"
        return max(nice(g / each), 0.25), None
    # Discrete family (clove, stalk, slice, can, head, bunch)
    if unit == fam or (unit in COUNT_UNITS and not size_oz):
        return max(nice(qty), 0.25), fam
    g = to_grams(ing, qty, unit, size_oz)
    per = grams_per(ing, fam)
    if g is None or not per:
        return None, f"no conversion {unit or 'count'}→{fam}"
    return max(nice(g / per), 0.25), fam


WHOLE_BIRDS = {"whole-chicken", "cornish-hen"}


def pick_volume(tsp, keep):
    if keep:
        return nice(tsp / VOLUME_TSP[keep]), keep
    if tsp >= 12:
        return nice(tsp / 48), "cup"
    if tsp >= 3:
        return nice(tsp / 3), "tbsp"
    return nice(tsp), "tsp"


def to_base(amount, unit):
    if unit in VOLUME_TSP:
        return amount * VOLUME_TSP[unit], "volume"
    if unit in ("oz", "lb"):
        return amount * (16 if unit == "lb" else 1), "weight"
    return amount, unit


# --- recipe-level ------------------------------------------------------------------------------

LEFTOVER_STRIP = re.compile(r"\b(to taste|as needed|as desired|if desired|optional|for garnish|for serving|for dusting|for frying|for greasing|pinch of|a pinch|dash of|a dash|a little|some|freshly ground|fresh|ground|plus extra|extra|more)\b|[():]", re.I)
MEASURED = re.compile(r"\b(\d+(?:\s+\d/\d)?|\d/\d)\s*(?:cups?|c\.|tablespoons?|tbsps?\.?|teaspoons?|tsps?\.?|ounces?|oz\.?|pounds?|lbs?\.?|grams?|gallons?|quarts?|pints?|cans?|packages?|pkgs?\.?|sticks?)\s+(?:of\s+)?((?:[a-z-]+\s?){1,3})", re.I)
TITLE_BRAND = re.compile(r"airlines?|restaurant|hotel|\binn\b|\bcaf[eé]\b|bistro|\bdiner\b|neiman|marcus|mrs\.? fields|famous|copy ?cat|knock-?off|\bclone\b|\bkfc\b|mcdonald|wendy'?s|olive garden|red lobster|disney|hershey|nestl[eé]|toll house|pepperidge|kraft|betty crocker|pillsbury|duncan hines|sara lee|starbucks|denny|ikea|cheesecake factory|cracker barrel|outback|hard rock|tgi|applebee|chili'?s\b|boston market|white castle|cinnabon|mrs\.? smith|bisquick|jell-?o|oreo|nabisco|kellogg|quaker|ghirardelli|baker'?s\b|hellmann|campbell", re.I)
# Posters whose archive entries are reposts of other people's (often published) recipes.
REPOSTERS = {"Stephanie da Silva"}
# The poster field names a book or publication instead of a person ("The Original Thai Cookbook by …").
CITED_AUTHOR = re.compile(r"cook ?book|magazine|newspaper|\bpress\b|publishing|\bbook\b", re.I)
# Recipes whose list is incomplete in a way the automatic checks can't see. URL path → reason.
EXCLUDE = {
    "meat/chicken/chick-coll-2.html#27": "stuffing ingredients are written into the method, not the list",
    "meat/chicken/chick-coll-1.html#4": "pesto, parsley, and parmesan are written into the method, not the list",
    "meat/beef/lebanese-sirloin-tips.html": "the rice dish uses vermicelli that isn't in the list",
    "casserole/tuna-cass.html": "the bread amount (8 slices) is only in the method",
    "ethnic/thai/thai-coll-1.html#17": "the rice noodles and peanut oil aren't in the list",
    "pie/pizza/caram-onion-pizza.html": "lists two alternative doughs, so the grocery list would double them",
    "sauces/mp-pasta-sauce-coll.html#16": "the meatball list and the sauce method run together; the oil isn't listed",
    "drink/strawberry-lemonade.html": "the lemon juice isn't in the list",
    "cake/jewish-apple-cake.html": "the method is garbled and the cinnamon topping isn't listed",
    "bread/muffin/sds-muffin-coll-3.html#28": "the whole-wheat flour is run into the cheese line",
    "cookies/mp-cookie-coll-2.html#2": "the method starts mid-sentence (part of the list is missing)",
    "sauces/potsticker-dipping/potsticker-dipping-sauce-3.html": "the hot oil and dark soy sauce are only described in notes",
}
# Meal type checked by hand where the category guesses wrong. URL path → meal type.
MEAL_OVERRIDE = {
    "ethnic/mexican/spin-empanada.html": "snack",  # bite-size pastries, a teaspoon of filling each
}
SIGNOFF = {"mara", "amyl", "enjoy", "enjoy!", "cheers", "bon appetit"}
COOK_VERB = re.compile(r"\b(mix|stir|bake|cook|boil|simmer|combine|add|heat|fry|saute|sauté|beat|whisk|blend|pour|serve|place|chop|cut|knead|roast|grill|broil|toss|fold|spread|chill|refrigerate|freeze|marinate|steam|melt|preheat|puree|process|season|drain|cover|bring)\b", re.I)


def leftover_to_ingredients(line, author):
    """Qty-less lines like "salt and pepper to taste". → (list of (id, amount, unit, prep), problem|None)"""
    low = line.lower().strip(" .")
    if low in SIGNOFF or (author and low in author.lower().split()):
        return [], None
    if re.match(r"^oven temp", low) or re.match(r"^-?[^()]*\)$", low):
        return [], None  # an oven note, or the tail of the line above ("well-drained)")
    citrus = re.search(r"\b(juice|zest|rind|peel)\s+(?:of\s+)?(\d+(?:/\d+)?|one|two|three|half|a|an|1/2)\s+(lemon|lime|orange)s?\b", low)
    if citrus:
        n = {"one": 1, "a": 1, "an": 1, "two": 2, "three": 3, "half": 0.5}.get(citrus.group(2))
        n = n if n is not None else eval(citrus.group(2))
        prep = "juiced" if citrus.group(1) == "juice" else "zested"
        return [("PARSED", {"qty": n, "unit": None, "name": citrus.group(3), "prep": prep, "sizeOz": None, "raw": line})], None
    parsed = parse_ingredient(line)
    if parsed:
        return [("PARSED", parsed)], None
    core = LEFTOVER_STRIP.sub(" ", re.sub(r"\bfor\b.*$", "", low.split("(")[0]))  # "oil for rubbing burgers"
    parts = [p.strip() for p in re.split(r",|&|\band\b|/|\bor\b", core) if p.strip()]
    if not parts:
        return [], None
    out = []
    for p in parts[:1] if re.search(r"\bor\b", core) else parts:
        ing_id, _ = resolve(p, None, line)
        if ing_id == "SKIP":
            continue
        if ing_id is None:
            return [], f"unparsed line: {line[:60]}"
        out.append(("NOMINAL", (ing_id, line)))
    return out, None


def nominal(ing, line):
    """An ingredient listed without an amount ("salt to taste", "lime wedges"): a small, honest default."""
    i, fam = ing["id"], ing["family"]
    low = line.lower()
    prep = "to taste" if "taste" in low else ("for serving" if re.search(r"serv|wedge|garnish|sprinkl|dust", low) else "as needed")
    if i in ("salt", "black-pepper", "red-pepper-flakes", "cayenne"):
        return {"id": i, "amount": 1, "unit": "pinch", "prep": prep}
    if fam == "volume":
        return {"id": i, "amount": 1, "unit": "tsp" if ing["unit"] == "tsp" else "tbsp", "prep": prep}
    if fam == "weight":
        return {"id": i, "amount": 4, "unit": "oz", "prep": prep}
    if fam == "count":
        return {"id": i, "amount": 1, "unit": None, "prep": prep}
    return {"id": i, "amount": 2 if fam in ("clove", "slice") else 1, "unit": fam, "prep": prep}


def merge(items, table):
    """Combine repeated ingredients (crust + filling) into one line."""
    by_id = {}
    order = []
    for it in items:
        if it["id"] not in by_id:
            by_id[it["id"]] = [it]
            order.append(it["id"])
        else:
            by_id[it["id"]].append(it)
    out = []
    for ing_id in order:
        # A stand-in line ("bouillon cubes only if you use water") doesn't add to the line it replaces.
        group = [g for g in by_id[ing_id] if not g.get("alt")] or by_id[ing_id]
        if len(group) == 1:
            out.append(group[0])
            continue
        if ing_id == "eggs":
            whole = sum(g["amount"] for g in group if not g.get("eggpart"))
            yolks = sum(g["amount"] for g in group if g.get("eggpart") == "yolk")
            whites = sum(g["amount"] for g in group if g.get("eggpart") == "white")
            bits = [f"{n:g} {w}" for n, w in ((whole, "whole"), (yolks, "yolks" if yolks != 1 else "yolk"), (whites, "whites" if whites != 1 else "white")) if n]
            total = max(whole, yolks, whites) if not whole else whole + max(yolks, whites)
            out.append({"id": ing_id, "amount": nice(total), "unit": None, "prep": ", ".join(bits)})
            continue
        base, fam = 0.0, None
        for g in group:
            b, f = to_base(g["amount"], g["unit"])
            base += b
            fam = f
        unit = group[0]["unit"]
        if fam == "volume":
            amount, unit = pick_volume(base, None)
        elif fam == "weight":
            amount, unit = (nice(base / 16), "lb") if base >= 16 else (nice(base), "oz")
        else:
            amount = nice(base)
        out.append({"id": ing_id, "amount": amount, "unit": unit, "prep": "divided"})
    return out


def servings_of(rec, text_servings, meal):
    if text_servings:
        return text_servings
    cat = rec["category"]
    for key, n in (("muffin", 12), ("pancake", 4), ("cookie", 24), ("candy", 24), ("cheesecake", 12), ("cake", 12),
                   ("pie/sweet", 8), ("pie/pizza", 4), ("icecream", 6), ("bread", 12), ("preserves", 16),
                   ("sauces", 8), ("dip", 8), ("appetizers", 8), ("soup", 6), ("salad", 4), ("dessert", 8), ("drink", 4)):
        if key in cat:
            return n
    return 4


def meal_type_of(rec):
    cat, title = rec["category"], rec["title"].lower()
    if re.search(r"muffin|pancake|waffle|scone|granola|french toast|crepe|breakfast|brunch|oatmeal|porridge|coffee ?cake|biscuit", title) or cat in ("bread/muffin", "bread/pancakes"):
        return "breakfast"
    if cat.startswith(("cake", "cookies", "candy", "dessert")) or cat in ("pie/sweet", "souffle/sweet") or \
            re.search(r"\b(cake|cookies?|brownies?|fudge|pudding|ice cream|sorbet|mousse|truffles?|cheesecake|tiramisu|cobbler|crisp|tart|pie|bars|frosting|icing)\b", title) and not cat.startswith(("meat", "pie/pizza", "seafood", "soup")):
        return "dessert"
    if cat.startswith(("sauces", "preserves", "salad/salad-dressing")) or "dressing" in title or "marinade" in title:
        return "side"
    if cat.startswith(("appetizers", "drink", "cheese")) or re.search(r"\b(dip|salsa|spread|hummus|guacamole)\b", title):
        return "snack"
    if cat.startswith("bread"):
        return "breakfast" if re.search(r"banana|zucchini|pumpkin|date|nut|apple|cranberry|cinnamon|sweet|raisin|orange|lemon|carrot", title) else "side"
    if re.search(r"\b(naan|tortillas?|chapatis?|rotis?|pitas?|flatbreads?|biscuits|rolls|bread)\b", title) and not re.search(r"sandwich|pudding|salad|soup", title):
        return "side"
    if cat.startswith("salad"):
        return "lunch"
    if cat in ("vegetables", "vegetables/potato", "vegetables/capsicum", "vegetables/zuchinni", "grain", "misc") or re.search(r"\b(marinated|pickled|side|relish|stuffing|dressing)\b", title):
        return "side"
    return "dinner"


PROTEIN_ORDER = [("pork", "pork"), ("red-meat", "beef"), ("fish", "fish"), ("shellfish", "fish"), ("poultry", "chicken")]


def protein_of(ingredients, table):
    grams = Counter()
    for i in ingredients:
        tags = table[i["id"]]["tags"]
        for tag, label in PROTEIN_ORDER:
            if tag in tags:
                g = to_grams(table[i["id"]], i["amount"], i["unit"], None) or 1
                # Broth/stock and lard flavor a dish; they only decide the label if nothing else does.
                weight = 0.01 if i["id"] in ("chicken-broth", "beef-broth", "lard", "worcestershire-sauce", "fish-sauce", "oyster-sauce", "bacon", "cream-of-chicken-soup", "steak-sauce") else 1
                grams[label] += g * weight
    if not grams:
        return "vegetarian"
    label = grams.most_common(1)[0][0]
    if label == "chicken" and any(i["id"] in ("turkey-breast", "ground-turkey", "turkey-sausage", "deli-turkey") for i in ingredients):
        return "turkey"
    if label == "beef" and any(i["id"] == "lamb" for i in ingredients):
        return "lamb"
    return label


DURATION = re.compile(r"(\d+)(?:\s+(1/2|1/4|3/4))?(?:\s*(?:-|to|or)\s*(\d+)(?:\s+(1/2|1/4|3/4))?)?\s*(minutes?|mins?\.?|hours?|hrs?\.?)\b", re.I)


def time_of(steps, ingredients, meal, category):
    total = 0.0
    text = " ".join(steps)
    for m in DURATION.finditer(text):
        lo = float(m.group(1)) + (eval(m.group(2)) if m.group(2) else 0)
        hi = float(m.group(3)) + (eval(m.group(4)) if m.group(4) else 0) if m.group(3) else lo
        mins = max(lo, hi) * (60 if m.group(5).lower().startswith("h") else 1)
        total += mins
    words = {"a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "ten": 10, "fifteen": 15, "twenty": 20, "thirty": 30, "forty": 40, "forty-five": 45}
    for m in re.finditer(r"\b(half an?|a half|an|a|one|two|three|four|five|six|ten|fifteen|twenty|thirty|forty-five|forty)\s+(hours?|minutes?)\b", text, re.I):
        n = 0.5 if "half" in m.group(1).lower() else words[m.group(1).lower()]
        total += n * (60 if m.group(2).lower().startswith("h") else 1)
    if re.search(r"\bovernight\b", text, re.I):
        total += 480
    prep = min(30, 5 + 2 * len(ingredients))
    if total == 0:
        total = {"breakfast": 20, "dessert": 35, "side": 15, "snack": 0, "lunch": 15, "dinner": 30}[meal]
    return prep, int(min(total, 1440) // 5 * 5) or 5


EMOJI = [
    (r"muffin", "🧁"), (r"pancake|crepe", "🥞"), (r"waffle", "🧇"), (r"scone|biscuit", "🥐"), (r"cheesecake", "🍰"),
    (r"brownie|fudge|truffle|chocolate", "🍫"), (r"cookie|shortbread|biscotti", "🍪"), (r"\bpie\b|tart|cobbler", "🥧"),
    (r"pizza", "🍕"), (r"cake", "🍰"), (r"candy|toffee|brittle|caramel", "🍬"), (r"ice cream|gelato", "🍨"),
    (r"sorbet|granita|sherbet", "🍧"), (r"pudding|mousse|custard|flan", "🍮"), (r"chili\b|chilli", "🌶️"),
    (r"curry|masala|dal|dhal|korma|vindaloo", "🍛"), (r"soup|stew|chowder|bisque|gumbo", "🍲"), (r"salsa|pico", "🍅"),
    (r"guacamole|avocado", "🥑"), (r"hummus|dip", "🥣"), (r"pesto", "🌿"), (r"dressing|vinaigrette", "🥗"),
    (r"salad", "🥗"), (r"kim ?chee|kimchi|sauerkraut|pickle", "🥬"), (r"jam|jelly|preserve|marmalade|chutney", "🍓"),
    (r"sauce|gravy|marinade|glaze", "🥫"), (r"shrimp|prawn", "🍤"), (r"fish|salmon|tuna|cod|sole", "🐟"),
    (r"chicken|turkey", "🍗"), (r"beef|steak|burger|meatball|meat ?loaf", "🥩"), (r"pork|ham|bacon|sausage", "🍖"),
    (r"pasta|spaghetti|lasagna|noodle|fettuccine|linguine|macaroni|penne|ravioli", "🍝"), (r"thai|pad |ramen|pho", "🍜"),
    (r"rice|pilaf|risotto|paella", "🍚"), (r"couscous|bulgur|tabbouleh|quinoa", "🥘"), (r"bread|loaf|roll|bun|focaccia", "🍞"),
    (r"potato", "🥔"), (r"egg|souffl|quiche|omelet", "🥚"), (r"cheese|fondue", "🧀"), (r"punch|drink|smoothie|lemonade|tea\b", "🥤"),
    (r"casserole|bake", "🥘"), (r"vegetable|veggie|zucchini|eggplant|broccoli|spinach", "🥦"),
]


def emoji_of(title, category):
    t = f"{title} {category}".lower()
    for rx, e in EMOJI:
        if re.search(rx, t):
            return e
    return "🍽️"


def clean_title(t, category=""):
    t = re.sub(r"\s*\((?:[^)]*)\)\s*$", "", t).strip(" .-:")
    t = re.sub(r"^mw\s+", "Microwave ", t, flags=re.I)
    if category == "bread/muffin" and not re.search(r"muffin", t, re.I):
        t = f"{t} Muffins"
    if category == "bread/pancakes" and not re.search(r"pancake|waffle|crepe|blini|flapjack|hotcake", t, re.I):
        t = f"{t} Pancakes"
    t = re.sub(r"^(recipe|re|fwd?)\s*:\s*", "", t, flags=re.I)
    if t.isupper() or t.islower():
        t = t.title()
    return t[:60].strip()


def clean_steps(steps, title):
    out = []
    head = re.compile(r"^" + re.escape(title.upper()) + r"\s*", re.I) if title else None
    for s in steps:
        s = re.sub(r"\s+", " ", s).strip()
        if head and not out:
            s = head.sub("", s)
        # Leading ALL-CAPS title echo ("CHICKEN ADOBO (serves 2) …")
        s = re.sub(r"^(?:[A-Z][A-Z'&-]+\s){2,}(?:\([^)]*\)\s*)?", "", s) if not out else s
        s = s.strip(" -:")
        if len(s) < 3:
            continue
        out.append(s[0].upper() + s[1:])
    while out and not COOK_VERB.search(out[0]) and re.search(r"as needed|of your choice|to taste|optional|\bcups? of\b", out[0], re.I):
        out.pop(0)  # an ingredient note that landed above the method
    if out and not out[-1].rstrip().endswith((".", "!", "?", ")", '"')):
        cut = max(out[-1].rfind(". "), out[-1].rfind("! "), out[-1].rfind("? "))
        if cut > 0:
            out[-1] = out[-1][:cut + 1]
        elif len(out) > 1:
            out.pop()
    return out


SERVES = re.compile(r"\b(?:serves|servings?|yields?)\s*[:\-]?\s*(?:about\s+)?(\d+)|\bmakes\s*:?\s*(?:about\s+)?(\d+)\s*(dozen|servings|muffins|cookies|pieces|portions|bars|squares|scones|pancakes|waffles|biscuits|rolls|crepes|people)", re.I)


def text_servings(rec):
    for m in SERVES.finditer(" ".join(rec["steps"]) + " " + rec.get("raw_servings", "")):
        if m.group(1):
            n = int(m.group(1))
        else:
            n = int(m.group(2)) * (12 if m.group(3).lower() == "dozen" else 1)
        if 0 < n <= 72:
            return n
    s = rec.get("servings")
    return s if s and 0 < s <= 24 else None


# Amounts given only as proportions ("mix one part each soy sauce and vinegar… one part = 1/2 cup").
RATIO = re.compile(r"\bone part (each|=)|\bparts? =\s*\d", re.I)


MEAT_WORDS = re.compile(r"\b(steaks?|chicken|beef|pork|lamb|veal|turkey|shrimp|prawns?|fish|salmon|tuna|cod|crab|lobster|scallops?|clams?|mussels?|ham|bacon|sausages?|wings?|drumsticks?|thighs?|breasts?|fillets?|ribs?|roast|meatballs?|hamburger|venison|duck|goose|anchov(?:y|ies))\b(?!\s+(?:broth|stock|bouillon|soup base|cubes?|flavou?r))", re.I)
# Title words that name a style, not an ingredient ("Pound Cake", "Hot Sauce").
TITLE_IGNORE = {"pound", "hot", "sweet", "sour", "green", "red", "white", "black", "brown", "yellow", "cream", "sauce",
                "dressing", "soup", "salad", "bread", "cake", "pie", "cookies", "cookie", "muffin", "muffins", "spice",
                "spiced", "dip", "punch", "pudding", "sponge", "mock", "dutch", "french", "italian", "chinese", "thai",
                "indian", "mexican", "greek", "jerked", "jerk", "fried", "baked", "stuffed", "easy", "quick", "fudge",
                "glaze", "frosting", "icing", "topping", "filling", "syrup", "butter", "stock", "broth", "salsa", "pepper",
                # the thing being made, or what a sauce is served with
                "ketchup", "pita", "tortilla", "tortillas", "spaghetti", "linguine", "lasagna", "primavera", "fettucine",
                "fettuccine", "coffee", "pasta", "noodle", "noodles"}


_PASTA = {"pasta", "whole-wheat-spaghetti", "whole-wheat-penne", "lasagna-noodles", "egg-noodles", "soba", "white-rice", "whole-wheat-orzo"}
_RICE = {"white-rice", "brown-rice", "cooked-white-rice", "cooked-brown-rice"}
DEFINITE_STARCH = {"noodles": _PASTA, "pasta": _PASTA, "spaghetti": _PASTA, "linguine": _PASTA, "fettuccine": _PASTA,
                   "macaroni": _PASTA, "rice": _RICE, "tortillas": {"flour-tortilla", "corn-tortilla", "whole-wheat-tortilla"}}


def same_family(ing_id, have, table):
    """Title says "Berry Muffins" and the list has raspberries; "Cheese" with cheddar, etc."""
    groups = [{"mixed-berries", "raspberries", "strawberries", "blueberries", "cranberries"},
              {"cheddar", "parmesan", "mozzarella", "swiss-cheese", "gruyere", "feta", "ricotta", "cream-cheese", "cottage-cheese", "fresh-mozzarella"},
              {"chicken-breast", "chicken-thighs", "whole-chicken", "ground-chicken"},
              {"yellow-onion", "red-onion", "green-onion", "shallot"},
              {"sirloin", "ground-beef"}, {"pork-tenderloin", "pork-chops", "ground-pork", "pork-sausage", "ham", "bacon"},
              {"cod", "salmon", "tuna", "anchovies"}, {"pasta", "whole-wheat-spaghetti", "whole-wheat-penne", "lasagna-noodles", "egg-noodles"},
              {"white-rice", "brown-rice", "cooked-white-rice", "cooked-brown-rice"}, {"tomato", "cherry-tomatoes", "diced-tomatoes", "tomato-sauce", "tomato-paste"},
              {"all-purpose-flour", "whole-wheat-flour", "cake-flour", "self-rising-flour", "rye-flour"},
              {"dark-chocolate-chips", "unsweetened-chocolate", "cocoa-powder"}, {"lemon", "lime", "orange"},
              {"apple", "applesauce", "apple-juice"}, {"pineapple-chunks", "pineapple-juice"}, {"orange", "orange-juice"},
              {"peanuts", "peanut-butter"}, {"corn-kernels", "cornmeal"},
              {"mushrooms", "portobello", "straw-mushrooms", "cream-of-mushroom-soup"}, {"pumpkin-puree", "winter-squash"}, {"coffee", "instant-coffee"}]
    return any(ing_id in g and g & have for g in groups)


def title_key(t):
    """Title for duplicate checks: case, punctuation, plurals, and our "· Poster" suffix ignored."""
    t = re.sub(r" · .*$", "", t.lower())
    t = re.sub(r"[^a-z ]", " ", t)
    return " ".join(w[:-1] if w.endswith("s") and len(w) > 3 else w for w in t.split() if w not in ("the", "a", "with", "and", "easy", "my", "best", "quick"))


def slug(key):
    return "cmu-" + re.sub(r"[^a-z0-9]+", "-", key.lower().replace(".html", "")).strip("-")


def build():
    table = load_table()
    parsed = json.load(open(os.path.join(BUILD, "parsed.json")))
    # Already hand-adapted (r121+): skip by URL.
    existing_src = open(os.path.join(ROOT, "src/data/recipes.ts")).read()
    adapted_urls = set(re.findall(r"url: '([^']+)'", existing_src))
    hand_titles = {title_key(t) for t in re.findall(r"title: '((?:[^'\\]|\\.)*)'", existing_src)}
    hand_titles |= {title_key(t) for t in re.findall(r'title: "([^"]*)"', existing_src)}
    rec_by_id = {}

    recipes, review = [], []
    for rec in parsed:
        if rec["url"] in adapted_urls:
            continue
        if TITLE_BRAND.search(rec["title"]) or TITLE_BRAND.search(" ".join(i["raw"] for i in rec["ingredients"])):
            review.append((rec, ["names a company or brand"]))
            continue
        if CITED_AUTHOR.search(rec["author"]):
            review.append((rec, ["credited to a cookbook or publication"]))
            continue
        excluded = EXCLUDE.get(rec["url"].split("/recipes/", 1)[-1])
        if excluded:
            review.append((rec, [f"checked by hand: {excluded}"]))
            continue
        if rec["author"] in REPOSTERS:
            review.append((rec, ["reposted from another source (not the poster's own recipe)"]))
            continue
        problems, items = [], []
        for p in rec["ingredients"]:
            each = re.match(r"^each:?\s+(.+)$", p["name"], re.I)
            if each:
                # "1/2 tsp each: rosemary, sage, oregano" — the comma split put the rest in prep.
                names = each.group(1) + ("," + p["prep"] if p.get("prep") and ":" in p["name"] else "")
                for part in re.split(r",|\band\b|&", names):
                    if part.strip():
                        items.append(("PARSED", {**p, "name": part.strip(), "prep": None}))
                continue
            items.append(("PARSED", p))
        for line in rec.get("leftovers", []):
            got, problem = leftover_to_ingredients(line, rec["author"])
            if problem:
                problems.append(problem)
            items.extend(got)
        out = []
        for kind, p in items:
            if kind == "NOMINAL":
                ing_id, line = p
                out.append(nominal(table[ing_id], line))
                continue
            ing_id, why = resolve(p["name"], p["unit"], p["raw"], p.get("prep"))
            if ing_id == "SKIP":
                continue
            if ing_id is None:
                problems.append(why)
                continue
            ing = table[ing_id]
            amount, unit = convert(ing, p["qty"], p["unit"], p.get("sizeOz"), p["raw"])
            if amount is None:
                problems.append(f"{ing_id}: {unit}")
                continue
            item = {"id": ing_id, "amount": amount, "unit": unit if unit != "null" else None}
            raw_low = p["raw"].lower()
            if ing_id == "eggs":
                item["eggpart"] = "yolk" if "yolk" in raw_low else ("white" if "white" in raw_low else None)
                if item["eggpart"]:
                    item["prep"] = "yolks" if item["amount"] > 1 and item["eggpart"] == "yolk" else ("whites" if item["amount"] > 1 else item["eggpart"])
            elif ing_id in CITRUS and p["unit"] in VOLUME_TSP:
                part = CITRUS_PART.search(raw_low)
                item["prep"] = "zested" if part and part.group(2) else "juiced"
            if re.search(r"\bonly if\b|\binstead\b", raw_low):
                item["alt"] = True  # "5 bouillon cubes (ONLY if you use water)": a stand-in for another line
            if "optional" in raw_low:
                item["prep"] = ((item.get("prep") or "") + ", optional").strip(", ")
            elif p.get("prep") and ing_id not in ("eggs",) and len(p["prep"]) <= 40 and "@" not in p["prep"]:
                item.setdefault("prep", re.sub(r"\s+", " ", p["prep"]).strip(" ,.;").lower())
            out.append(item)
        steps = clean_steps(rec["steps"], rec["title"])
        have = {i["id"] for i in out}
        for m in MEASURED.finditer(" ".join(steps)):
            words = m.group(2).split()
            for n in (3, 2, 1):
                ing_id, _ = resolve(" ".join(words[:n]), None, "")
                if ing_id and ing_id != "SKIP":
                    if ing_id not in have and not (ing_id in ("salt", "black-pepper") and "salt" in have):
                        problems.append(f"method uses {ing_id} not in the list")
                    break
        # The dish's main ingredient must be in the list: anything the title names, and any meat or
        # fish the method cooks. A missing protein would also mislabel the recipe as vegetarian.
        tw = re.findall(r"[a-z]+", clean_title(rec["title"], rec["category"]).lower())
        # A word inside a two-word name the list has ("Sweet Potato" → sweet-potato) isn't checked alone.
        covered = {j for k in range(len(tw) - 1) if resolve(" ".join(tw[k:k + 2]), None, "")[0] in have for j in (k, k + 1)}
        for n in (2, 1):
            for k in range(len(tw) - n + 1):
                phrase = " ".join(tw[k:k + n])
                if any(w in TITLE_IGNORE for w in phrase.split()) or (n == 1 and k in covered):
                    continue
                ing_id, _ = resolve(phrase, None, "")
                if ing_id and ing_id != "SKIP" and ing_id not in have and not same_family(ing_id, have, table):
                    problems.append(f"title names {ing_id} but the list lacks it")
        meat_tags = {"poultry", "red-meat", "pork", "fish", "shellfish"}
        # Sauces and sides often say "serve over chicken"; only dinners/lunches, or a meat word in the
        # title, must actually contain the meat.
        meat_in_title = MEAT_WORDS.search(rec["title"])
        if (meal_type_of(rec) in ("dinner", "lunch") or meat_in_title) and not any(set(table[i]["tags"]) & meat_tags - ({"poultry"} if i == "chicken-broth" else set()) - ({"red-meat"} if i == "beef-broth" else set()) for i in have):
            m = MEAT_WORDS.search(" ".join(steps) + " " + rec["title"])
            if m:
                problems.append(f"method cooks {m.group(1).lower()} but the list has no meat or fish")
        # "Cook the noodles" refers to something in the list; it has to be there.
        for word, family in DEFINITE_STARCH.items():
            if re.search(rf"\bthe {word}\b", " ".join(steps), re.I) and not (have & family) and word not in rec["title"].lower():
                problems.append(f"method uses the {word} but the list has none")
                break
        if RATIO.search(" ".join(steps)):
            problems.append("method gives amounts as ratios (one part / two parts)")
        if title_key(clean_title(rec["title"], rec["category"])) in hand_titles:
            problems.append("same dish as a Dishcart recipe")
        if rec.get("interrupted"):
            problems.append("method text is interleaved with the ingredient list")
        if problems:
            review.append((rec, problems))
            continue
        method = " ".join(steps)
        if re.search(r"\bpie (crust|shell)|\bpastry (shell|crust)|\bunbaked (pie|pastry)|\bfavou?rite (pie )?crust\b", method, re.I) \
                and not any(i["id"] in ("pie-crust", "all-purpose-flour", "graham-cracker-crumbs") for i in out):
            out.append({"id": "pie-crust", "amount": 1, "unit": None, "prep": "store-bought or homemade"})
        merged = merge(out, table)
        for m in merged:
            m.pop("eggpart", None)
            m.pop("alt", None)
            if not m.get("prep"):
                m.pop("prep", None)
        if len(merged) < 2:
            review.append((rec, ["fewer than 2 ingredients"]))
            continue
        if sum(len(s) for s in steps) < 60 or not COOK_VERB.search(" ".join(steps)):
            review.append((rec, ["instructions too thin to follow"]))
            continue
        meal = MEAL_OVERRIDE.get(rec["url"].split("/recipes/", 1)[-1]) or meal_type_of(rec)
        prep, cook = time_of(steps, merged, meal, rec["category"])
        recipes.append({
            "id": slug(rec["key"]),
            "title": clean_title(rec["title"], rec["category"]),
            "mealType": meal,
            "protein": protein_of(merged, table),
            "prep": prep,
            "cook": cook,
            "servings": servings_of(rec, text_servings(rec), meal),
            "emoji": emoji_of(rec["title"], rec["category"]),
            "batch": meal in ("dessert", "side") or rec["category"].startswith(("bread", "preserves", "sauces", "candy", "cookies", "cake")),
            "ingredients": merged,
            "steps": steps,
            "source": {"title": rec["title"], "author": rec["author"], "posted": rec.get("posted"), "url": rec["url"]},
        })
        rec_by_id[recipes[-1]["id"]] = rec
    # The same recipe posted twice (same name, same ingredients): keep the first.
    kept, first_by_sig = [], {}
    for r in recipes:
        sig = (title_key(r["title"]), tuple(sorted(i["id"] for i in r["ingredients"])))
        if sig in first_by_sig:
            other = first_by_sig[sig]
            review.append((rec_by_id[r["id"]], [f"duplicate of {other['title']} by {other['source']['author']}"]))
            continue
        first_by_sig[sig] = r
        kept.append(r)
    recipes = kept
    # Disambiguate duplicate titles with the poster's first name.
    counts = Counter(r["title"].lower() for r in recipes)
    seen = Counter()
    for r in recipes:
        if counts[r["title"].lower()] > 1:
            first = (r["source"]["author"].split() or ["?"])[0]
            if first.lower() in ("a", "rec.food.cooking"):
                first = "archive"
            r["title"] = f"{r['title']} · {first}"
        seen[r["title"].lower()] += 1
        if seen[r["title"].lower()] > 1:
            r["title"] = f"{r['title']} {seen[r['title'].lower()]}"
    return table, recipes, review


def stats(recipes, review):
    reasons = Counter()
    for _, probs in review:
        for p in set(probs):
            reasons[re.sub(r"^(unmapped|unparsed line|no amount): .*", lambda m: m.group(0)[:48], p)] += 1
    solo = Counter(probs[0] for _, probs in review if len(set(probs)) == 1)
    return reasons, solo


if __name__ == "__main__" and "--dry" in sys.argv:
    table, recipes, review = build()
    reasons, solo = stats(recipes, review)
    print(f"imported {len(recipes)}; review {len(review)}")
    print("by meal:", Counter(r["mealType"] for r in recipes).most_common())
    print("top reasons:", reasons.most_common(70))
    print("\nsole reason:", solo.most_common(70))


# --- emit -----------------------------------------------------------------------------------------

GEN_START = "  // --- CMU import additions (generated by scripts/import-cmu/build_recipes.py) ---"
GEN_END = "  // --- end CMU import additions ---"
AISLE_CONST = {"Produce": "P", "Meat & Seafood": "M", "Dairy & Eggs": "D", "Bakery & Bread": "B",
               "Pasta, Rice & Grains": "G", "Canned & Jarred": "C", "Oils & Condiments": "O",
               "Spices & Baking": "S", "Snacks & Nuts": "N", "Frozen": "F"}


def q(v):
    return json.dumps(v, ensure_ascii=False)


def key(k):
    return k if re.match(r"^[a-z][a-zA-Z0-9]*$", k) else q(k)


def splice(path, start_marker_before, block):
    """Replace the generated block (or insert it before `start_marker_before`)."""
    text = open(path).read()
    if GEN_START in text:
        a, b = text.index(GEN_START), text.index(GEN_END) + len(GEN_END) + 1
        text = text[:a] + block + text[b:]
    else:
        i = text.index(start_marker_before)
        text = text[:i] + block + text[i:]
    open(path, "w").write(text)


def emit(table, recipes, review):
    used = {i["id"] for r in recipes for i in r["ingredients"]}
    new_used = [n for n in NEW if n["id"] in used]
    # ingredients.ts
    lines = [GEN_START]
    for n in new_used:
        extra = {}
        if n.get("staple"):
            extra["staple"] = True
        if n.get("plural"):
            extra["plural"] = n["plural"]
        aisle = AISLE_CONST.get(n["aisle"], q(n["aisle"]))
        tags = "[" + ", ".join(f"'{t}'" for t in n["tags"]) + "]"
        ex = "" if not extra else ", { " + ", ".join(f"{k}: {q(v) if not isinstance(v, bool) else 'true'}" for k, v in extra.items()) + " }"
        lines.append(f"  [{q(n['id'])}, {q(n['name'])}, {aisle}, {tags}{ex}],")
    lines.append(GEN_END + "\n")
    splice(os.path.join(ROOT, "src/data/ingredients.ts"), "];\n\nexport const INGREDIENTS", "\n".join(lines))
    # usdaMap.ts: USDA_MAP and GRAMS
    usda = open(os.path.join(ROOT, "src/data/nutrition/usdaMap.ts")).read()
    m_lines, g_lines = [GEN_START], [GEN_START]
    for n in new_used:
        note = f", note: {q(n['note'])}" if n.get("note") else ""
        refuse = f", refuse: {n['refuse']}" if n.get("refuse") else ""
        m_lines.append(f"  {q(n['id'])}: {{ parts: [{{ fdcId: {n['fdc']}, weight: 1 }}], basis: '{n['basis']}'{note}{refuse} }},")
        grams = table[n["id"]]["grams"]
        g_lines.append(f"  {q(n['id'])}: {{ " + ", ".join(f"{key(k)}: {round(v, 2)}" for k, v in grams.items()) + " },")
    m_lines.append(GEN_END + "\n")
    g_lines.append(GEN_END + "\n")
    if GEN_START in usda:  # drop both old blocks, then re-insert
        while GEN_START in usda:
            a, b = usda.index(GEN_START), usda.index(GEN_END) + len(GEN_END) + 1
            usda = usda[:a] + usda[b:]
    i_map = usda.index("};\n", usda.index("export const USDA_MAP"))
    usda = usda[:i_map] + "\n".join(m_lines) + usda[i_map:]
    i_grams = usda.index("};", usda.index("export const GRAMS"))
    usda = usda[:i_grams] + "\n".join(g_lines) + usda[i_grams:]
    open(os.path.join(ROOT, "src/data/nutrition/usdaMap.ts"), "w").write(usda)
    # importedRecipes.ts
    out = [
        "// GENERATED by scripts/import-cmu/build_recipes.py from the CMU Recipe Archive — do not edit by hand.",
        "// Re-run the import (see that script's docstring) to change these. Instructions are as posted",
        "// (lightly cleaned); amounts are converted to Dishcart's catalog units. Credits never include emails.",
        "import { Recipe, RecipeSource } from '../types';",
        "import { CMU_ARCHIVE, CMU_AS_POSTED_CHANGES, CMU_LICENSE_AS_POSTED } from '../utils/recipeSource';",
        "",
        "const src = (title: string, author: string, posted: string | null, url: string): RecipeSource => ({",
        "  kind: 'as-posted', title, author, ...(posted ? { posted } : {}), collection: CMU_ARCHIVE, url,",
        "  license: CMU_LICENSE_AS_POSTED, changes: CMU_AS_POSTED_CHANGES,",
        "});",
        "",
        f"// {len(recipes)} recipes.",
        "export const IMPORTED_RECIPES: Recipe[] = [",
    ]
    for r in recipes:
        s = r["source"]
        out.append("  {")
        out.append(f"    id: {q(r['id'])}, title: {q(r['title'])}, mealType: '{r['mealType']}', protein: '{r['protein']}',")
        out.append(f"    prep: {r['prep']}, cook: {r['cook']}, servings: {r['servings']}, emoji: {q(r['emoji'])},{' batch: true,' if r['batch'] else ''}")
        out.append("    ingredients: [")
        for i in r["ingredients"]:
            unit = "null" if i["unit"] is None else f"'{i['unit']}'"
            prep = f", prep: {q(i['prep'])}" if i.get("prep") else ""
            out.append(f"      {{ id: {q(i['id'])}, amount: {round(i['amount'], 4):g}, unit: {unit}{prep} }},")
        out.append("    ],")
        out.append("    steps: [")
        for st in r["steps"]:
            out.append(f"      {q(st)},")
        out.append("    ],")
        out.append(f"    source: src({q(s['title'])}, {q(s['author'])}, {q(s.get('posted'))}, {q(s['url'])}),")
        out.append("  },")
    out.append("];\n")
    open(os.path.join(ROOT, "src/data/importedRecipes.ts"), "w").write("\n".join(out))
    # Review list + report
    os.makedirs(os.path.join(ROOT, "docs/recipes"), exist_ok=True)
    with open(os.path.join(ROOT, "docs/recipes/cmu-import-review.csv"), "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["title", "category", "author", "url", "reasons"])
        for rec, probs in sorted(review, key=lambda x: (x[0]["category"], x[0]["title"])):
            w.writerow([rec["title"], rec["category"], rec["author"], rec["url"], "; ".join(sorted(set(probs)))])
    reasons, _ = stats(recipes, review)
    by_meal = Counter(r["mealType"] for r in recipes)
    grouped = Counter()
    for _, probs in review:
        p = sorted(set(probs))[0]
        g = ("Reposted from another source" if p.startswith("reposted") else
             "Names a company or brand" if p.startswith("names a company") else
             "Method interleaved with the ingredient list (layout we can't read reliably)" if p.startswith("method text") else
             "Method uses an ingredient missing from the list" if p.startswith("method uses") else
             "Amounts given as ratios (one part / two parts)" if p.startswith("method gives") else
             "Same dish as a Dishcart recipe" if p.startswith("same dish") else
             "Credited to a cookbook or publication" if p.startswith("credited to") else
             "Checked by hand: list incomplete in a way the checks can't see" if p.startswith("checked by hand") else
             "Same recipe posted twice" if p.startswith("duplicate of") else
             "Main ingredient missing from the list" if p.startswith(("title names", "method cooks", "method uses the")) else
             "Ingredient not in Dishcart's catalog" if p.startswith("unmapped") else
             "Amount we can't convert" if "no conversion" in p else
             "Unreadable ingredient line" if p.startswith("unparsed") else
             "Too little to cook from" if p.startswith(("instructions too thin", "fewer than")) else p)
        grouped[g] += 1
    rep = [
        "# CMU Recipe Archive import report",
        "",
        "Generated by `scripts/import-cmu/build_recipes.py`. Source: the CMU Recipe Archive mirror at",
        "`~/Projects/recipe-sources/cmu-recipe-archive` (1,840 recipes indexed).",
        "",
        "| Stage | Recipes |",
        "|---|---|",
        "| Indexed in the archive | 1,840 |",
        "| Excluded before parsing: cites a cookbook, magazine, newspaper, restaurant, or brand | 554 |",
        "| Excluded before parsing: no ingredient list | 222 |",
        f"| Parsed, then **imported** into Dishcart | **{len(recipes)}** |",
        f"| Parsed, then sent to review (below) | {len(review)} |",
        "",
        "Imported by meal type: " + ", ".join(f"{k} {v}" for k, v in by_meal.most_common()) + ".",
        "",
        "## Why the rest were not imported",
        "",
        "| Reason (first listed per recipe) | Recipes |",
        "|---|---|",
        *[f"| {k} | {v} |" for k, v in grouped.most_common()],
        "",
        "Every reviewed recipe, with all of its reasons, is in `docs/recipes/cmu-import-review.csv`.",
        "",
        "## Most common unknown ingredients",
        "",
        ", ".join(k.replace("unmapped: ", "") for k, _ in Counter({k: v for k, v in reasons.items() if k.startswith("unmapped")}).most_common(40)),
        "",
    ]
    open(os.path.join(ROOT, "docs/recipes/cmu-import-report.md"), "w").write("\n".join(rep))
    print(f"wrote {len(recipes)} recipes, {len(new_used)} new ingredients; {len(review)} in review")


if __name__ == "__main__" and "--dry" not in sys.argv:
    emit(*build())
