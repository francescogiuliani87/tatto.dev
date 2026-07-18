// Shape keyword matching and asset loading.
// Ported from thatsfaso/tact — see THIRD_PARTY_NOTICES.md.
//
// Keyword tables are ordered most-specific → most-general so short words like
// "re" (king) never fire before more specific matches like "mare" (sea).

import type { Lang, Shape, ShapeIndex } from "./types";

type KeywordTable = Record<string, readonly string[]>;

export const SHAPE_KEYWORDS: Readonly<Record<Lang, KeywordTable>> = {
  it: {
    teddy_bear: ["orsacchiotto", "orsacchiotti", "peluche"],
    unicorn: ["unicorno", "unicorni"], dragon: ["drago", "draghi", "draghetto"],
    mermaid: ["sirena", "sirene"], fairy: ["fata", "fate", "fatina"],
    witch: ["strega", "streghe", "befana"], wizard: ["mago", "maghi", "stregone"],
    knight: ["cavaliere", "cavalieri"], ghost: ["fantasma", "fantasmi", "spettro"],
    princess: ["principessa", "principesse"],
    queen: ["regina", "regine"], king: ["re", "sovrano", "regno", "reame"],
    wolf: ["lupo", "lupi", "lupetto"], fox: ["volpe", "volpi"],
    swan: ["cigno", "cigni"], deer: ["cervo", "cervi", "cerbiatto"],
    squirrel: ["scoiattolo", "scoiattoli"], hedgehog: ["riccio", "ricci", "porcospino"],
    snake: ["serpente", "serpenti", "serpe", "biscia"], monkey: ["scimmia", "scimmie", "scimmietta"],
    cow: ["mucca", "mucche", "vacca"],
    pig: ["maiale", "maiali", "maialino", "porcellino"], mouse: ["topo", "topi", "topolino"],
    sheep: ["pecora", "pecore", "pecorella", "agnello"], bee: ["ape", "api", "apetta"],
    ladybug: ["coccinella", "coccinelle"], snail: ["lumaca", "lumache", "chiocciola"],
    rabbit: ["coniglio", "conigli", "coniglietto", "lepre"],
    cat_sitting: ["gatto", "gatti", "gattino", "micio", "micia"],
    dog_sitting: ["cane", "cani", "cagnolino", "cucciolo"], owl: ["gufo", "gufi", "civetta"],
    horse: ["cavallo", "cavalli", "cavallino", "pony", "puledro"],
    duck: ["anatra", "anatre", "anatroccolo", "papera"], frog: ["rana", "rane", "ranocchio", "rospo"],
    turtle: ["tartaruga", "tartarughe"], elephant: ["elefante", "elefanti"],
    lion: ["leone", "leoni", "leoncino"], bear: ["orso", "orsi", "orsetto"],
    bird_flying: ["uccello", "uccelli", "uccellino", "passero", "colomba"],
    butterfly: ["farfalla", "farfalle", "farfallina"], fish: ["pesce", "pesci", "pesciolino"],
    magic_wand: ["bacchetta"], sword: ["spada", "spade"],
    treasure_chest: ["tesoro", "forziere", "scrigno", "oro"], pumpkin: ["zucca", "zucche"],
    mushroom: ["fungo", "funghi"], crown: ["corona", "corone"], key: ["chiave", "chiavi"],
    apple: ["mela", "mele"], book: ["libro", "libri"], heart: ["cuore", "cuori"],
    umbrella: ["ombrello", "ombrelli"], hat_pirate: ["pirata", "pirati"], rainbow: ["arcobaleno"],
    bell: ["campana", "campanella"], lantern: ["lanterna", "lanterne"], candle: ["candela", "candele"],
    mirror: ["specchio", "specchi"], gift: ["regalo", "regali", "dono"], balloon: ["palloncino", "palloncini"],
    ball: ["palla", "palle", "pallone"], kite: ["aquilone", "aquiloni"], snowflake: ["fiocco", "neve"],
    bridge: ["ponte", "ponti"],
    moon: ["luna", "lune"], sun: ["sole"], star: ["stella", "stelle", "stellina"],
    cloud: ["nuvola", "nuvole", "nube"], rocket: ["razzo", "razzi", "astronave"],
    boat_sailboat: ["barca", "barche", "nave", "navi", "vela", "veliero"],
    car_simple: ["auto", "macchina", "automobile"], train_simple: ["treno", "treni"],
    airplane: ["aereo", "aerei", "aeroplano"], bicycle: ["bicicletta", "bici"],
    tree_simple: ["albero", "alberi", "bosco", "foresta"],
    flower_simple: ["fiore", "fiori", "rosa", "margherita", "giardino"],
    mountain: ["montagna", "montagne", "monte", "collina"], wave: ["onda", "onde", "mare", "oceano"],
    leaf: ["foglia", "foglie"], house_simple: ["casa", "case", "casetta", "capanna"],
    castle_tower: ["castello", "castelli", "palazzo", "torre"], lighthouse: ["faro", "fari"],
    person_child: ["bambino", "bambina", "bimbo", "bimba", "bambini"],
    person_standing: ["persona", "uomo", "donna", "amico", "amica"],
  },
  en: {
    teddy_bear: ["teddy"], unicorn: ["unicorn", "unicorns"], dragon: ["dragon", "dragons"],
    mermaid: ["mermaid", "mermaids"], fairy: ["fairy", "fairies", "pixie"],
    witch: ["witch", "witches"], wizard: ["wizard", "wizards", "sorcerer"],
    knight: ["knight", "knights"], ghost: ["ghost", "ghosts"],
    princess: ["princess", "princesses"],
    queen: ["queen", "queens"], king: ["king", "kings", "kingdom"],
    wolf: ["wolf", "wolves"], fox: ["fox", "foxes"], pig: ["pig", "pigs", "piglet", "hog"],
    mouse: ["mouse", "mice"], sheep: ["sheep", "lamb", "lambs"], bee: ["bee", "bees", "bumblebee"],
    ladybug: ["ladybug", "ladybird"], snail: ["snail", "snails"],
    swan: ["swan", "swans"], deer: ["deer", "fawn"], squirrel: ["squirrel", "squirrels"],
    hedgehog: ["hedgehog", "hedgehogs"], snake: ["snake", "snakes", "serpent"],
    monkey: ["monkey", "monkeys"], cow: ["cow", "cows", "calf"],
    rabbit: ["rabbit", "rabbits", "bunny", "bunnies", "hare"],
    cat_sitting: ["cat", "cats", "kitten", "kitty"], dog_sitting: ["dog", "dogs", "puppy", "pup"],
    owl: ["owl", "owls"], horse: ["horse", "horses", "pony", "foal"], duck: ["duck", "ducks", "duckling"],
    frog: ["frog", "frogs", "toad"], turtle: ["turtle", "turtles", "tortoise"],
    elephant: ["elephant", "elephants"], lion: ["lion", "lions"], bear: ["bear", "bears"],
    bird_flying: ["bird", "birds", "sparrow", "robin", "pigeon"],
    butterfly: ["butterfly", "butterflies", "moth"], fish: ["fish", "fishes"],
    magic_wand: ["wand", "wands"], sword: ["sword", "swords"],
    treasure_chest: ["treasure", "chest", "gold", "jewels"], pumpkin: ["pumpkin", "pumpkins"],
    mushroom: ["mushroom", "mushrooms", "toadstool"], crown: ["crown", "crowns"], key: ["key", "keys"],
    apple: ["apple", "apples"], book: ["book", "books"], heart: ["heart", "hearts"],
    umbrella: ["umbrella"], hat_pirate: ["pirate", "pirates"], rainbow: ["rainbow", "rainbows"],
    bell: ["bell", "bells"], lantern: ["lantern", "lanterns"], candle: ["candle", "candles"],
    mirror: ["mirror", "mirrors"], gift: ["gift", "gifts", "present"], balloon: ["balloon", "balloons"],
    ball: ["ball", "balls"], kite: ["kite", "kites"], snowflake: ["snowflake", "snow", "snowy"],
    bridge: ["bridge", "bridges"],
    moon: ["moon"], sun: ["sun", "sunny", "sunshine", "sunbeam"], star: ["star", "stars", "wish"],
    cloud: ["cloud", "clouds"], rocket: ["rocket", "spaceship"],
    boat_sailboat: ["boat", "boats", "ship", "sail"], car_simple: ["car", "cars"],
    train_simple: ["train", "trains"], airplane: ["airplane", "plane", "jet"],
    bicycle: ["bicycle", "bike"], tree_simple: ["tree", "trees", "forest", "woods"],
    flower_simple: ["flower", "flowers", "rose", "daisy", "garden"],
    mountain: ["mountain", "mountains", "hill"], wave: ["wave", "waves", "sea", "ocean"],
    leaf: ["leaf", "leaves"], house_simple: ["house", "home", "cottage"],
    castle_tower: ["castle", "castles", "palace", "tower"], lighthouse: ["lighthouse"],
    person_child: ["child", "girl", "boy", "kid"], person_standing: ["person", "man", "woman", "friend"],
  },
};

