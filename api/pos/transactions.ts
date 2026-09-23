import { route } from "../_lib/http";
import { createTransaction, listTransactions } from "../_lib/transactions";

export default route({ GET: listTransactions, POST: createTransaction });
