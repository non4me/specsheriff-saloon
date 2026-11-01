/** @spec s-pnwehzrzuhuem8y */
export type Room = {
  number: number;
  price: number;
};

/** @spec s-sypqtqmjnaadg9g */
export type Booking = {
  room: number;
  madeAt: string;
  regular: string;
};

/** @spec s-f3kv8352za6w2un */
export type Supply = {
  name: string;
  price: number;
  inStock: number;
};

/** @spec s-vugzkbduqu86uhr */
export type OrderLine = {
  supply: string;
  quantity: number;
};

/** @spec s-6zwzkthktpq6c3c */
export type Tab = {
  regular: string;
  limit: number;
};

/** @spec s-2896rux5emnnwpy */
export type JournalEntry = {
  regular: string;
  entryKind: "charge" | "repayment";
  amount: number;
  acceptedAt: string;
};

/** @spec s-ehcz87hd3ygcjtp */
export type Charge = {
  regular: string;
  amount: number;
};

/** @spec s-gj3c6xu7mtvmgfm */
export type Repayment = {
  regular: string;
  amount: number;
};

/** @spec s-6dg6rvnzg7xmcm9 */
export type Order = {
  regular: string;
  lines: OrderLine[];
};
