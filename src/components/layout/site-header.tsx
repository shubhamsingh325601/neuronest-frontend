"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { brand, nav } = siteConfig;

  // Close nav on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className={cn("site-header", isOpen && "is-nav-open")} id="top">
      <div className="container site-header__inner">
        <Link href="/" className="brand" aria-label="NeuroNest home">
          <span className="brand__mark">
            <Image
              src="/assets/icons/logo.png"
              alt={brand.logoAlt}
              width={38}
              height={38}
              priority
            />
          </span>
          <span className="brand__text">
            <span className="brand__name">{brand.name}</span>
            <span className="brand__tagline">{brand.tagline}</span>
          </span>
        </Link>

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={isOpen}
          aria-controls="primary-nav"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="icon nav-toggle__icon-close" aria-hidden="true" />
          ) : (
            <Menu className="icon nav-toggle__icon-open" aria-hidden="true" />
          )}
          <span className="visually-hidden">Menu</span>
        </button>

        <nav
          className={cn("primary-nav", isOpen && "is-open")}
          id="primary-nav"
          aria-label="Primary"
        >
          <ul className="primary-nav__list">
            {nav.links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={isActive ? "font-bold text-[#E2775B]" : ""}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            className="btn btn--primary btn--pill primary-nav__cta"
            href={nav.cta.href}
            onClick={() => setIsOpen(false)}
          >
            {nav.cta.label}
          </Link>
        </nav>

        <Link
          className="btn btn--primary btn--pill site-header__cta"
          href={nav.cta.href}
        >
          <span>{nav.cta.label}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
