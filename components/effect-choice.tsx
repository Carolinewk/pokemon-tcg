"use client";
import { useState, type ReactNode } from "react";
import type { Card, Catalog, PendingEffect, Piece } from "@/lib/game-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function EffectChoiceDialog({
  pending,
  catalog,
  renderCard,
  onChoose,
}: {
  pending: PendingEffect;
  catalog: Catalog;
  renderCard: (card: Card) => ReactNode;
  onChoose: (values: string[]) => boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { choice } = pending;
  const valid = choice.input
    ? query.trim().length > 0 && query.length <= 80
    : selected.length >= choice.min && selected.length <= choice.max;
  const options = choice.options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Dialog open>
      <DialogContent
        className="effect-choice-dialog"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogTitle>{choice.title}</DialogTitle>
        <DialogDescription>
          {choice.input
            ? "Enter your answer below."
            : choice.ordered
              ? "Select cards in the order you want to draw them. Click a selected card to remove it from the order."
              : choice.min === choice.max
                ? `Select ${choice.min} ${choice.min === 1 ? "option" : "options"}.`
                : `Select ${choice.min === 0 ? "up to" : `${choice.min}–`} ${choice.max} options.`}
        </DialogDescription>
        {choice.referenceCard && (
          <div className="effect-reference-card">
            {renderCard(catalog[choice.referenceCard])}
          </div>
        )}
        {choice.input && (
          <input
            className="effect-choice-search"
            aria-label={choice.title}
            value={query}
            maxLength={80}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Your answer…"
          />
        )}
        {choice.options.length > 8 && (
          <input
            className="effect-choice-search"
            aria-label="Search available choices"
            placeholder="Find a card…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        {choice.ordered && (
          <ol className="effect-choice-order" aria-label="Draw order">
            {selected.map((value) => (
              <li key={value}>
                {choice.options.find((o) => o.value === value)?.label}
              </li>
            ))}
          </ol>
        )}
        <div
          className={`effect-choice-options ${choice.options.some((o) => o.card) ? "with-cards" : ""}`}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`effect-choice-option ${selected.includes(o.value) ? "chosen" : ""}`}
              aria-pressed={selected.includes(o.value)}
              disabled={submitted}
              onClick={() =>
                setSelected((current) =>
                  current.includes(o.value)
                    ? current.filter((v) => v !== o.value)
                    : choice.max === 1
                      ? [o.value]
                      : current.length < choice.max
                        ? [...current, o.value]
                        : current,
                )
              }
            >
              {o.card && renderCard(catalog[o.card])}
              <span>{o.label}</span>
              {selected.includes(o.value) && (
                <b className="effect-choice-check">
                  {choice.ordered ? selected.indexOf(o.value) + 1 : "✓"}
                </b>
              )}
            </button>
          ))}
          {!choice.input && !options.length && <p>No matching cards.</p>}
        </div>
        <div className="effect-choice-footer">
          <span aria-live="polite">
            {submitted
              ? "Waiting for the table…"
              : choice.input
                ? ""
                : `${selected.length} / ${choice.max} selected`}
          </span>
          <button
            className="button primary"
            disabled={!valid || submitted}
            onClick={() => {
              if (onChoose(choice.input ? [query.trim()] : selected))
                setSubmitted(true);
            }}
          >
            {choice.input
              ? "Confirm answer"
              : selected.length === 0 && choice.min === 0
                ? "Continue without selecting"
                : "Confirm selection"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function pieceEffectLabels(
  p: Piece,
  turn: number,
  catalog: Catalog,
): string[] {
  const e = p.effects || {};
  return [
    ...(p.charred ? ["Char"] : []),
    ...(p.shiftedType ? [`Type: ${p.shiftedType}`] : []),
    ...(p.shape ? [`Shapeshift: ${catalog[p.shape.card].name}`] : []),
    ...Object.entries(p.marks || {})
      .filter(([, m]) => m.until >= turn)
      .map(
        ([key, m]) =>
          (
            ({
              noRetreat: "Cannot retreat",
              noAttack: "Cannot attack",
              jawClamp: "Cannot retreat or switch",
              powerOff: "Pokémon Power disabled",
              conditionGuard: "Protected from conditions",
              endure: "Endure",
              shadowImages: "Shadow Images",
              reduceDamage: `Damage reduced by ${m.value || 0}`,
              attackDisabled: `${m.name} unavailable`,
              giantGrowth: "Giant Growth",
              mirrorShell: "Mirror Shell",
              crosscounter: "Crosscounter",
              fireWall: "Fire Wall",
              cannotAttackSource: "Attack restriction",
              noEnergy: "Cannot attach Energy",
              halveDamage: "Damage halved",
              screech: "Screech",
              doubleDamage: `${m.name}: double damage`,
              nextDamage: `${m.name}: boosted`,
              recall: "Recall",
            }) as Record<string, string>
          )[key],
      )
      .filter(Boolean),
    ...p.conditions.map((c) =>
      c === "Poisoned" && e.poisonDamage === 20 ? "Toxic · 20 damage" : c,
    ),
    ...(p.trainerAttachments || [])
      .filter((t) => t.expires >= turn)
      .map((t) => catalog[t.card].name),
    ...((e.preventAllUntil ?? -1) >= turn ? ["Protected from attacks"] : []),
    ...((e.preventDamageUntil ?? -1) >= turn ? ["Protected from damage"] : []),
    ...((e.hardenUntil ?? -1) >= turn ? ["Harden · blocks 30 or less"] : []),
    ...((e.destinyBondUntil ?? -1) >= turn ? ["Destiny Bond"] : []),
    ...((e.sandAttackUntil ?? -1) >= turn ? ["Sand-attack"] : []),
    ...(e.amnesia && e.amnesia.until >= turn
      ? [`Amnesia · ${e.amnesia.name} disabled`]
      : []),
    ...(e.weakness ? [`Weakness changed to ${e.weakness}`] : []),
    ...(e.resistance ? [`Resistance changed to ${e.resistance}`] : []),
    ...(e.energyBurnTurn === turn ? ["Energy Burn"] : []),
    ...(p.usedAttacks || []).map((a) => `${a} already used`),
  ];
}

export function RevealedCardsDialog({
  reveals,
  catalog,
  renderCard,
}: {
  reveals: { title: string; cards: string[] }[];
  catalog: Catalog;
  renderCard: (card: Card) => ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="effect-choice-dialog">
        <DialogTitle>Revealed cards</DialogTitle>
        <DialogDescription>
          A card effect lets you see these cards.
        </DialogDescription>
        <div className="effect-choice-options">
          {reveals.map((reveal, i) => (
            <section className="revealed-card-group" key={i}>
              <h3>{reveal.title}</h3>
              <div className="revealed-card-grid">
                {reveal.cards.map((id, j) => (
                  <div key={`${id}-${j}`}>
                    {renderCard(catalog[id])}
                    <span>{catalog[id].name}</span>
                  </div>
                ))}
              </div>
              {!reveal.cards.length && <p>No cards in hand.</p>}
            </section>
          ))}
        </div>
        <button className="button primary" onClick={() => setOpen(false)}>
          Back to the table
        </button>
      </DialogContent>
    </Dialog>
  );
}
