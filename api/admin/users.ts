import { route } from "../_lib/http";
import { createUser, listUsers } from "../_lib/users";

export default route({ GET: listUsers, POST: createUser });
