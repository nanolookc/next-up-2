/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GLib from "gi://GLib";
import GObject from "gi://GObject";
import Gio from "gi://Gio";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import Indicator from "./src/indicator.js";
import { getCountdownProgress } from "./src/countdown-progress.js";
import * as DateHelperFunctions from "./src/date.js";
import PanelLayout from "./src/panel-layout.js";
import {
  applyDevelopmentHover,
  getDevelopmentPreview,
  scheduleDevelopmentScreenshot,
} from "./src/development-preview.js";

const IndicatorInstance = GObject.registerClass(Indicator);

export default class NextUpExtension extends Extension {
  enable() {
    // 1. Initialize local memory for "Early Completion" dismissals
    this._dismissedEvents = new Set();

    this._indicator = new IndicatorInstance({
      confettiGicon: Gio.icon_new_for_string(
        this.path + "/assets/party-popper.png"
      ),
      openPrefsCallback: this.openPreferences.bind(this),
    });
    this._panelLayout = new PanelLayout(this._indicator.container);

    this._settings = this.getSettings();

    // Wait 3 seconds before loading the indicator
    // So that it isn't loaded too early and positioned after other elements in the panel
    this.delaySourceId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      3,
      () => {
        this.loadIndicator();
        applyDevelopmentHover(this._indicator);
        this.refreshIndicator();
        this._developmentScreenshotSourceId =
          scheduleDevelopmentScreenshot(() => {
            this._developmentScreenshotSourceId = null;
          });
        this._startLoop();
        return false;
      }
    );
  }

  _startLoop() {
    this.sourceId = GLib.timeout_add_seconds(
      GLib.PRIORITY_DEFAULT,
      5, // seconds to wait
      () => {
        this.refreshIndicator();
        return GLib.SOURCE_CONTINUE;
      }
    );
  }

  loadIndicator() {
    this._panelLayout.attach();
  }

  unloadIndicator() {
    this._panelLayout.detach();
  }

  refreshIndicator() {
    const showAllDayEvents = this._settings.get_boolean("show-all-day-events");
    let todaysEvents = DateHelperFunctions.getTodaysEvents(
      this._indicator._calendarSource,
      showAllDayEvents
    );

    // 2. Pre-filter Excluded Keywords & Dismissed Events
    const excludedStr = this._settings.get_string("excluded-keywords").toLowerCase();
    const excludedWords = excludedStr.split(',').map(w => w.trim()).filter(w => w.length > 0);

    todaysEvents = todaysEvents.filter(event => {
      const summary = (event.summary || "").toLowerCase();
      // Filter keywords
      if (excludedWords.some(word => summary.includes(word))) return false;
      
      // Filter dismissed events
      const eventKey = summary + (event.date ? event.date.getTime() : "");
      if (this._dismissedEvents.has(eventKey)) return false;

      return true;
    });

    let eventStatus =
      getDevelopmentPreview(new Date()) ??
      DateHelperFunctions.getNextEventsToDisplay(todaysEvents);

    // 3. Hide Next When Active
    if (this._settings.get_boolean("hide-next-when-active") && eventStatus.currentEvent) {
      eventStatus.nextEvent = null;
    }

    // 4. Generate Text (Custom 'Done for today' override)
    let text = "";
    if (!eventStatus.currentEvent && !eventStatus.nextEvent) {
      text = this._settings.get_string("done-text");
      const showConfetti = this._settings.get_boolean("show-confetti-icon");
      this._indicator.showConfettiIcon(showConfetti);
    } else {
      const textFormat = this._settings.get_int("text-format");
      const layoutStyle = this._settings.get_int("layout-style");
      text = DateHelperFunctions.eventStatusToIndicatorText(eventStatus, textFormat, layoutStyle);
      this._indicator.showAlarmIcon();
    }
    
    this._indicator.setText(text);

    // 5. Update the theme-safe countdown bar. It targets the next event's
    // start whenever one is available, including while another event is active.
    // A lone current event counts down to its end.
    const progress = getCountdownProgress(
      eventStatus,
      new Date(),
      this._settings.get_int("progress-orange-threshold"),
      this._settings.get_int("progress-yellow-threshold"),
      this._settings.get_int("progress-red-threshold")
    );
    if (progress === null) {
      this._indicator.hideProgress();
    } else {
      const progressColor = this._settings.get_string(
        `progress-${progress.colorBand}-color`
      );
      this._indicator.setProgress(progress.fraction, progressColor);
    }

    // 6. Push Early Completion state down to the indicator
    if (eventStatus.currentEvent) {
      const currentSummary = (eventStatus.currentEvent.summary || "").toLowerCase();
      const eventKey = currentSummary + (eventStatus.currentEvent.date ? eventStatus.currentEvent.date.getTime() : "");
      this._indicator.setupEarlyCompletion(
        this._settings.get_boolean("enable-early-completion"), 
        () => {
          this._dismissedEvents.add(eventKey);
          this.refreshIndicator(); // Instantly refresh GUI
        }
      );
    } else {
      this._indicator.setupEarlyCompletion(false, null);
    }
  }

  disable() {
    if (this.sourceId) {
      GLib.Source.remove(this.sourceId);
      this.sourceId = null;
    }

    if (this.delaySourceId) {
      GLib.Source.remove(this.delaySourceId);
      this.delaySourceId = null;
    }

    if (this._developmentScreenshotSourceId) {
      GLib.Source.remove(this._developmentScreenshotSourceId);
      this._developmentScreenshotSourceId = null;
    }

    this.unloadIndicator();
    this._indicator.destroy();
    this._indicator = null;
    this._panelLayout = null;

    this._settings = null;

    this._dismissedEvents.clear();
    this._dismissedEvents = null;
  }
}
