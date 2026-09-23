import { login } from "../_lib/auth";
import { route } from "../_lib/http";

export default route({ POST: login });
