import { json, route } from "@/lib/api";
import { getProgress } from "@/lib/progress";

export const GET = route(async () => json(await getProgress()));
