'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const footerLink =
  'text-[12px] leading-[1.6] text-[rgba(248,247,243,0.76)] no-underline transition-colors hover:text-[#b5c8d2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#31586f]'

const footerHeading =
  'mb-3.5 text-[9px] font-semibold uppercase leading-[1.2] tracking-[0.14em] text-[rgba(248,247,243,0.5)]'

const footerColumn = 'min-w-0'

export default function Footer() {
  const pathname = usePathname()
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/onboarding' ||
    pathname === '/checkout' ||
    pathname?.endsWith('/checkout') ||
    pathname?.includes('/checkout/')
  ) {
    return null
  }

  return (
    <footer className="border-t border-line bg-[#172126] px-[clamp(20px,5vw,72px)] pt-[52px] pb-[max(18px,env(safe-area-inset-bottom,0px))] text-[#f8f7f3] max-[820px]:px-5 max-[820px]:pt-[38px]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-[minmax(180px,1fr)_minmax(300px,1.6fr)_minmax(180px,0.8fr)] gap-[clamp(28px,5vw,76px)] pb-[42px] max-[820px]:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] max-[820px]:gap-x-[18px] max-[820px]:gap-y-7 max-[820px]:pb-7">
        <div className="max-[820px]:col-span-full">
          <Link href="/" aria-label="TEESGARAGE home" className="inline-block">
            <Image
              src="/teesgarage-logo.svg"
              alt="TEESGARAGE"
              width={160}
              height={48}
              className="h-8 w-auto max-w-[152px] object-contain object-left grayscale brightness-0 invert"
            />
          </Link>
          <p className="my-4 max-w-[230px] text-[13px] leading-[1.6] text-[rgba(248,247,243,0.68)]">
            Heavyweight tees and everyday bottomwear.
          </p>
          <Link
            href="/search"
            className={`inline-block border-b border-[rgba(248,247,243,0.45)] pb-[5px] ${footerLink}`}
          >
            Search the store
          </Link>
        </div>

        <nav
          className="grid grid-cols-2 gap-[22px] max-[820px]:col-span-full max-[820px]:gap-4"
          aria-label="Shop categories"
        >
          <div className={footerColumn}>
            <h3 className={footerHeading}>T-SHIRTS</h3>
            <ul className="m-0 grid list-none gap-[7px] p-0">
              {[
                ['Stripes', 'stripes'],
                ['Fullsleeve', 'fullsleeve'],
                ['Drsleeve', 'drsleeve'],
                ['Printed tees', 'printed-tees'],
                ['Ringer tees', 'ringer-tees'],
                ['Henley', 'henley'],
                ['Waffle', 'waffle']
              ].map(([label, slug]) => (
                <li key={slug} className="m-0">
                  <Link href={`/shop/${slug}`} className={footerLink}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className={footerColumn}>
            <h3 className={footerHeading}>BOTTOMS</h3>
            <ul className="m-0 grid list-none gap-[7px] p-0">
              <li className="m-0">
                <Link href="/shop/trackpants" className={footerLink}>
                  Trackpants
                </Link>
              </li>
              <li className="m-0">
                <Link href="/shop/sweatpants" className={footerLink}>
                  Sweatpants
                </Link>
              </li>
              <li className="m-0">
                <Link href="/shop" className={footerLink}>
                  All products
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        <div className={footerColumn}>
          <h3 className={footerHeading}>CUSTOMER CARE</h3>
          <ul className="m-0 grid list-none gap-[7px] p-0">
            <li className="m-0">
              <a href="mailto:concierge@teesgarage.in" className={footerLink}>
                concierge@teesgarage.in
              </a>
            </li>
            <li className="m-0">
              <Link href="/bag" className={footerLink}>
                Shopping bag
              </Link>
            </li>
            <li className="m-0">
              <Link href="/bag/checkout" className={footerLink}>
                Checkout
              </Link>
            </li>
            <li className="m-0">
              <span className="text-[12px] leading-[1.6] text-[rgba(248,247,243,0.76)]">
                7-day doorstep exchanges
              </span>
            </li>
            <li className="m-0">
              <span className="text-[12px] leading-[1.6] text-[rgba(248,247,243,0.76)]">
                Paid delivery based on delivery destination
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1180px] justify-between gap-4 border-t border-[rgba(248,247,243,0.16)] pt-[18px] text-[9px] uppercase leading-[1.4] tracking-[0.06em] text-[rgba(248,247,243,0.45)] max-[820px]:flex-col max-[820px]:gap-1.5">
        <span>© {new Date().getFullYear()} TEESGARAGE</span>
        <span>Made for everyday wear</span>
      </div>
    </footer>
  )
}
