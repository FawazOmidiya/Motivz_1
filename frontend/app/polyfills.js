// Ensures btoa/atob are available in all JS environments (required for Supabase and base64 operations)
import { encode as btoa, decode as atob } from "base-64";

if (typeof global.btoa === "undefined") global.btoa = btoa;
if (typeof global.atob === "undefined") global.atob = atob;
