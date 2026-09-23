import { route } from "../_lib/http";
import { updateUser } from "../_lib/users";

export default route({ POST: updateUser });
