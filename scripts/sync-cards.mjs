import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
// Snapshot the complete English dataset. No API key or live API dependency.
const target = "/tmp/poketable-card-data";
execFileSync(
  "curl",
  [
    "-fL",
    "--retry",
    "2",
    "https://codeload.github.com/PokemonTCG/pokemon-tcg-data/zip/refs/heads/master",
    "-o",
    target + ".zip",
  ],
  { stdio: "ignore" },
);
execFileSync("unzip", ["-qo", target + ".zip", "-d", target]);
const { readdir, readFile } = await import("node:fs/promises");
const root = target + "/pokemon-tcg-data-master";
const sets = JSON.parse(await readFile(root + "/sets/en.json", "utf8"));
const setMap = Object.fromEntries(sets.map((s) => [s.id, s]));
const cards = [];
for (const file of (await readdir(root + "/cards/en")).filter((f) =>
  f.endsWith(".json"),
)) {
  const set = setMap[file.replace(".json", "")];
  for (const c of JSON.parse(
    await readFile(root + "/cards/en/" + file, "utf8"),
  )) {
    cards.push({
      id: c.id,
      name: c.name,
      supertype: c.supertype,
      subtypes: c.subtypes || [],
      hp: Number(c.hp) || 0,
      types: c.types || [],
      evolvesFrom: c.evolvesFrom || "",
      attacks: c.attacks || [],
      abilities: c.abilities || [],
      rules: c.rules || [],
      weaknesses: c.weaknesses || [],
      resistances: c.resistances || [],
      retreat: c.convertedRetreatCost || 0,
      image: c.images?.large || c.images?.small || "",
      small: c.images?.small || "",
      set: set?.name || file,
      setId: set?.id || file.replace(".json", ""),
      number: c.number,
      rarity: c.rarity || "",
      date: set?.releaseDate || "",
      legalities: c.legalities || {},
    });
  }
}
cards.sort(
  (a, b) =>
    b.date.localeCompare(a.date) ||
    a.setId.localeCompare(b.setId) ||
    Number(a.number) - Number(b.number),
);
await mkdir("public/data", { recursive: true });
await mkdir("public/cards", { recursive: true });
await mkdir("lib", { recursive: true });
await writeFile("public/data/cards.json", JSON.stringify(cards));
await writeFile(
  "public/data/sets.json",
  JSON.stringify(
    sets
      .map((s) => ({
        id: s.id,
        name: s.name,
        series: s.series,
        releaseDate: s.releaseDate,
      }))
      .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate)),
  ),
);
await writeFile(
  "public/data/manifest.json",
  JSON.stringify(
    {
      count: cards.length,
      sets: sets.length,
      language: "English",
      source: "https://github.com/PokemonTCG/pokemon-tcg-data",
      snapshot: new Date().toISOString().slice(0, 10),
    },
    null,
    2,
  ),
);
const ids = [
  "base1-4",
  "base1-6",
  "base1-15",
  "base1-24",
  "base1-28",
  "base1-32",
  "base1-35",
  "base1-37",
  "base1-43",
  "base1-44",
  "base1-46",
  "base1-51",
  "base1-52",
  "base1-55",
  "base1-58",
  "base1-59",
  "base1-60",
  "base1-63",
  "base1-64",
  "base1-65",
  "base1-66",
  "base1-67",
  "base1-70",
  "base1-85",
  "base1-88",
  "base1-91",
  "base1-92",
  "base1-93",
  "base1-95",
  "base1-98",
  "base1-99",
  "base1-100",
  "base1-101",
  "base1-102",
  "sv3pt5-199",
  "sv3pt5-198",
  "sv3pt5-200",
  "swsh9-174",
  "swsh7-215",
];
const starter = cards.filter((c) => ids.includes(c.id));
await Promise.all(
  starter.map(async (c) => {
    try {
      const r = await fetch(c.image);
      if (!r.ok) throw Error(r.status);
      await writeFile(
        "public/cards/" + c.id + ".png",
        Buffer.from(await r.arrayBuffer()),
      );
    } catch (e) {
      console.warn("Image unavailable", c.id, String(e));
    }
  }),
);
await writeFile("lib/starter-cards.json", JSON.stringify(starter));
console.log(
  JSON.stringify({
    count: cards.length,
    sets: sets.length,
    starter: starter.map((c) => ({
      id: c.id,
      name: c.name,
      supertype: c.supertype,
    })),
    bytes: JSON.stringify(cards).length,
  }),
);
