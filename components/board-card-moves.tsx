"use client";

import { useRef, useState, type ReactElement, type ReactNode } from "react";
import { Eye, RotateCcw, Sparkles, Swords, Trash2, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  Attack,
  Catalog,
  GameState,
  Piece,
  Player,
} from "@/lib/game-types";
import { automaticAttack, canPay } from "@/lib/effects/base-set";
import { availablePowers } from "@/lib/effects/classic/powers";
import { clefairyDollRules } from "@/lib/effects/base-set/modifiers";
import * as rules from "@/lib/effects/classic/state";

type Props = {
  piece: Piece;
  player: Player;
  state: GameState;
  catalog: Catalog;
  children: ReactElement;
  renderEnergy: (type: string) => ReactNode;
  onAction: (action: string, data?: Record<string, unknown>) => boolean;
  onInspect: () => void;
};

/** The card remains the anchor while moves and target choices resolve normally. */
export function BoardCardMoves({
  piece,
  player,
  state,
  catalog,
  children,
  renderEnergy,
  onAction,
  onInspect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [manualIndex, setManualIndex] = useState<number | null>(null);
  const [damage, setDamage] = useState("0");
  const skipFocusRestore = useRef(false);
  const active = player.active?.uid === piece.uid;
  const opponent = state.players.find((p) => p.id !== player.id);
  const card = rules.pokemonCard(state, piece, catalog);
  const attacks = active ? rules.attackOptions(state, piece, catalog) : [];
  const powers = availablePowers(state, piece, catalog).filter((p) => p.use);
  const turnReason =
    state.status !== "playing"
      ? state.status === "finished"
        ? "Match finished"
        : "Match not started"
      : state.pending
        ? "Resolve the current effect"
        : state.players[state.current]?.id !== player.id
          ? "Opponent’s turn"
          : "";

  function attackReason(attack: Attack) {
    if (turnReason) return turnReason;
    if (!opponent?.active) return "Waiting for an Active Pokémon";
    if (state.turn === 1) return "Cannot attack on the first turn";
    if (piece.conditions.some((c) => c === "Asleep" || c === "Paralyzed"))
      return "Cannot attack right now";
    if (
      rules.mark(state, piece, "noAttack") ||
      rules.mark(state, piece, "attackDisabled")?.name === attack.name ||
      rules.mark(state, piece, "cannotAttackSource")?.source ===
        opponent.active.uid ||
      piece.usedAttacks?.includes(attack.name) ||
      (piece.effects?.amnesia?.name === attack.name &&
        piece.effects.amnesia.until >= state.turn)
    )
      return "Attack unavailable";
    if (!canPay(piece, attack, catalog, state)) return "More Energy needed";
    return "";
  }

  function submit(action: string, data: Record<string, unknown> = {}) {
    if (!onAction(action, data)) return;
    // A resolving effect may open a target-selection dialog. Keep focus there.
    skipFocusRestore.current = true;
    setOpen(false);
  }

  const manual = manualIndex === null ? undefined : attacks[manualIndex];
  const canPromote =
    !player.active && !state.pending && state.status !== "finished";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setManualIndex(null);
          setDamage("0");
          skipFocusRestore.current = false;
        }
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="board-card-moves"
        side="left"
        sideOffset={12}
        collisionPadding={8}
        aria-label={`${card.name} moves`}
        onCloseAutoFocus={(event) => {
          if (skipFocusRestore.current) event.preventDefault();
        }}
      >
        <div className="board-moves-heading">
          <span>Moves</span>
          <button
            type="button"
            aria-label="Close moves"
            onClick={() => setOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
        {attacks.map(({ attack, card: attackCard }, index) => {
          const reason = attackReason(attack);
          return (
            <button
              key={`${attackCard.id}-${index}`}
              type="button"
              className="board-move attack-move"
              disabled={!!reason}
              aria-label={`Use ${attack.name}${reason ? `: ${reason}` : ""}`}
              onClick={() =>
                automaticAttack(attackCard, attack)
                  ? submit("attack", { index })
                  : setManualIndex(index)
              }
            >
              <span className="board-move-name">
                <Swords size={14} />
                {attack.name}
              </span>
              {!!attack.cost.length && (
                <span
                  className="board-move-cost"
                  aria-label={`Energy cost: ${attack.cost.join(", ")}`}
                >
                  {attack.cost.map((type, i) => (
                    <span key={i}>{renderEnergy(type)}</span>
                  ))}
                </span>
              )}
              {reason && <small>{reason}</small>}
            </button>
          );
        })}
        {manual && (
          <form
            className="board-manual-attack"
            onSubmit={(event) => {
              event.preventDefault();
              submit("attack", { index: manualIndex, damage: Number(damage) });
            }}
          >
            <label>
              Damage before weakness
              <input
                type="number"
                min="0"
                max="9990"
                step="10"
                required
                value={damage}
                onChange={(event) => setDamage(event.target.value)}
              />
            </label>
            <small>Use Table tools for its other effects.</small>
            <button
              type="submit"
              className="board-move"
              disabled={!!attackReason(manual.attack)}
            >
              Use {manual.attack.name}
            </button>
          </form>
        )}
        {powers.map((power, index) => (
          <button
            key={`${power.card.id}-${power.name}`}
            type="button"
            className="board-move power-move"
            disabled={
              !!turnReason || !rules.powerOn(state, piece, catalog, power.name)
            }
            onClick={() => submit("power", { uid: piece.uid, index })}
          >
            <span className="board-move-name">
              <Sparkles size={14} />
              {power.name}
            </span>
            <small>Pokémon Power</small>
          </button>
        ))}
        {piece.faceDown && (
          <button
            type="button"
            className="board-move"
            disabled={!!turnReason}
            onClick={() => submit("revealPiece", { uid: piece.uid })}
          >
            Reveal Pokémon
          </button>
        )}
        {!active && (
          <button
            type="button"
            className="board-move"
            disabled={!canPromote && !!turnReason}
            onClick={() =>
              submit(player.active ? "retreat" : "promote", { uid: piece.uid })
            }
          >
            <span className="board-move-name">
              <RotateCcw size={14} />
              {player.active ? "Make Active" : "Promote"}
            </span>
            {player.active && (
              <small>
                Retreat · {rules.retreatCost(state, player, catalog)} Energy
              </small>
            )}
          </button>
        )}
        {clefairyDollRules(piece.card).canDiscardVoluntarily && (
          <button
            type="button"
            className="board-move"
            disabled={!!turnReason}
            onClick={() => submit("discardDoll", { uid: piece.uid })}
          >
            <Trash2 size={14} />
            Discard
          </button>
        )}
        <button
          type="button"
          className="board-move inspect-move"
          onClick={() => {
            skipFocusRestore.current = true;
            setOpen(false);
            onInspect();
          }}
        >
          <Eye size={14} />
          View card
        </button>
      </PopoverContent>
    </Popover>
  );
}
