import St from "gi://St";
import Clutter from "gi://Clutter";
import * as Calendar from "resource:///org/gnome/shell/ui/calendar.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

export default class Indicator extends PanelMenu.Button {
  constructor(props) {
    super();
    this._confettiGicon = props.confettiGicon;
    this._openPrefsCallback = props.openPrefsCallback;
  }

  _init() {
    super._init(0.0, _("Next Up 2 Indicator"));

    // Share the top-bar calendar's source. gnome-shell-calendar-server keeps one time range
    // for all clients, so a second source asking for today only makes the server miss
    // recurring events moved to another day and show them on their old day.
    const shellSource = Main.panel.statusArea.dateMenu?._eventSource;
    this._ownsCalendarSource = !shellSource;
    this._calendarSource = shellSource ?? new Calendar.DBusEventSource();

    this._loadGUI();
    this._initialiseMenu();

    // GNOME 50+ adds a menu gesture that would also handle our clicks.
    if (this._clickGesture) {
      this._clickGesture.set_enabled(false);
      this._calendarClickGesture = new Clutter.ClickGesture();
      this._calendarClickGesture.connect("recognize", (gesture) => {
        this._activate(gesture.get_button());
      });
      this.add_action(this._calendarClickGesture);
    }
  }

  _onDestroy() {
    if (this._calendarClickGesture) {
      this.remove_action(this._calendarClickGesture);
      this._calendarClickGesture = null;
    }
    // The shared source belongs to the Shell; extensions get disabled on every screen lock.
    if (this._ownsCalendarSource)
      this._calendarSource.destroy();
    this._calendarSource = null;
    super._onDestroy();
  }

  _loadGUI() {
    this._menuLayout = new St.BoxLayout({
      clip_to_allocation: true,
      x_align: Clutter.ActorAlign.START,
      y_align: Clutter.ActorAlign.CENTER,
      reactive: true,
      x_expand: true,
    });

    this._alarmIcon = new St.Icon({
      icon_name: "alarm-symbolic",
      style_class: "system-status-icon",
    });

    this.icon = this._alarmIcon;

    this.text = new St.Label({
      text: "Loading",
      y_expand: true,
      y_align: Clutter.ActorAlign.CENTER,
    });

    this._menuLayout.add_child(this.icon);
    this._menuLayout.add_child(this.text);
    this.add_child(this._menuLayout);

    return;
  }

  _initialiseMenu() {
    const settingsItem = new PopupMenu.PopupMenuItem(_("Settings"));
    settingsItem.connect("activate", () => {
      this._openPrefsCallback();
    });
    this.menu.addMenuItem(settingsItem);
  }

  setText(text) {
    this.text.set_text(text);
  }

  showAlarmIcon() {
    this.icon.set_icon_name("alarm-symbolic");
  }

  showConfettiIcon() {
    this.icon.set_gicon(this._confettiGicon);
  }

  _activate(button) {
    if (button === Clutter.BUTTON_PRIMARY || button === 0) {
      // Show calendar on left click or touch.
      if (this.menu.isOpen) {
        this.menu._getTopMenu().close();
      } else {
        Main.panel.toggleCalendar();
      }
    } else {
      // Show settings menu on right click.
      this.menu.toggle();
    }
  }

  vfunc_event(event) {
    if (this._calendarClickGesture) {
      return Clutter.EVENT_PROPAGATE;
    }

    if (
      event.type() == Clutter.EventType.TOUCH_END ||
      event.type() == Clutter.EventType.BUTTON_RELEASE
    ) {
      const button = event.type() === Clutter.EventType.TOUCH_END
        ? Clutter.BUTTON_PRIMARY
        : event.get_button();
      this._activate(button);
    }

    return Clutter.EVENT_PROPAGATE;
  }
}
