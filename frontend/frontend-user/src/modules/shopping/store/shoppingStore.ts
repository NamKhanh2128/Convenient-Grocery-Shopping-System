import { create } from "zustand";

import { shoppingApi, type ShoppingCreateItem, type ShoppingListDetail } from "@/modules/shopping/api/shoppingApi";

import type { ShoppingType } from "@/types";

import { getErrorMessage } from "@/shared/utils/errors";



type ShoppingState = {

  lists: ShoppingListDetail[];

  currentList: ShoppingListDetail | null;

  loading: boolean;

  error: string | null;

  load: (family_id: string) => Promise<void>;

  loadDetail: (shopping_list_id: string, family_id: string) => Promise<void>;

  create: (payload: {

    family_id: string;

    title: string;

    plan_date: string;

    list_type: ShoppingType;

    created_by: string;

    items: ShoppingCreateItem[];

    share_member_ids?: string[];

  }) => Promise<ShoppingListDetail>;

  recordPurchase: (id: string, boughtQuantity: number, family_id: string, shopping_list_id?: string) => Promise<void>;

  addItem: (shopping_list_id: string, payload: ShoppingCreateItem, family_id: string) => Promise<void>;

  updateItem: (shopping_list_id: string, item_id: string, quantity: number, family_id: string) => Promise<void>;

  deleteItems: (shopping_list_id: string, itemIds: string[], family_id: string) => Promise<void>;

  deleteList: (shopping_list_id: string, family_id: string) => Promise<void>;

  complete: (shopping_list_id: string, family_id: string) => Promise<void>;

};



export const useShoppingStore = create<ShoppingState>((set, get) => ({

  lists: [],

  currentList: null,

  loading: false,

  error: null,



  load: async (family_id) => {

    set({ loading: true, error: null });

    try {

      const lists = await shoppingApi.list(family_id);

      set({ lists, loading: false });

    } catch (error) {

      set({ error: getErrorMessage(error), loading: false });

      throw error;

    }

  },



  loadDetail: async (shopping_list_id, family_id) => {

    set({ loading: true, error: null });

    try {

      const currentList = await shoppingApi.detail(shopping_list_id, family_id);

      set((state) => ({

        currentList,

        lists: state.lists.some((l) => l.shopping_list_id === shopping_list_id)

          ? state.lists.map((l) => (l.shopping_list_id === shopping_list_id ? currentList : l))

          : [currentList, ...state.lists],

        loading: false,

      }));

    } catch (error) {

      set({ error: getErrorMessage(error), loading: false });

      throw error;

    }

  },



  create: async (payload) => {

    const list = await shoppingApi.create(payload);

    set((state) => ({

      lists: [list, ...state.lists.filter((l) => l.shopping_list_id !== list.shopping_list_id)],

      currentList: list,

    }));

    return list;

  },



  recordPurchase: async (id, boughtQuantity, family_id, shopping_list_id) => {

    await shoppingApi.recordPurchase(id, boughtQuantity, family_id, shopping_list_id);

    if (shopping_list_id) {

      await get().loadDetail(shopping_list_id, family_id);

    } else {

      await get().load(family_id);

    }

  },



  addItem: async (shopping_list_id, payload, family_id) => {

    await shoppingApi.upsertItem(shopping_list_id, payload, family_id);

    await get().loadDetail(shopping_list_id, family_id);

  },



  updateItem: async (shopping_list_id, item_id, quantity, family_id) => {

    await shoppingApi.updateItem(shopping_list_id, item_id, quantity, family_id);

    await get().loadDetail(shopping_list_id, family_id);

  },



  deleteItems: async (shopping_list_id, itemIds, family_id) => {

    await shoppingApi.deleteItems(shopping_list_id, itemIds, family_id);

    await get().loadDetail(shopping_list_id, family_id);

  },



  deleteList: async (shopping_list_id, family_id) => {

    await shoppingApi.deleteList(shopping_list_id, family_id);

    set((state) => ({

      lists: state.lists.filter((l) => l.shopping_list_id !== shopping_list_id),

      currentList: state.currentList?.shopping_list_id === shopping_list_id ? null : state.currentList,

    }));

  },



  complete: async (shopping_list_id, family_id) => {

    await shoppingApi.complete(shopping_list_id, family_id);

    await get().load(family_id);

  },

}));


