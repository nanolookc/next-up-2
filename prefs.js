"use strict";

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class NextUpExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    const panelRow = new Adw.ActionRow({ title: _("Panel to show indicator in") });
    group.add(panelRow);

    const dropdown = new Gtk.DropDown({
      model: Gtk.StringList.new([_("Left"), _("Center"), _("Right")]),
      valign: Gtk.Align.CENTER,
    });

    settings.bind(
      "which-panel",
      dropdown,
      "selected",
      Gio.SettingsBindFlags.DEFAULT
    );

    panelRow.add_suffix(dropdown);
    panelRow.activatable_widget = dropdown;

    const textRow = new Adw.ActionRow({
      title: _("Show current event in indicator text"),
    });
    group.add(textRow);

    const textDropdown = new Gtk.DropDown({
      model: Gtk.StringList.new([_("Don't show (old)"), _("Show")]),
      valign: Gtk.Align.CENTER,
    });

    settings.bind(
      "text-format",
      textDropdown,
      "selected",
      Gio.SettingsBindFlags.DEFAULT
    );

    textRow.add_suffix(textDropdown);
    textRow.activatable_widget = textDropdown;

    const allDayRow = new Adw.SwitchRow({
      title: _("Show all-day events"),
      subtitle: _("Include events without a specific time"),
    });
    group.add(allDayRow);

    settings.bind(
      "show-all-day-events",
      allDayRow,
      "active",
      Gio.SettingsBindFlags.DEFAULT
    );

    window.add(page);
  }
}
