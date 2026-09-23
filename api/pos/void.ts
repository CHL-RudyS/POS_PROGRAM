import { route } from "../_lib/http";
import { voidTransaction } from "../_lib/transactions";

export default route({ POST: voidTransaction });
