import React from "react";
import {
  Signal,
  Wifi,
  BatteryMedium,
  UserRound,
  HeartHandshake,
  Wind,
  ChevronRight,
  House,
  Compass,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { ProgressRing } from "./progress-ring";
import { siteContent } from "@/lib/content";

export function PhoneMock() {
  const { phoneMock } = siteContent.howItWorks;

  return (
    <div className="phone">
      <span className="phone__button phone__button--power" />
      <span className="phone__button phone__button--vol" />
      <div className="phone__screen">
        <div className="phone__statusbar">
          <span className="phone__time">9:41</span>
          <span className="phone__signal">
            <Signal size={12} />
            <Wifi size={12} />
            <BatteryMedium size={14} />
          </span>
        </div>

        <div className="phone__app">
          <header className="phone__appbar">
            <span className="phone__hello-wrap">
              <span className="phone__hello">{phoneMock.greeting}</span>
              <span className="phone__date">{phoneMock.date}</span>
            </span>
            <span className="phone__avatar">
              <UserRound size={16} />
            </span>
          </header>

          <div className="phone__block">
            <p className="phone__label">{phoneMock.focusLabel}</p>
            <div className="phone__card phone__card--row">
              <span className="phone__card-icon phone__card-icon--coral">
                <HeartHandshake size={18} />
              </span>
              <span className="phone__card-text">
                <span className="phone__card-title">{phoneMock.focusTitle}</span>
                <span className="phone__card-body">{phoneMock.focusBody}</span>
              </span>
            </div>
          </div>

          <div className="phone__block">
            <p className="phone__label">{phoneMock.progressLabel}</p>
            <div className="phone__card phone__card--progress">
              <ProgressRing value={phoneMock.progressValue} />
              <p className="phone__note">{phoneMock.progressNote}</p>
            </div>
          </div>

          <div className="phone__block">
            <p className="phone__label">{phoneMock.recommendedLabel}</p>
            <div className="phone__card phone__card--row">
              <span className="phone__card-icon phone__card-icon--sage">
                <Wind size={18} />
              </span>
              <span className="phone__card-title">
                {phoneMock.recommendedTitle}
              </span>
              <ChevronRight size={16} className="phone__card-go" />
            </div>
          </div>
        </div>

        <nav className="phone__tabbar">
          <span className="phone__tab is-active">
            <House size={16} />
          </span>
          <span className="phone__tab">
            <Compass size={16} />
          </span>
          <span className="phone__tab">
            <Sparkles size={16} />
          </span>
          <span className="phone__tab">
            <UsersRound size={16} />
          </span>
          <span className="phone__tab">
            <UserRound size={16} />
          </span>
        </nav>
      </div>
    </div>
  );
}
