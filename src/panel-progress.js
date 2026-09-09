import Clutter from "gi://Clutter";
import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

const FILL_OPACITY = 102;
const TRACK_BACKGROUND_OPACITY = 24;
const TRACK_OUTLINE_OPACITY = 82;

function colorToCss(color, opacity = color.alpha) {
  return `rgba(${color.red}, ${color.green}, ${color.blue}, ${opacity / 255})`;
}

export default class PanelProgress {
  constructor() {
    const panelForeground = Main.panel.get_theme_node().get_foreground_color();

    this._fraction = 0;
    this._hasProgress = false;

    this._fill = new St.Widget({
      opacity: FILL_OPACITY,
      reactive: false,
    });

    this._outline = new St.Widget({
      reactive: false,
      style: [
        `box-shadow: inset 0 0 0 1px ${colorToCss(panelForeground, TRACK_OUTLINE_OPACITY)};`,
        "border-radius: 999px;",
      ].join(" "),
    });

    this.actor = new St.Widget({
      layout_manager: new Clutter.FixedLayout(),
      x_align: Clutter.ActorAlign.FILL,
      x_expand: true,
      y_align: Clutter.ActorAlign.FILL,
      y_expand: true,
      clip_to_allocation: true,
      reactive: false,
      style: [
        `background-color: ${colorToCss(panelForeground, TRACK_BACKGROUND_OPACITY)};`,
        "border-radius: 999px;",
      ].join(" "),
    });
    this.actor.add_child(this._fill);
    this.actor.add_child(this._outline);
    this.actor.hide();

    this._allocationSignalId = this.actor.connect("notify::allocation", () => {
      this._updateFillWidth();
    });
  }

  setProgress(fraction, color) {
    this._fraction = Math.min(1, Math.max(0, fraction));
    this._hasProgress = true;
    this._fill.set_style(
      `background-color: ${color}; border-radius: 999px;`
    );
    this._fill.show();
    this.actor.show();
    this._updateFillWidth();
  }

  hideProgress() {
    this._hasProgress = false;
    this._fill.hide();
    this.actor.hide();
  }

  destroy() {
    this.actor.disconnect(this._allocationSignalId);
    this.actor.destroy();

    this._fill = null;
    this._outline = null;
    this.actor = null;
  }

  _updateFillWidth() {
    if (!this._hasProgress) {
      return;
    }

    const trackWidth = this.actor.get_width();
    const trackHeight = this.actor.get_height();
    this._fill.set_position(0, 0);
    this._fill.set_size(
      Math.round(trackWidth * this._fraction),
      trackHeight
    );
    this._outline.set_position(0, 0);
    this._outline.set_size(trackWidth, trackHeight);
  }
}
