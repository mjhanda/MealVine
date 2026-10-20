"""Ingredient-name normalization shared by the CMU import scripts."""
import re

DROP_WORDS = {
    "fresh", "freshly", "chopped", "minced", "diced", "sliced", "grated", "shredded", "large", "medium",
    "small", "finely", "coarsely", "roughly", "thinly", "peeled", "packed", "firmly", "lightly", "softened",
    "melted", "cold", "warm", "boiling", "hot", "sifted", "unsifted", "all-purpose", "all", "purpose",
    "granulated", "extra-virgin", "extra", "virgin", "crushed", "beaten", "plain", "skinless", "boneless",
    "uncooked", "raw", "about", "approx", "approximately", "heaping", "level", "scant", "good", "quality",
    "pitted", "seeded", "cubed", "halved", "quartered", "trimmed", "rinsed", "drained", "washed", "cleaned",
    "toasted", "room", "temperature", "at", "well", "very", "ripe", "firm", "whole", "pure", "real",
    "superfine", "regular", "c.", "pkg", "pkg.", "tbs", "tsp", "cup", "cups", "dry", "dried", "of", "the",
    "into", "pieces", "piece", "in", "inch", "cut", "to", "taste", "optional", "for", "garnish",
    "frozen", "thawed", "canned", "can", "cans", "stick", "sticks", "envelope", "jar", "bottle", "-",
    "soft", "extra-large", "x-large", "jumbo", "sm", "lg", "med", "md", "skinless", "mashed", "roasted",
    "unsweetened", "natural", "shelled", "solid", "pack", "bit", "sized", "bite", "size", "karo", "fleischmann",
    "fleischmann's", "approximately", "assorted", "favorite", "homemade", "store-bought", "prepared", "leftover",
    "lean", "organic", "imported", "domestic", "mild", "sharp", "aged", "young", "baby", "tiny", "big", "thick",
    "thin", "fine", "coarse", "freshly-ground", "fresh-ground", "pure", "best", "kosher-style", "crumbled",
    "separated", "softened", "plus", "additional", "more", "few", "several", "bunch", "sprig", "sprigs", "handful",
    "boned", "skinned", "loosely", "halves", "crisp-cooked", "cut-up", "parts",
}
TYPOS = {
    "margerine": "margarine", "cardomom": "cardamom", "cardamon": "cardamom", "oinon": "onion", "tomatoe": "tomato",
    "tomatoes": "tomatoes", "chillie": "chili", "parmeasan": "parmesan", "parmasan": "parmesan", "cheader": "cheddar",
    "chedder": "cheddar", "oregeno": "oregano", "origano": "oregano", "tumeric": "turmeric",
    "worchestershire": "worcestershire", "worcestshire": "worcestershire", "zuchinni": "zucchini",
    "zucchinni": "zucchini", "zuchini": "zucchini", "brocolli": "broccoli", "brocoli": "broccoli",
    "cinammon": "cinnamon", "cinamon": "cinnamon", "cinnamin": "cinnamon", "vanila": "vanilla", "vanella": "vanilla",
    "basalmic": "balsamic", "gound": "ground", "yoghurt": "yogurt", "yoghourt": "yogurt", "sufar": "sugar",
    "suger": "sugar", "buter": "butter", "buttter": "butter", "flour-": "flour", "corriander": "coriander",
    "cummin": "cumin", "ginger-root": "ginger", "jalepeno": "jalapeno", "jalapeño": "jalapeno", "jalapenos": "jalapeno",
    "jalepenos": "jalapeno", "brussel": "brussels", "rasberry": "raspberry", "rasberries": "raspberries",
    "strawberrys": "strawberries", "pinenut": "pine nut", "mushroms": "mushroom", "parsely": "parsley",
    "persley": "parsley", "cilantero": "cilantro", "tomatos": "tomato", "potatos": "potato", "avacado": "avocado",
    "chiles": "chile", "chilies": "chili", "chilis": "chili", "peper": "pepper", "pepers": "pepper",
    "brest": "breast", "cayanne": "cayenne", "parmesean": "parmesan", "mozzerella": "mozzarella",
    "fettucini": "fettuccine", "linquini": "linguine",
}
SHARED_NOUNS = {"vinegar", "oil", "sauce", "cheese", "flour", "sugar", "juice", "wine", "broth", "stock", "rice"}
# Keep "ground" for meat ("ground beef"); drop it for spices ("ground cinnamon" = cinnamon).
GROUND_MEATS = ("beef", "pork", "turkey", "chicken", "lamb", "veal", "meat", "sausage")
SINGULAR_EXCEPTIONS = {"molasses", "asparagus", "hummus", "couscous", "swiss", "brussels", "grits", "oats", "greens", "peas", "lentils", "beans", "chickpeas", "noodles", "raisins", "walnuts", "pecans", "almonds", "capers", "olives", "berries", "chips", "flakes", "seeds", "crumbs", "breadcrumbs", "sprouts"}


def singular(word: str) -> str:
    if word in SINGULAR_EXCEPTIONS or len(word) <= 3:
        return word
    if word.endswith("ies"):
        return word[:-3] + "y"
    if word.endswith(("oes", "ches", "shes", "sses")):
        return word[:-2]
    if word.endswith("s") and not word.endswith(("ss", "us")):
        return word[:-1]
    return word


def normalize(name: str) -> str:
    s = name.lower()
    s = re.sub(r"\(.*?\)|\[.*?\]", " ", s)
    s = re.sub(r"\(.*$", " ", s)  # a note whose ")" is on the next line
    s = s.replace("&", " and ")
    # "butter or margarine" → "butter"; "salt and pepper" stays (handled by the map). If the first
    # alternative is only descriptors ("peeled/quartered potatoes"), use the next one.
    parts = re.split(r"\s+or\s+|/", s)
    # "rice or white vinegar" means rice vinegar: a one-word first choice shares the last noun.
    tail = parts[-1].split()
    if len(parts) > 1 and len(parts[0].split()) == 1 and len(tail) > 1 and tail[-1] in SHARED_NOUNS:
        parts[0] = f"{parts[0]} {tail[-1]}"
    for part in parts:
        words = _words(part)
        if words:
            return " ".join(words).strip()
    return ""


def _words(s: str) -> list:
    s = re.sub(r"[^a-z\s'-]", " ", s)
    words = [TYPOS.get(w.strip("'-"), w.strip("'-")) for w in s.split()]
    words = [x for w in words for x in w.split()]
    words = [w for w in words if w and w not in DROP_WORDS]
    if words and words[0] == "ground" and not any(m in words for m in GROUND_MEATS):
        words = words[1:]
    words = [singular(w) for w in words]
    while words and words[-1] == "and":  # "carrot, peeled and halved" → "carrot"
        words.pop()
    return words
