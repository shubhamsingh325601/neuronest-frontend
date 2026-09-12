"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Mail } from "lucide-react";
import { siteConfig } from "@/content/site";
import { subscribeNewsletter } from "@/app/actions";

export function SiteFooter() {
  const { brand, footer } = siteConfig;
  const [state, formAction, isPending] = useActionState(subscribeNewsletter, {});

  const renderSocialIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "instagram":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width="18"
            height="18"
          >
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
          </svg>
        );
      case "facebook":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width="18"
            height="18"
          >
            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            width="18"
            height="18"
          >
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V8h4v1.5" />
            <rect x="2" y="9" width="4" height="12" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        );
      case "email":
        return <Mail size={18} aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <footer className="site-footer">
      <div className="footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none">
          <path
            d="M0,60 C240,14 480,14 720,52 C960,90 1200,104 1440,64 L1440,110 L0,110 Z"
            fill="var(--color-sage-tint)"
          />
          <path
            d="M0,86 C280,48 520,110 800,84 C1080,58 1280,66 1440,90 L1440,110 L0,110 Z"
            fill="var(--color-sage)"
            opacity="0.25"
          />
        </svg>
      </div>

      <div className="container footer-main">
        <div className="footer-col footer-col--brand">
          <Link href="/" className="footer-brand" aria-label="NeuroNest home">
            <span className="brand__mark brand__mark--lg">
              <Image
                src="/assets/icons/logo.png"
                alt={brand.logoAlt}
                width={48}
                height={48}
              />
            </span>
            <span className="footer-brand__text">
              <span className="footer-brand__name">{brand.name}</span>
              <span className="footer-brand__tagline">{brand.tagline}</span>
            </span>
          </Link>
          <p className="footer-col__blurb">{footer.blurb}</p>
          <ul className="footer-social" aria-label="NeuroNest on social media">
            {footer.social.map((soc) => (
              <li key={soc.label}>
                <a
                  href={soc.href}
                  aria-label={soc.label}
                  className="footer-social__link"
                  target={soc.href.startsWith("http") ? "_blank" : undefined}
                  rel={soc.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {renderSocialIcon(soc.label)}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav className="footer-col" aria-labelledby="footer-explore-title">
          <p className="footer-col__title" id="footer-explore-title">
            {footer.exploreTitle}
          </p>
          <ul className="footer-col__links">
            {footer.explore.map((link) => (
              <li key={link.label}>
                {link.href.startsWith("/") ? (
                  <Link href={link.href}>{link.label}</Link>
                ) : (
                  <a href={link.href}>{link.label}</a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <nav className="footer-col" aria-labelledby="footer-support-title">
          <p className="footer-col__title" id="footer-support-title">
            {footer.supportTitle}
          </p>
          <ul className="footer-col__links">
            {footer.support.map((link) => (
              <li key={link.label}>
                {link.href.startsWith("/") ? (
                  <Link href={link.href}>{link.label}</Link>
                ) : (
                  <a href={link.href}>{link.label}</a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer-col footer-col--news">
          <p className="footer-col__title">{footer.newsletter.title}</p>
          <p className="footer-col__blurb">{footer.newsletter.body}</p>
          <form className="footer-news" action={formAction}>
            <label className="visually-hidden" htmlFor="footer-news-email">
              {footer.newsletter.label}
            </label>
            <div className="footer-news__row">
              <input
                type="email"
                id="footer-news-email"
                name="email"
                autoComplete="email"
                required
                placeholder={footer.newsletter.placeholder}
                disabled={isPending || state?.success}
              />
              <button
                className="btn btn--primary btn--pill footer-news__btn"
                type="submit"
                aria-label={footer.newsletter.buttonText}
                disabled={isPending || state?.success}
              >
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
            {state?.message && (
              <p
                className={
                  state.success ? "form-status text-green-700 mt-2 text-sm" : "form-status text-red-600 mt-2 text-sm"
                }
                role="status"
              >
                {state.message}
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="container footer-bottom">
        <p className="footer-bottom__copy">{footer.copyright}</p>
        <ul className="footer-bottom__links">
          {footer.legal.map((item) => (
            <li key={item.label}>
              {item.href.startsWith("/") ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          ))}
        </ul>
        <p className="footer-bottom__made">
          {footer.madeWithPrefix}{" "}
          <Heart className="heart-accent" size={14} aria-hidden="true" /> {footer.madeWithSuffix}
        </p>
      </div>
    </footer>
  );
}
