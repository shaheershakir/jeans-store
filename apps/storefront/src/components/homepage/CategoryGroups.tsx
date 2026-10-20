import Image from 'next/image'
import Link from 'next/link'
import type { HomepageConfig } from '@/lib/constants'

const BOTTOMS_CATEGORIES = new Set(['trackpants', 'sweatpants'])

const categoryLink =
  'flex min-h-[44px] items-center justify-between gap-2 border-b border-[#ecebe6] px-1 py-2 text-[12px] font-medium leading-[1.3] text-[#273238] no-underline transition-colors hover:text-[#b5c8d2] max-[640px]:min-h-[42px] max-[640px]:text-[11px]'

const categoryArrow = 'shrink-0 text-[#71808a]'

interface CategoryGroupsProps {
  config: HomepageConfig['categories']
  onSelectCategory: (category: string) => void
}

export default function CategoryGroups({ config, onSelectCategory }: CategoryGroupsProps) {
  const groups = [
    {
      id: 'tees',
      title: 'T-shirts',
      items: config.items.filter((category) => !BOTTOMS_CATEGORIES.has(category.id))
    },
    {
      id: 'bottoms',
      title: 'Bottoms',
      items: config.items.filter((category) => BOTTOMS_CATEGORIES.has(category.id))
    }
  ].filter((group) => group.items.length > 0)

  return (
    <div className="grid grid-cols-2 gap-[clamp(14px,2.4vw,30px)] max-[820px]:gap-3.5 max-[640px]:grid-cols-1">
      {groups.map((group) => {
        const featuredImage = group.items.find((category) => category.img?.trim())

        return (
          <section key={group.id} className="min-w-0 bg-white">
            <div className="relative min-h-[190px] aspect-[16/8.5] overflow-hidden bg-[#314c5d] max-[820px]:min-h-[160px] max-[640px]:min-h-[145px] max-[640px]:aspect-[16/7.5]">
              {featuredImage && (
                <Image
                  src={featuredImage.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover object-[center_38%]"
                />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(13,22,27,0.68),rgba(13,22,27,0.02)_72%)]" />
              <div className="absolute inset-x-5 bottom-[18px] text-white max-[640px]:inset-x-4 max-[640px]:bottom-3.5">
                <h3 className="mb-1 font-serif text-[clamp(24px,3.2vw,34px)] font-medium leading-[1.05] tracking-[-0.03em]">
                  {group.title}
                </h3>
                <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/85">
                  {group.items.length} {group.items.length === 1 ? 'category' : 'categories'}
                </span>
              </div>
            </div>

            <nav
              className="grid grid-cols-2 px-[18px] pt-2 pb-3 max-[820px]:px-3 max-[640px]:px-3.5 max-[640px]:pt-[5px] max-[640px]:pb-2.5"
              aria-label={`${group.title} categories`}
            >
              {group.items.map((category) => (
                <Link
                  key={category.id}
                  href={`/shop/${category.id}`}
                  className={categoryLink}
                  onClick={() => onSelectCategory(category.id)}
                >
                  <span>{category.label}</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    aria-hidden="true"
                    className={categoryArrow}
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </nav>
          </section>
        )
      })}
    </div>
  )
}
