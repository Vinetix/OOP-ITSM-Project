// Services, categories and skills, one tab each. The tab lives in the URL
// (?tab=categories), so refresh and shared links keep it.
import { useSearchParams } from 'react-router'
import { PageHeader } from '@/components/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CategoriesTab } from './CategoriesTab'
import { ServicesTab } from './ServicesTab'
import { SkillsTab } from './SkillsTab'

const TABS = [
  { value: 'services', label: 'Services', Panel: ServicesTab },
  { value: 'categories', label: 'Categories', Panel: CategoriesTab },
  { value: 'skills', label: 'Skills', Panel: SkillsTab },
]

export default function CatalogPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'services'

  function changeTab(next) {
    // each tab keeps its own search and filters, so the URL only needs the tab
    setParams(next === 'services' ? {} : { tab: next }, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Services & categories"
        description="What can break, what kind of problem it is, and who has the skills to fix it."
      />
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList variant="line" className="mb-6">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="px-3 text-[0.95rem]">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map(({ value, Panel }) => (
          <TabsContent key={value} value={value}>
            <Panel />
          </TabsContent>
        ))}
      </Tabs>
    </>
  )
}
