/**
 * Toast helper — thin re-export of `sonner` so application code has a single,
 * stable import point. The `<Toaster />` itself is mounted in `app/layout.tsx`.
 *
 * Usage: `import { toast } from "@/lib/toast";`
 */
export { toast } from "sonner";
export type { ExternalToast } from "sonner";
