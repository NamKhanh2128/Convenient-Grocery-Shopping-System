import { create } from "zustand";
import { shoppingApi, type ShoppingCreateItem, type ShoppingListDetail } from "@/modules/shopping/api/shoppingApi";
import type { ShoppingType } from "@/types";
import { getErrorMessage } from "@/shared/utils/errors";

type ShoppingState = {
  lists: ShoppingListDetail[];
  loading: boolean;
  error: string | null;
  load: (family_id: string) => Promise<void>;
  create: (payload: { family_id: string; title: string; plan_date: string; list_type: ShoppingType; created_by: string; items: ShoppingCreateItem[]; share_member_ids?: string[] }) => Promise<void>;
  recordPurchase: (id: string, boughtQuantity: number, family_id: string) => Promise<void>;
  addItem: (shopping_list_id: string, payload: ShoppingCreateItem, family_id: string) => Promise<void>;
  deleteItems: (shopping_list_id: string, itemIds: string[], family_id: string) => Promise<void>;
  complete: (shopping_list_id: string, family_id: string) => Promise<void>;
};

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  lists: [],
  loading: false,
  error: null,
  load: async (family_id) => {
    set({ loading: true, error: null });
    try {
      set({ lists: await shoppingApi.list(family_id), loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  create: async (payload) => {
    await shoppingApi.create(payload);
    await get().load(payload.family_id);
  },
  recordPurchase: async (id, boughtQuantity, family_id) => {
    await shoppingApi.recordPurchase(id, boughtQuantity);
    await get().load(family_id);
  },
  addItem: async (shopping_list_id, payload, family_id) => {
    await shoppingApi.upsertItem(shopping_list_id, payload);
    await get().load(family_id);
  },
  deleteItems: async (shopping_list_id, itemIds, family_id) => {
    await shoppingApi.deleteItems(shopping_list_id, itemIds);
    set((state) => ({
      lists: state.lists.map((list) =>
        list.shopping_list_id === shopping_list_id
          ? { ...list, items: list.items.filter((item) => !itemIds.includes(item.id)) }
          : list,
      ),
    }));
    await get().load(family_id);
  },
  complete: async (shopping_list_id, family_id) => {
    await shoppingApi.complete(shopping_list_id);
    await get().load(family_id);
  },
}));
