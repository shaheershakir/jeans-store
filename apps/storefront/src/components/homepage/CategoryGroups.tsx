import Image from 'next/image'
import Link from 'next/link'
import type { HomepageConfig } from '@/lib/constants'

const BOTTOMS_CATEGORIES = new Set(['trackpants', 'sweatpants'])

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
    <div className="hp-category-groups">
      {groups.map((group) => {
        const featuredImage = group.items.find((category) => category.img?.trim())

        return (
          <section key={group.id} className={`hp-category-group hp-category-group-${group.id}`}>
            <div className="hp-category-group-media">
              {featuredImage && (
                <Image
                  src={featuredImage.img}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              )}
              <div className="hp-category-group-scrim" />
              <div className="hp-category-group-heading">
                <h3>{group.title}</h3>
                <span>{group.items.length} {group.items.length === 1 ? 'category' : 'categories'}</span>
              </div>
            </div>

            <nav className="hp-category-links" aria-label={`${group.title} categories`}>
              {group.items.map((category) => (
                <Link
                  key={category.id}
                  href={`/shop/${category.id}`}
                  className="hp-category-link"
                  onClick={() => onSelectCategory(category.id)}
                >
                  <span>{category.label}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
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
