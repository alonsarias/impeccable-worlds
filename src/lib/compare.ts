export type SlotIndex = 0 | 1;

export interface CompareUndo {
  slot: SlotIndex;
  previousId: string;
  replacedWithId: string;
}

export interface CompareState {
  slots: [string | null, string | null];
  focusedSlot: SlotIndex;
  undo: CompareUndo | null;
}

export function createCompareState(): CompareState {
  return { slots: [null, null], focusedSlot: 0, undo: null };
}

function otherSlot(index: SlotIndex): SlotIndex {
  return index === 0 ? 1 : 0;
}

export function addToCompare(state: CompareState, id: string): CompareState {
  if (!id || state.slots[0] === id || state.slots[1] === id) return state;

  const slots: CompareState["slots"] = [state.slots[0], state.slots[1]];
  const emptyIndex: SlotIndex | -1 =
    slots[0] === null ? 0 : slots[1] === null ? 1 : -1;

  if (emptyIndex !== -1) {
    slots[emptyIndex] = id;
    const noneBefore = state.slots[0] === null && state.slots[1] === null;
    const undo =
      state.undo && state.undo.slot === emptyIndex ? null : state.undo;
    return {
      slots,
      focusedSlot: noneBefore ? emptyIndex : state.focusedSlot,
      undo,
    };
  }

  const target = otherSlot(state.focusedSlot);
  const previousId = slots[target];
  if (!previousId) return state;
  slots[target] = id;
  return {
    slots,
    focusedSlot: state.focusedSlot,
    undo: { slot: target, previousId, replacedWithId: id },
  };
}

export function removeFromCompare(
  state: CompareState,
  index: SlotIndex,
): CompareState {
  if (state.slots[index] === null) return state;
  const slots: CompareState["slots"] = [state.slots[0], state.slots[1]];
  slots[index] = null;
  const other = otherSlot(index);
  const focusedSlot: SlotIndex =
    state.focusedSlot === index
      ? slots[other]
        ? other
        : 0
      : state.focusedSlot;
  const undo = state.undo && state.undo.slot === index ? null : state.undo;
  return { slots, focusedSlot, undo };
}

export function toggleCompare(state: CompareState, id: string): CompareState {
  if (state.slots[0] === id) return removeFromCompare(state, 0);
  if (state.slots[1] === id) return removeFromCompare(state, 1);
  return addToCompare(state, id);
}

export function focusCompareSlot(
  state: CompareState,
  index: SlotIndex,
): CompareState {
  if (state.slots[index] === null || state.focusedSlot === index) return state;
  return { ...state, focusedSlot: index };
}

export function undoCompareReplace(state: CompareState): CompareState {
  const undo = state.undo;
  if (!undo) return state;
  if (state.slots[undo.slot] !== undo.replacedWithId) {
    return { ...state, undo: null };
  }
  const slots: CompareState["slots"] = [state.slots[0], state.slots[1]];
  const other = otherSlot(undo.slot);
  if (slots[other] === undo.previousId) slots[other] = null;
  slots[undo.slot] = undo.previousId;
  return { slots, focusedSlot: state.focusedSlot, undo: null };
}

export function dismissCompareUndo(state: CompareState): CompareState {
  if (!state.undo) return state;
  return { ...state, undo: null };
}
