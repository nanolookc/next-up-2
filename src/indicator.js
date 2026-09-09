import St from "gi://St";
import Clutter from "gi://Clutter";
import Pango from "gi://Pango";
import * as Calendar from "resource:///org/gnome/shell/ui/calendar.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

import PanelProgress from "./panel-progress.js";

export default class Indicator extends PanelMenu.Button {
  constructor(props) {
    super();
    this._confettiGicon = props.confettiGicon;
    this._openPrefsCallback = props.openPrefsCallback;
    this._earlyDoneCallback = null;
  }

  _init() {
    super._init(0.0, _("Next Up 2 Indicator"));

    // Reuse GNOME's clock-display structure so this pill has exactly the same
    // vertical inset and hover bounds as the centered clock.
    this.add_style_class_name("clock-display");
    this.set_style("-natural-hpadding: 0px; -minimum-hpadding: 0px;");

    this._calendarSource = new Calendar.DBusEventSource();

    this._loadGUI();
    this._initialiseMenu();
  }

  _loadGUI() {
    this._menuLayout = new St.Widget({
      style_class: "clock",
      layout_manager: new Clutter.BinLayout(),
      clip_to_allocation: true,
      y_align: Clutter.ActorAlign.FILL,
      y_expand: true,
      x_expand: true,
      x_align: Clutter.ActorAlign.FILL,
    });

    this._panelProgress = new PanelProgress();

    this._contentLayout = new St.BoxLayout({
      vertical: false,
      y_align: Clutter.ActorAlign.CENTER,
      x_expand: true,
      x_align: Clutter.ActorAlign.FILL,
      margin_left: 12,
      margin_right: 12,
    });

    this.icon = new St.Icon({
      icon_name: "alarm-symbolic",
      style_class: "system-status-icon",
    });

    // Ensure the label truncates neatly with CSS
    this.text = new St.Label({
      text: "Loading",
      x_expand: true,
      x_align: Clutter.ActorAlign.FILL,
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
      style: "text-overflow: ellipsis; white-space: nowrap;",
    });
    this.text.clutter_text.ellipsize = Pango.EllipsizeMode.END;
    this.text.clutter_text.single_line_mode = true;

    this._contentLayout.add_child(this.icon);
    this._contentLayout.add_child(this.text);

    this._menuLayout.add_child(this._panelProgress.actor);
    this._menuLayout.add_child(this._contentLayout);

    this.add_child(this._menuLayout);
  }

  _initialiseMenu() {
    // 1. Create a custom container for our side-by-side buttons
    this._actionBox = new PopupMenu.PopupBaseMenuItem({ reactive: false });
    
    const buttonBoxLayout = new St.BoxLayout({
      vertical: false,
      x_expand: true,
      x_align: Clutter.ActorAlign.FILL,
    });

    // 2. Complete Task Button
    this._completeBtn = new St.Button({
      style_class: 'button',
      label: 'Complete Task',
      x_expand: true,
      reactive: false, // Disabled by default
      opacity: 128,    // Greyed out visually by default
      style: 'margin-right: 4px; padding: 6px 12px; border-radius: 6px; text-align: center;'
    });
    
    this._completeBtn.connect('clicked', () => {
      if (this._earlyDoneCallback && this._completeBtn.reactive) {
        this._earlyDoneCallback();
        this.menu.close();
      }
    });

    // 3. Open Calendar Button
    this._calendarBtn = new St.Button({
      style_class: 'button',
      label: 'Open Calendar',
      x_expand: true,
      style: 'margin-left: 4px; padding: 6px 12px; border-radius: 6px; text-align: center;'
    });

    this._calendarBtn.connect('clicked', () => {
      this.menu.close();
      Main.panel.toggleCalendar();
    });

    buttonBoxLayout.add_child(this._completeBtn);
    buttonBoxLayout.add_child(this._calendarBtn);
    this._actionBox.add_child(buttonBoxLayout);

    // 4. Add items to the drop-down menu
    this.menu.addMenuItem(this._actionBox);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const settingsItem = new PopupMenu.PopupMenuItem(_("Settings"));
    settingsItem.connect("activate", () => {
      this._openPrefsCallback();
    });
    this.menu.addMenuItem(settingsItem);
  }

  setText(text) {
    this.text.set_text(text);
  }

  setProgress(fraction, color) {
    this._panelProgress.setProgress(fraction, color);
  }

  hideProgress() {
    this._panelProgress.hideProgress();
  }

  showAlarmIcon() {
    this.icon.set_icon_name("alarm-symbolic");
    this.icon.show();
  }

  showConfettiIcon(showIcon = true) {
    if (showIcon) {
      this.icon.set_gicon(this._confettiGicon);
      this.icon.show();
    } else {
      this.icon.hide();
    }
  }

  setupEarlyCompletion(enable, callback) {
    if (enable && callback) {
      this._completeBtn.reactive = true;
      this._completeBtn.opacity = 255; // Fully opaque (enabled)
      this._earlyDoneCallback = callback;
    } else {
      this._completeBtn.reactive = false;
      this._completeBtn.opacity = 128; // Greyed out (disabled)
      this._earlyDoneCallback = null;
    }
  }

  // Memory Leak Fix for the Calendar Data Source
  destroy() {
    if (this._calendarSource) {
      this._calendarSource.destroy();
      this._calendarSource = null;
    }
    this._panelProgress.destroy();
    this._panelProgress = null;
    super.destroy();
  }
}