/**
 * Return the shape name (as used in SHAPE_KEYWORDS) that best matches `text`,
 * or `"star"` when no keyword hits. Whole-word match; letters only.
 */
export function pickShapeFromText(text: string, lang: Lang): string {
  const table = SHAPE_KEYWORDS[lang];
  const wset = new Set(
    text.toLowerCase().split(/[^a-zàèéìòù]+/).filter(Boolean),
  );
  for (const [shape, keys] of Object.entries(table)) {
    if (keys.some((k) => wset.has(k))) return shape;
  }
  return "star";
}

/**
 * Human-readable label of a shape for screen-reader announcements. Uses the
 * first keyword (canonical word); falls back to the shape id with common
 * variant suffixes stripped.
 */
export function shapeLabel(shape: string, lang: Lang): string {
  const table = SHAPE_KEYWORDS[lang];
  const entry = table[shape];
  if (entry && entry[0]) return entry[0];
  if (!shape || shape === "star") return lang === "it" ? "stella" : "star";
  return shape
    .replace(/_(sitting|standing|simple|flying|perched|small|sailboat)$/, "")
    .replace(/_/g, " ");
}

/**
 * Fetch the shapes/index.json manifest served from /tact-shapes/.
 */
export async function loadShapeIndex(): Promise<ShapeIndex> {
  const res = await fetch("/tact-shapes/index.json");
  if (!res.ok) throw new Error(`Failed to load shape index: ${res.status}`);
  return (await res.json()) as ShapeIndex;
}

/**
 * Fetch the SVG text for a shape by name. Looks it up in the given index.
 */
export async function loadShapeSVG(shapeName: string, index: ShapeIndex): Promise<string> {
  const entry = index.shapes.find((s) => s.name === shapeName);
  if (!entry) throw new Error(`Unknown shape: ${shapeName}`);
  const res = await fetch(`/tact-shapes/${entry.file}`);
  if (!res.ok) throw new Error(`Failed to load shape SVG: ${res.status}`);
  return await res.text();
}
