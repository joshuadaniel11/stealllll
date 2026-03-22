import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./tests/support/alias-loader.mjs", pathToFileURL("./"));
