import { create } from "zustand";
import type { FridgeItem } from "@/types";
import { fridgeApi, type FridgeRow } from "@/modules/fridge/api/fridgeApi";
import { getErrorMessage } from "@/shared/utils/errors";

type FridgeState = {
  items: FridgeRow[];
  loading: boolean;
  error: string | null;
  load: (family_id: string) => Promise<void>;
  create: (payload: Omit<FridgeItem, "fridge_item_id">) => Promise<void>;
  update: (id: string, payload: Omit<FridgeItem, "fridge_item_id" | "family_id">, family_id: string) => Promise<void>;
  consume: (id: string, quantityUsed: number, family_id: string) => Promise<void>;
  setQuantity: (id: string, quantity: number, family_id: string) => Promise<void>;
  remove: (id: string, family_id: string) => Promise<void>;
  removeMany: (ids: string[], family_id: string) => Promise<void>;
};

export const useFridgeStore = create<FridgeState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  load: async (family_id) => {
    set({ loading: true, error: null });
    try {
      set({ items: await fridgeApi.list(family_id), loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  create: async (payload) => {
    await fridgeApi.create(payload);
    await get().load(payload.family_id);
  },
  update: async (id, payload, family_id) => {
    await fridgeApi.update(id, payload);
    await get().load(family_id);
  },
  consume: async (id, quantityUsed, family_id) => {
    await fridgeApi.consume(id, quantityUsed);
    await get().load(family_id);
  },
  setQuantity: async (id, quantity, family_id) => {
    await fridgeApi.setQuantity(id, quantity);
    await get().load(family_id);
  },
  remove: async (id, family_id) => {
    await fridgeApi.remove(id);
    await get().load(family_id);
  },
  removeMany: async (ids, family_id) => {
    await fridgeApi.removeMany(ids);
    await get().load(family_id);
  },
}));
