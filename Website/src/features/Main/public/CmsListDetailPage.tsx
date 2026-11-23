import { CmsListDetail } from "@/components/marketing/CmsListDetail"
import type { ListPageSlug } from "@/config/cmsListDefaults"

export default function CmsListDetailPage({ kind }: { kind: ListPageSlug }) {
  return <CmsListDetail kind={kind} />
}
